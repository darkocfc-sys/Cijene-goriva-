const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'latest.json');
const SEARCH_URL = 'https://www.gov.me/pretraga?q=cijene+goriva';
const BASE_URL = 'https://www.gov.me';

// Podrazumijevane (rezervne) cijene u slučaju da skrapovanje zakaže
const DEFAULT_PRICES = {
    bmb98: '1.54',
    bmb95: '1.50',
    dizel: '1.41',
    lozulje: '1.37'
};

async function fetchText(url) {
    const res = await fetch(url, {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status} za ${url}`);
    return res.text();
}

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status} za ${url}`);
    return res.json();
}

async function getCrnaGoraPrices() {
    try {
        const html = await fetchText(SEARCH_URL);
        const $ = cheerio.load(html);
        let articleUrl = null;

        $('a').each((_, el) => {
            const text = $(el).text().toLowerCase();
            const href = $(el).attr('href');
            if (text.includes('cijene goriva') || text.includes('naftnih derivata')) {
                if (href && !articleUrl) {
                    articleUrl = href.startsWith('http') ? href : BASE_URL + href;
                }
            }
        });

        if (!articleUrl) {
            console.warn('Članak sa cijenama nije pronađen na gov.me, koriste se rezervne cijene.');
            return { is_new_available: false, current: DEFAULT_PRICES, next: null };
        }

        const articleHtml = await fetchText(articleUrl);
        const $art = cheerio.load(articleHtml);
        const text = $art('body').text();

        const matchBmb98 = text.match(/(?:eurosuper|bmb)\s*(?:bmb)?\s*98[^\d]*(\d+[,.]\d+)/i);
        const matchBmb95 = text.match(/(?:eurosuper|bmb)\s*(?:bmb)?\s*95[^\d]*(\d+[,.]\d+)/i);
        const matchDizel = text.match(/Eurodizel[^\d]*(\d+[,.]\d+)/i);
        const matchLozulje = text.match(/Lož\s*ulje[^\d]*(\d+[,.]\d+)/i);

        const currentPrices = {
            bmb98: matchBmb98 ? matchBmb98[1].replace(',', '.') : DEFAULT_PRICES.bmb98,
            bmb95: matchBmb95 ? matchBmb95[1].replace(',', '.') : DEFAULT_PRICES.bmb95,
            dizel: matchDizel ? matchDizel[1].replace(',', '.') : DEFAULT_PRICES.dizel,
            lozulje: matchLozulje ? matchLozulje[1].replace(',', '.') : DEFAULT_PRICES.lozulje
        };

        const isNewAnnouncement = text.toLowerCase().includes('od utorka') || text.toLowerCase().includes('od ponoći');

        return {
            is_new_available: isNewAnnouncement,
            current: currentPrices,
            next: isNewAnnouncement ? currentPrices : null
        };
    } catch (e) {
        console.error('Greška pri povlačenju CG cijena:', e.message);
        return { is_new_available: false, current: DEFAULT_PRICES, next: null };
    }
}

async function getOilPrice() {
    try {
        const data = await fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d');
        const price = data.chart.result[0].meta.regularMarketPrice;
        const previousClose = data.chart.result[0].meta.chartPreviousClose;
        const changePercent = (((price - previousClose) / previousClose) * 100).toFixed(2);

        return {
            price: price.toFixed(2),
            change: changePercent
        };
    } catch (e) {
        console.error('Greška pri povlačenju cijene nafte:', e.message);
        return { price: '78.50', change: '+0.45' };
    }
}

function getRegionPrices() {
    return {
        srbija: { bmb95: '1.54', dizel: '1.67' },
        bih: { bmb95: '1.33', dizel: '1.35' },
        hrvatska: { bmb95: '1.45', dizel: '1.38' }
    };
}

async function runScraper() {
    try {
        const cgData = await getCrnaGoraPrices();
        const oilData = await getOilPrice();
        const regionData = getRegionPrices();

        const fullData = {
            updated_at: new Date().toISOString(),
            prices: cgData,
            oil: oilData,
            region: regionData
        };

        const dir = path.join(__dirname, 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(fullData, null, 2));

        console.log('Podaci uspješno ažurirani u:', fullData.updated_at);
        return fullData;
    } catch (err) {
        console.error('Greška u skraperu:', err.message);
        return null;
    }
}

module.exports = { runScraper };

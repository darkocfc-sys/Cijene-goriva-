const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'latest.json');
const SEARCH_URL = 'https://www.gov.me/pretraga?q=cijene+goriva';
const BASE_URL = 'https://www.gov.me';

async function fetchText(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; cijenegoriva/1.0)' }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status} za ${url}`);
    return res.text();
}

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; cijenegoriva/1.0)' }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status} za ${url}`);
    return res.json();
}

// 1. Povlačenje cijena za Crnu Goru sa gov.me
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

        if (!articleUrl) return null;

        const articleHtml = await fetchText(articleUrl);
        const $art = cheerio.load(articleHtml);
        const text = $art('body').text();

        const prices = {};

        // Poboljšani RegEx-i koji hvataju "Eurosuper 98", "BMB 98", "Eurosuper BMB 98" i sl.
        const bmb98 = text.match(/(?:eurosuper|bmb)\s*(?:bmb)?\s*98[^\d]*(\d+[,.]\d+)/i);
        const bmb95 = text.match(/(?:eurosuper|bmb)\s*(?:bmb)?\s*95[^\d]*(\d+[,.]\d+)/i);
        const dizel = text.match(/Eurodizel[^\d]*(\d+[,.]\d+)/i);
        const lozulje = text.match(/Lož\s*ulje[^\d]*(\d+[,.]\d+)/i);

        if (bmb98) prices.bmb98 = bmb98[1].replace(',', '.');
        if (bmb95) prices.bmb95 = bmb95[1].replace(',', '.');
        if (dizel) prices.dizel = dizel[1].replace(',', '.');
        if (lozulje) prices.lozulje = lozulje[1].replace(',', '.');

        return prices;
    } catch (e) {
        console.error('Greška pri povlačenju CG cena:', e.message);
        return null;
    }
}

// 2. Povlačenje cijene barela nafte (Brent Crude) preko Yahoo Finance API-ja
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
        return { price: '78.50', change: '+0.45' }; // Fallback
    }
}

// 3. Okvirne cijene u regionu (EUR)
function getRegionPrices() {
    return {
        srbija: { bmb95: '1.54', dizel: '1.67' },
        bih: { bmb95: '1.33', dizel: '1.35' },
        hrvatska: { bmb95: '1.45', dizel: '1.38' }
    };
}

async function runScraper() {
    try {
        const cgPrices = await getCrnaGoraPrices();
        const oilData = await getOilPrice();
        const regionData = getRegionPrices();

        const fullData = {
            updated_at: new Date().toISOString(),
            prices: cgPrices || { bmb98: '1.54', bmb95: '1.50', dizel: '1.41', lozulje: '1.37' },
            oil: oilData,
            region: regionData
        };

        const dir = path.join(__dirname, 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(fullData, null, 2));

        return fullData;
    } catch (err) {
        console.error('Greška u skraperu:', err.message);
        return null;
    }
}

module.exports = { runScraper };

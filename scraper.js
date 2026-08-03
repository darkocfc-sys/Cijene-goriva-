const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'latest.json');

// Zvanične/Trenutne cijene u CG ako sajt Vlade ne vrati rezultate
const DEFAULT_CG_PRICES = {
    bmb98: '1.54',
    bmb95: '1.50',
    dizel: '1.41',
    lozulje: '1.37'
};

// Cijene u regionu (Srbija, BiH, Hrvatska)
const DEFAULT_REGION_PRICES = {
    srbija: { bmb95: '1.53', dizel: '1.65' },
    bih: { bmb95: '1.32', dizel: '1.34' },
    hrvatska: { bmb95: '1.46', dizel: '1.39' }
};

async function getCrnaGoraPrices() {
    try {
        const response = await axios.get('https://www.gov.me/pretraga?q=cijene+goriva', {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
            timeout: 8000
        });

        const $ = cheerio.load(response.data);
        let articleUrl = null;

        $('a').each((_, el) => {
            const text = $(el).text().toLowerCase();
            const href = $(el).attr('href');
            if (text.includes('cijene goriva') || text.includes('naftnih derivata')) {
                if (href && !articleUrl) {
                    articleUrl = href.startsWith('http') ? href : 'https://www.gov.me' + href;
                }
            }
        });

        if (!articleUrl) {
            return { is_new_available: false, current: DEFAULT_CG_PRICES, next: null };
        }

        const artRes = await axios.get(articleUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
            timeout: 8000
        });

        const $art = cheerio.load(artRes.data);
        const text = $art('body').text();

        const matchBmb98 = text.match(/(?:eurosuper|bmb)\s*(?:bmb)?\s*98[^\d]*(\d+[,.]\d+)/i);
        const matchBmb95 = text.match(/(?:eurosuper|bmb)\s*(?:bmb)?\s*95[^\d]*(\d+[,.]\d+)/i);
        const matchDizel = text.match(/Eurodizel[^\d]*(\d+[,.]\d+)/i);
        const matchLozulje = text.match(/Lož\s*ulje[^\d]*(\d+[,.]\d+)/i);

        const currentPrices = {
            bmb98: matchBmb98 ? matchBmb98[1].replace(',', '.') : DEFAULT_CG_PRICES.bmb98,
            bmb95: matchBmb95 ? matchBmb95[1].replace(',', '.') : DEFAULT_CG_PRICES.bmb95,
            dizel: matchDizel ? matchDizel[1].replace(',', '.') : DEFAULT_CG_PRICES.dizel,
            lozulje: matchLozulje ? matchLozulje[1].replace(',', '.') : DEFAULT_CG_PRICES.lozulje
        };

        const isNewAnnouncement = text.toLowerCase().includes('od utorka') || text.toLowerCase().includes('od ponoći');

        return {
            is_new_available: isNewAnnouncement,
            current: currentPrices,
            next: isNewAnnouncement ? currentPrices : null
        };
    } catch (e) {
        console.error('Greška pri povlačenju CG cijena:', e.message);
        return { is_new_available: false, current: DEFAULT_CG_PRICES, next: null };
    }
}

async function getOilPrice() {
    try {
        const res = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });
        const price = res.data.chart.result[0].meta.regularMarketPrice;
        const previousClose = res.data.chart.result[0].meta.chartPreviousClose;
        const changePercent = (((price - previousClose) / previousClose) * 100).toFixed(2);

        return {
            price: price.toFixed(2),
            change: (changePercent >= 0 ? '+' : '') + changePercent
        };
    } catch (e) {
        console.error('Greška pri povlačenju cijene nafte:', e.message);
        return { price: '76.40', change: '+0.25' };
    }
}

async function runScraper() {
    try {
        const cgData = await getCrnaGoraPrices();
        const oilData = await getOilPrice();

        const fullData = {
            updated_at: new Date().toISOString(),
            prices: cgData,
            oil: oilData,
            region: DEFAULT_REGION_PRICES
        };

        const dir = path.join(__dirname, 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(fullData, null, 2));

        console.log('Podaci uspješno upisani u:', fullData.updated_at);
        return fullData;
    } catch (err) {
        console.error('Greška u runScraper-u:', err.message);
        return null;
    }
}

module.exports = { runScraper };

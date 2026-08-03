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

async function findLatestArticleUrl() {
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

    return articleUrl;
}

async function parsePricesFromArticle(url) {
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const text = $('body').text();

    const prices = {};
    
    // Regex pretraga za cijene
    const bmb98 = text.match(/BMB\s*98[^\d]*(\d+[,.]\d+)/i);
    const bmb95 = text.match(/BMB\s*95[^\d]*(\d+[,.]\d+)/i);
    const dizel = text.match(/Eurodizel[^\d]*(\d+[,.]\d+)/i);
    const lozulje = text.match(/Lož\s*ulje[^\d]*(\d+[,.]\d+)/i);

    if (bmb98) prices.bmb98 = bmb98[1].replace(',', '.');
    if (bmb95) prices.bmb95 = bmb95[1].replace(',', '.');
    if (dizel) prices.dizel = dizel[1].replace(',', '.');
    if (lozulje) prices.lozulje = lozulje[1].replace(',', '.');

    return {
        source_url: url,
        updated_at: new Date().toISOString(),
        prices: prices
    };
}

async function runScraper() {
    try {
        const articleUrl = await findLatestArticleUrl();
        if (!articleUrl) throw new Error('Nije pronađen članak sa cijenama.');

        const data = await parsePricesFromArticle(articleUrl);
        
        // Snimi u JSON fajl u data folderu
        const dir = path.join(__dirname, 'data');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        return data;
    } catch (err) {
        console.error('Greška pri skrapovanju:', err.message);
        return null;
    }
}

module.exports = { runScraper };

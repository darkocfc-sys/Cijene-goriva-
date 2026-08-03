// scraper.js
// Provjerava gov.me za najnoviji članak "Nove cijene goriva" i čuva podatke u bazu.

const cheerio = require('cheerio');
const { saveUpdate, getLatestPrices } = require('./db');

const SEARCH_URL = 'https://www.gov.me/pretraga?q=cijene+goriva&sort=published_at';
const BASE_URL = 'https://www.gov.me';

// Prepoznaje redove tipa: "EUROSUPER 98 1,81eur +0,13" ili "EURODIZEL 1,79 eur +0.14"
const PRICE_LINE_REGEX = /(EUROSUPER\s*98|EUROSUPER\s*95|EURODIZEL|LO[ŽZ]\s*ULJE|TNG|AUTOPLIN)\s+([\d,.]+)\s*eur\s*([+\-]?[\d,.]+)/gi;

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; cijenegoriva-bot/1.0)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} za ${url}`);
  return res.text();
}

// Pronalazi link ka najnovijem članku o cijenama goriva preko pretrage na gov.me
async function findLatestArticleUrl() {
  const html = await fetchText(SEARCH_URL);
  const $ = cheerio.load(html);

  let foundUrl = null;
  $('a').each((_, el) => {
    if (foundUrl) return;
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();
    if (
      href.includes('/clanak/') &&
      (href.includes('cijene-goriva') || text.includes('cijene goriva'))
    ) {
      foundUrl = href.startsWith('http') ? href : BASE_URL + href;
    }
  });

  return foundUrl;
}

function parsePricesFromText(text) {
  const results = [];
  let match;
  PRICE_LINE_REGEX.lastIndex = 0;
  while ((match = PRICE_LINE_REGEX.exec(text)) !== null) {
    const derivat = match[1].toUpperCase().replace(/\s+/g, ' ').trim();
    const cijena = parseFloat(match[2].replace(',', '.'));
    const promjena = parseFloat(match[3].replace(',', '.'));
    results.push({ derivat, cijena, promjena });
  }
  return results;
}

function parseDate(text, label) {
  // Traži obrazac npr. "Od 28.07.2026. godine" ili "Objavljeno: 27.07.2026."
  const regex = new RegExp(label + '\\s*:?\\s*(\\d{1,2}\\.\\d{1,2}\\.\\d{4})', 'i');
  const m = text.match(regex);
  return m ? m[1] : null;
}

async function parseArticle(url) {
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const bodyText = $('body').text().replace(/\s+/g, ' ');

  const title = $('h1').first().text().trim() || 'Nove cijene goriva';
  const publishedAt = parseDate(bodyText, 'Objavljeno');
  const effectiveFrom = parseDate(bodyText, 'Od');
  const prices = parsePricesFromText(bodyText);

  return { title, publishedAt, effectiveFrom, prices, sourceUrl: url };
}

async function run() {
  console.log('[scraper] Tražim najnoviji članak...');
  const articleUrl = await findLatestArticleUrl();

  if (!articleUrl) {
    console.log('[scraper] Nije pronađen nijedan članak. Prekidam.');
    return;
  }

  console.log('[scraper] Pronađen članak:', articleUrl);
  const parsed = await parseArticle(articleUrl);

  if (!parsed.prices.length) {
    console.log('[scraper] Nisam uspio da parsiram cijene iz članka. Provjeri regex/strukturu.');
    return;
  }

  const result = saveUpdate({
    sourceUrl: parsed.sourceUrl,
    publishedAt: parsed.publishedAt,
    effectiveFrom: parsed.effectiveFrom,
    rawTitle: parsed.title,
    prices: parsed.prices,
  });

  if (result.alreadyExists) {
    console.log('[scraper] Ovaj članak je već sačuvan ranije. Nema promjene.');
  } else {
    console.log('[scraper] Nove cijene sačuvane:', parsed.prices);
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error('[scraper] Greška:', err.message);
    process.exit(1);
  });
}

module.exports = { run, findLatestArticleUrl, parseArticle };

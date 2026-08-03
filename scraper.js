const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db');

const SOURCES = [
  {
    name: 'bihamk.ba',
    url: 'https://bihamk.ba/spi/servisne-informacije/cijene-goriva',
    type: 'bihamk',
    countries: ['me', 'rs', 'ba', 'hr', 'al']
  },
  {
    name: 'mondo.rs',
    url: 'https://mondo.rs/Info/Ekonomija',
    type: 'mondo',
    countries: ['rs']
  },
  {
    name: 'dnevnik.hr',
    url: 'https://dnevnik.hr/vijesti/hrvatska',
    type: 'dnevnik',
    countries: ['hr']
  }
];

async function scrapeBihamk() {
  try {
    console.log('[SCRAPER] bihamk.ba...');
    const { data } = await axios.get(SOURCES[0].url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(data);
    const text = $('body').text();
    const prices = {};

    const meMatch = text.match(/Crna Gora[\s\S]*?Benzin 95[\s\-]*([\d.,]+)[\s\S]*?Dizel[\s\-]*([\d.,]+)/i);
    if (meMatch) prices.me = { bmb95: parseFloat(meMatch[1].replace(',', '.')), eurodizel: parseFloat(meMatch[2].replace(',', '.')) };

    const rsMatch = text.match(/Srbija[\s\S]*?Benzin[\s\-]*([\d.,]+)[\s\S]*?Dizel[\s\-]*([\d.,]+)/i);
    if (rsMatch) prices.rs = { bmb95: parseFloat(rsMatch[1].replace(',', '.')), eurodizel: parseFloat(rsMatch[2].replace(',', '.')) };

    const baMatch = text.match(/Bosna i Hercegovina[\s\S]*?Benzin[\s\-]*([\d.,]+)[\s\S]*?Dizel[\s\-]*([\d.,]+)/i);
    if (baMatch) prices.ba = { bmb95: parseFloat(baMatch[1].replace(',', '.')), eurodizel: parseFloat(baMatch[2].replace(',', '.')) };

    const hrMatch = text.match(/Hrvatska[\s\S]*?Benzin 95[\s\-]*([\d.,]+)[\s\S]*?Dizel[\s\-]*([\d.,]+)/i);
    if (hrMatch) prices.hr = { bmb95: parseFloat(hrMatch[1].replace(',', '.')), eurodizel: parseFloat(hrMatch[2].replace(',', '.')) };

    const alMatch = text.match(/Albanija[\s\S]*?BMB 95[\s\-]*([\d.,]+)[\s\S]*?Dizel[\s\-]*([\d.,]+)/i);
    if (alMatch) prices.al = { bmb95: parseFloat(alMatch[1].replace(',', '.')), eurodizel: parseFloat(alMatch[2].replace(',', '.')) };

    if (Object.keys(prices).length > 0) {
      console.log('[SCRAPER] bihamk.ba uspješno:', Object.keys(prices).join(', '));
      return prices;
    }
    return null;
  } catch (err) {
    console.error('[SCRAPER] bihamk.ba greška:', err.message);
    return null;
  }
}

async function scrapeMondo() {
  try {
    console.log('[SCRAPER] mondo.rs...');
    const { data } = await axios.get(SOURCES[1].url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const text = cheerio.load(data)('body').text();
    const bmb95 = text.match(/BMB 95[\s\-:]+([\d]+)[\s]*dinara/i);
    const dizel = text.match(/evrodizel[\s\-:]+([\d]+)[\s]*dinara/i);
    if (bmb95 && dizel) {
      console.log('[SCRAPER] mondo.rs uspješno: rs');
      return { rs: { bmb95: parseFloat(bmb95[1]), eurodizel: parseFloat(dizel[1]) } };
    }
    return null;
  } catch (err) {
    console.error('[SCRAPER] mondo.rs greška:', err.message);
    return null;
  }
}

async function scrapeDnevnik() {
  try {
    console.log('[SCRAPER] dnevnik.hr...');
    const { data } = await axios.get(SOURCES[2].url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const text = cheerio.load(data)('body').text();
    const bmb95 = text.match(/Eurosuper 95[\s\-:]+([\d.,]+)[\s]*EUR/i);
    const dizel = text.match(/dizelsko gorivo[\s\-:]+([\d.,]+)[\s]*EUR/i);
    if (bmb95 && dizel) {
      console.log('[SCRAPER] dnevnik.hr uspješno: hr');
      return { hr: { bmb95: parseFloat(bmb95[1].replace(',', '.')), eurodizel: parseFloat(dizel[1].replace(',', '.')) } };
    }
    return null;
  } catch (err) {
    console.error('[SCRAPER] dnevnik.hr greška:', err.message);
    return null;
  }
}

function smartUpdate(scraped) {
  const current = db.getPrices();
  const updated = {};
  const skipped = [];

  Object.keys(current.countries).forEach(countryCode => {
    const country = current.countries[countryCode];
    const scrapedCountry = scraped[countryCode];

    if (!scrapedCountry) {
      skipped.push(countryCode);
      return;
    }

    updated[countryCode] = country.fuels.map(fuel => {
      const oldPrice = fuel.price;
      let newPrice = oldPrice;

      if (scrapedCountry[fuel.id] && scrapedCountry[fuel.id] !== oldPrice) {
        newPrice = scrapedCountry[fuel.id];
      }

      const change = parseFloat((newPrice - oldPrice).toFixed(2));
      return {
        ...fuel,
        price: newPrice,
        pricePrev: oldPrice,
        change: Math.abs(change),
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
      };
    });
  });

  if (skipped.length > 0) {
    console.log('[SCRAPER] Zadržane stare cijene za:', skipped.join(', '));
  }

  return updated;
}

async function scrapePrices() {
  console.log('\\n[SCRAPER]', new Date().toISOString());

  let scraped = {};

  const bihamkData = await scrapeBihamk();
  if (bihamkData) scraped = { ...scraped, ...bihamkData };

  const mondoData = await scrapeMondo();
  if (mondoData) scraped = { ...scraped, ...mondoData };

  const dnevnikData = await scrapeDnevnik();
  if (dnevnikData) scraped = { ...scraped, ...dnevnikData };

  if (Object.keys(scraped).length === 0) {
    console.log('[SCRAPER] Nema novih podataka. Sve cijene ostaju iste.');
    return null;
  }

  const merged = smartUpdate(scraped);

  Object.keys(merged).forEach(countryCode => {
    db.updateCountryPrices(countryCode, merged[countryCode]);
  });

  console.log('[SCRAPER] Završeno. Ažurirano:', Object.keys(merged).join(', '));
  return merged;
}

if (require.main === module) {
  scrapePrices().then(() => process.exit(0)).catch(err => {
    console.error('[SCRAPER] Fatal:', err);
    process.exit(1);
  });
}

module.exports = { scrapePrices };

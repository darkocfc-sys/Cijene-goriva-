const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const db = require('./db');
const { scrapePrices } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API: list countries
app.get('/api/countries', (req, res) => {
  try {
    res.json({ success: true, data: db.getCountries(), rates: db.getRates() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: prices for country
app.get('/api/prices', (req, res) => {
  try {
    const country = req.query.country || 'me';
    const currency = req.query.currency || null;
    const data = db.getPrices(country);

    if (currency && currency !== data.current.currency) {
      const rates = db.getRates();
      const fromRate = rates[data.current.currency] || 1;
      const toRate = rates[currency] || 1;
      const factor = fromRate / toRate;

      data.current = {
        ...data.current,
        currency: currency,
        fuels: data.current.fuels.map(f => ({
          ...f,
          price: parseFloat((f.price * factor).toFixed(2)),
          pricePrev: parseFloat((f.pricePrev * factor).toFixed(2)),
          change: parseFloat((f.change * factor).toFixed(2))
        }))
      };
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: history
app.get('/api/history/:country/:fuelId', (req, res) => {
  try {
    const history = db.getHistory(req.params.country, req.params.fuelId, parseInt(req.query.limit) || 52);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: stats
app.get('/api/stats', (req, res) => {
  try {
    res.json({ success: true, data: { lastUpdated: db.getPrices().lastUpdated, countries: db.getCountries() } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: scrape
app.post('/api/scrape', async (req, res) => {
  try {
    const result = await scrapePrices();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADMIN: update country prices
app.post('/api/admin/update', (req, res) => {
  try {
    const { country, fuels } = req.body;
    if (!country || !fuels || !Array.isArray(fuels)) {
      return res.status(400).json({ success: false, error: 'country i fuels su obavezni' });
    }

    const current = db.getPrices(country).current;
    const updated = fuels.map(f => {
      const old = current.fuels.find(x => x.id === f.id);
      const oldPrice = old ? old.price : 0;
      const newPrice = parseFloat(f.price);
      const change = parseFloat((newPrice - oldPrice).toFixed(2));
      return {
        ...old, ...f,
        price: newPrice,
        pricePrev: oldPrice,
        change: Math.abs(change),
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
      };
    });

    db.updateCountryPrices(country, updated);
    res.json({ success: true, message: 'Cijene ažurirane' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Static files
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Cron: svaki dan u 08:00 CET
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Dnevni auto-scrape', new Date().toISOString());
  try { await scrapePrices(); } catch (e) { console.error(e); }
}, { timezone: 'Europe/Podgorica' });

app.listen(PORT, () => {
  console.log(`🚀 Gorivo.me na portu ${PORT}`);
  console.log(`🔧 Admin: /admin.html`);
  console.log(`⛽ Zemlje: CG, SRB, BiH, HR, AL`);
});

module.exports = app;

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

// API routes (MORAJU biti PRIJE static files)
app.get('/api/prices', (req, res) => {
  try {
    res.json({ success: true, data: db.getPrices() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/history/:fuelId', (req, res) => {
  try {
    const history = db.getHistory(req.params.fuelId, parseInt(req.query.limit) || 52);
    res.json({ success: true, fuelId: req.params.fuelId, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/history', (req, res) => {
  try {
    res.json({ success: true, data: db.getHistory() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    res.json({ success: true, data: db.getStats() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/scrape', async (req, res) => {
  try {
    const result = await scrapePrices();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Static files iz ROOT foldera (jer nemaš public/)
app.use(express.static(__dirname));

// Fallback za /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Cron job
cron.schedule('0 8 * * 1', async () => {
  console.log('[CRON] Scrape started');
  try { await scrapePrices(); } 
  catch (e) { console.error(e); }
}, { timezone: 'Europe/Podgorica' });

app.listen(PORT, () => {
  console.log(`🚀 Server na portu ${PORT}`);
});

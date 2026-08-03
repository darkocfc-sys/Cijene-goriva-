const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const db = require('./db');
const { scrapePrices } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// API Routes
// ============================================================

/**
 * GET /api/prices
 * Current fuel prices
 */
app.get('/api/prices', (req, res) => {
  try {
    const prices = db.getPrices();
    res.json({
      success: true,
      data: prices,
      cached: false
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/history/:fuelId
 * Historical prices for a specific fuel
 */
app.get('/api/history/:fuelId', (req, res) => {
  try {
    const { fuelId } = req.params;
    const limit = parseInt(req.query.limit) || 52;
    const history = db.getHistory(fuelId, limit);

    res.json({
      success: true,
      fuelId,
      data: history,
      count: Array.isArray(history) ? history.length : Object.keys(history).length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/history
 * All historical data
 */
app.get('/api/history', (req, res) => {
  try {
    const history = db.getHistory();
    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/scrape
 * Trigger manual scrape (protected in production)
 */
app.post('/api/scrape', async (req, res) => {
  try {
    const secret = req.headers['x-scrape-secret'];
    if (process.env.SCRAPE_SECRET && secret !== process.env.SCRAPE_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = await scrapePrices();
    res.json({
      success: true,
      message: 'Scrape completed',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/stats
 * Database statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version
  });
});

// ============================================================
// Scheduled scraping (every Monday at 08:00 CET)
// Montenegro updates prices every 7 days
// ============================================================
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 8 * * 1', async () => {
    console.log('[CRON] Scheduled scrape started');
    try {
      await scrapePrices();
      console.log('[CRON] Scheduled scrape completed');
    } catch (err) {
      console.error('[CRON] Scheduled scrape failed:', err.message);
    }
  }, {
    timezone: 'Europe/Podgorica'
  });

  console.log('[CRON] Scheduled: Every Monday at 08:00 CET');
}

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
  console.log(`\\n🚀 Gorivo.me server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/prices          - Current prices`);
  console.log(`   GET  /api/history         - All history`);
  console.log(`   GET  /api/history/:fuelId - Fuel history`);
  console.log(`   GET  /api/stats           - Statistics`);
  console.log(`   POST /api/scrape          - Trigger scrape`);
  console.log(`   GET  /api/health          - Health check`);
  console.log(`\\n⛽ Last updated: ${db.getPrices().lastUpdated}\\n`);
});

module.exports = app;

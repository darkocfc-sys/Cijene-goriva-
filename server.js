// server.js
const express = require('express');
const cron = require('node-cron');
const path = require('path');
const { getLatestPrices, getHistory } = require('./db');
const { run: runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/prices', (req, res) => {
  const latest = getLatestPrices();
  if (!latest) {
    return res.json({ message: 'Još nema podataka. Sačekaj prvi scraping.' });
  }
  res.json(latest);
});

app.get('/api/history/:derivat', (req, res) => {
  const history = getHistory(req.params.derivat.toUpperCase());
  res.json(history);
});

app.get('/api/scrape-now', async (req, res) => {
  // Ručno pokretanje scraper-a preko URL-a, korisno za testiranje.
  // Preporuka: zaštiti ovo tajnim ključem prije javnog puštanja u produkciju.
  try {
    await runScraper();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});

// Cron raspored: svakog ponedjeljka, na svakih 20 minuta, cijeli dan (08:00 - 23:59)
// Van ponedjeljka: jednom dnevno u 09:00, kao fallback za vanredne izmjene.
cron.schedule('*/20 8-23 * * 1', () => {
  console.log('[cron] Ponedjeljak provjera...');
  runScraper().catch((err) => console.error('[cron] Greška:', err.message));
});

cron.schedule('0 9 * * 0,2-6', () => {
  console.log('[cron] Fallback dnevna provjera...');
  runScraper().catch((err) => console.error('[cron] Greška:', err.message));
});

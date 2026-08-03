const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'latest.json');

// Podrazumijevani rezervni podaci (ako JSON fajl uopšte ne postoji)
const FALLBACK_DATA = {
    updated_at: new Date().toISOString(),
    prices: {
        is_new_available: false,
        current: { bmb98: '1.54', bmb95: '1.50', dizel: '1.41', lozulje: '1.37' },
        next: null
    },
    oil: { price: '76.40', change: '+0.25' },
    region: {
        srbija: { bmb95: '1.53', dizel: '1.65' },
        bih: { bmb95: '1.32', dizel: '1.34' },
        hrvatska: { bmb95: '1.46', dizel: '1.39' }
    }
};

app.use(express.static(path.join(__dirname, 'public')));

// GET /api/prices
app.get('/api/prices', async (req, res) => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE, 'utf8');
            const parsedData = JSON.parse(rawData);
            return res.json(parsedData);
        }

        // Ako fajl ne postoji, pokreni skraper
        console.log('[API] DATA_FILE ne postoji. Pokrećem skraper...');
        const newData = await runScraper();
        if (newData) {
            return res.json(newData);
        }

        // Ako skraper vrati null, vrati fallback podatke umjesto greške
        return res.json(FALLBACK_DATA);
    } catch (err) {
        console.error('Greška na /api/prices:', err.message);
        return res.json(FALLBACK_DATA);
    }
});

// GET /api/refresh - ručno okidanje
app.get('/api/refresh', async (req, res) => {
    try {
        const newData = await runScraper();
        if (newData) {
            res.json({ success: true, message: 'Podaci uspješno osvježeni!', updated_at: newData.updated_at });
        } else {
            res.status(500).json({ success: false, error: 'Skraper je vratio null. Provjerite logove.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// AUTOMATIZACIJA (CRON JOBS)
cron.schedule('*/15 8-20 * * 1,2', async () => {
    console.log('[CRON] Pokretanje skrapera (Ponedjeljak/Utorak)...');
    await runScraper();
});

cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Redovno 6-časovno osvežavanje...');
    await runScraper();
});

app.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`);
    runScraper().catch(err => console.error('Greška pri startnom skrapovanju:', err.message));
});

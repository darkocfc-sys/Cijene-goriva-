const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'latest.json');

app.use(express.static(path.join(__dirname, 'public')));

// GET /api/prices
app.get('/api/prices', async (req, res) => {
    try {
        let data = null;
        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE, 'utf8');
            data = JSON.parse(rawData);
        } else {
            console.log('Fajl sa podacima ne postoji. Pokrećem skraper...');
            data = await runScraper();
        }

        if (!data) {
            return res.status(500).json({ error: 'Nije moguće preuzeti podatke o cijenama.' });
        }

        res.json(data);
    } catch (err) {
        console.error('Greška na /api/prices:', err.message);
        res.status(500).json({ error: 'Interna greška servera.' });
    }
});

// Ručno osvežavanje po potrebi
app.get('/api/refresh', async (req, res) => {
    try {
        const newData = await runScraper();
        if (newData) {
            res.json({ message: 'Podaci uspješno osveženi', updated_at: newData.updated_at });
        } else {
            res.status(500).json({ error: 'Greška pri ponovnom skrapovanju.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// AUTOMATIZACIJA (CRON JOBS)

// 1. Ponedjeljkom i utorkom: Provjeravaj svakih 15 minuta (od 08:00 do 20:00h) radi novih cijena
cron.schedule('*/15 8-20 * * 1,2', async () => {
    console.log('[CRON] Pokretanje skrapera (Ponedjeljak/Utorak provjera)...');
    await runScraper();
});

// 2. Svakog dana: Osvježi cijene nafte i regiona na svakih 6 sati
cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Redovno 6-časovno osvežavanje podataka...');
    await runScraper();
});

// Pokretanje servera
app.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`);
    // Inicijalno skrapovanje odmah po startovanju servera
    runScraper().catch(err => console.error('Greška pri startnom skrapovanju:', err.message));
});

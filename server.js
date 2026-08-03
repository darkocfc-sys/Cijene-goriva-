const express = require('express');
const path = require('path');
const fs = require('fs');
const { runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'latest.json');

// Serviranje statičkih fajlova iz "public" direktorijuma
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /api/prices
 * Vraća najnovije podatke o cijenama goriva (trenutne, nove od utorka, nafta, region)
 */
app.get('/api/prices', async (req, res) => {
    try {
        let data = null;

        // Ako lokalni JSON fajl postoji, učitaj iz njega
        if (fs.existsSync(DATA_FILE)) {
            const rawData = fs.readFileSync(DATA_FILE, 'utf8');
            data = JSON.parse(rawData);
        } else {
            // Ako fajl još ne postoji, pokreni skraper da ga generiše
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

/**
 * GET /api/refresh
 * Ručno/cron pokretanje skrapera za ažuriranje podataka
 */
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

// Fallback na index.html za sve ostale rute
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Pokretanje servera
app.listen(PORT, () => {
    console.log(`Server je pokrenut na portu ${PORT}`);
    
    // Inicijalno pokretanje skrapera pri startu servera
    runScraper().catch(err => console.error('Greška pri inicijalnom skrapovanju:', err.message));
});

const express = require('express');
const path = require('path');
const fs = require('fs');
const { runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// API ruta za preuzimanje cijena
app.get('/api/prices', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'latest.json');
        
        // Ako nema fajla ili je stariji od 6 sati, pokreni skraper
        let shouldScrape = true;
        if (fs.existsSync(dataPath)) {
            const stats = fs.statSync(dataPath);
            const now = new Date().getTime();
            const fileTime = new Date(stats.mtime).getTime();
            if ((now - fileTime) < 6 * 60 * 60 * 1000) {
                shouldScrape = false;
            }
        }

        if (shouldScrape) {
            await runScraper();
        }

        if (fs.existsSync(dataPath)) {
            const rawData = fs.readFileSync(dataPath);
            return res.json(JSON.parse(rawData));
        }

        res.status(404).json({ error: 'Podaci nisu dostupni' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
    // Pokreni skraper odmah po startu servera
    runScraper();
});

const express = require('express');
const path = require('path');
const fs = require('fs');
const { runScraper } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/prices', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'latest.json');
        
        let shouldScrape = true;
        if (fs.existsSync(dataPath)) {
            const stats = fs.statSync(dataPath);
            const now = new Date().getTime();
            const fileTime = new Date(stats.mtime).getTime();
            if ((now - fileTime) < 2 * 60 * 60 * 1000) { // Osvježava na svaka 2 sata radi nafte
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
    runScraper();
});

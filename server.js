const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Centralna baza podataka u memoriji
let globalData = {
    cg: {
        bmb95: 1.45,
        bmb98: 1.49,
        dizel: 1.33,
        loz: 1.29,
        lastUpdated: '03.08.2026.'
    },
    brent: {
        price: 78.50,
        change: '-1.2%'
    },
    region: {
        srbija: { bmb95: '182.00 RSD', dizel: '195.00 RSD', updated: 'Petak' },
        bih: { bmb95: '2.65 KM', dizel: '2.60 KM', updated: 'Sedmični prosjek' },
        hrvatska: { bmb95: '1.45 €', dizel: '1.38 €', updated: 'Ponedjeljak' },
        mkd: { bmb95: '77.00 MKD', dizel: '69.50 MKD', updated: 'Ponedjeljak' }
    }
};

// 1. Scraper za zvanične cijene u Crnoj Gori
async function scrapeCgPrices() {
    try {
        const response = await axios.get('https://www.gov.me/rudarsko-naftni-derivati/saopstenja', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 8000
        });

        const $ = cheerio.load(response.data);
        const text = $('body').text();

        const bmb95Match = text.match(/BMB\s*95[^\d]*(\d+[.,]\d+)/i);
        const bmb98Match = text.match(/BMB\s*98[^\d]*(\d+[.,]\d+)/i);
        const dizelMatch = text.match(/Eurodizel[^\d]*(\d+[.,]\d+)/i);
        const lozMatch = text.match(/lož\s*ulje[^\d]*(\d+[.,]\d+)/i);

        if (bmb95Match) globalData.cg.bmb95 = parseFloat(bmb95Match[1].replace(',', '.'));
        if (bmb98Match) globalData.cg.bmb98 = parseFloat(bmb98Match[1].replace(',', '.'));
        if (dizelMatch) globalData.cg.dizel = parseFloat(dizelMatch[1].replace(',', '.'));
        if (lozMatch) globalData.cg.loz = parseFloat(lozMatch[1].replace(',', '.'));

        globalData.cg.lastUpdated = new Date().toLocaleDateString('sr-ME');
        console.log('CG Cijene uspješno osvježene.');
    } catch (error) {
        console.log('CG Scraper: Koriste se posljednje zvanične sačuvane cijene.');
    }
}

// 2. Automatsko povlačenje cijene barela Brent nafte sa Yahoo Finance API-ja
async function fetchBrentPrice() {
    try {
        const res = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F', {
            timeout: 5000
        });
        const meta = res.data.chart.result[0].meta;
        const currentPrice = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose;
        const diffPercent = (((currentPrice - prevClose) / prevClose) * 100).toFixed(2);

        globalData.brent.price = currentPrice.toFixed(2);
        globalData.brent.change = (diffPercent >= 0 ? '+' : '') + diffPercent + '%';
        console.log(`Brent nafta osvježena: $${globalData.brent.price} (${globalData.brent.change})`);
    } catch (error) {
        console.log('Brent API: Zadržana trenutna cijena barela.');
    }
}

// Tajmeri za automatsko osvježavanje u pozadini
setInterval(scrapeCgPrices, 15 * 60 * 1000); // CG obavještenja na svakih 15 min (ponedjeljkom)
setInterval(fetchBrentPrice, 5 * 60 * 1000);   // Nafta na svakih 5 min

// API Endpoint za frontend (index.html)
app.get('/api/prices', (req, res) => {
    res.json(globalData);
});

// Rutiranje
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server aktivan na portu ${PORT}`);
    // Inicijalno pokretanje pri startu
    scrapeCgPrices();
    fetchBrentPrice();
});

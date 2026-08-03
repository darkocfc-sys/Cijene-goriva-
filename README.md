# ⛽ Gorivo.me — Cijene goriva u Crnoj Gori

Zvanični podaci o cijenama goriva u Crnoj Gori. Ažuriranje svakih 7 dana u skladu sa odlukama Ministarstva energetike i rudarstva.

## 🚀 Brzi start

```bash
# 1. Instaliraj zavisnosti
npm install

# 2. Kopiraj env fajl
 cp .env.example .env

# 3. Pokreni server
npm start

# 4. Otvori u browseru
open http://localhost:3000
```

## 📁 Struktura projekta

```
cijenegoriva-me/
├── public/
│   └── index.html          # Frontend (povezan na API)
├── data/
│   ├── prices.json         # Trenutne cijene
│   └── history.json        # Istorijski podaci
├── server.js               # Express API server
├── scraper.js              # Scraper zvaničnih izvora
├── db.js                   # JSON baza podataka
├── package.json
└── .env.example
```

## 🔌 API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/prices` | Trenutne cijena goriva |
| GET | `/api/history` | Sva istorijska kretanja |
| GET | `/api/history/:fuelId` | Istorija za određeno gorivo |
| POST | `/api/scrape` | Ručno pokretanje scrapera |
| GET | `/api/stats` | Statistika baze |
| GET | `/api/health` | Health check |

## 🕐 Automatsko ažuriranje

Scraper se automatski pokreće **svakog ponedjeljka u 08:00** (CET) preko `node-cron`.

Ručno pokretanje:
```bash
npm run scrape
# ili
node scraper.js
```

## 📡 Izvori podataka

- **Primarni:** [gov.me](https://www.gov.me) — Vlada Crne Gore, saopštenja o cijenama goriva
- **Sekundarni:** Službeni list Crne Gore — Uredbe o formiranju cijena naftnih derivata
- **Metodologija:** Platt's European Marketscan + devizni kurs + akcize i takse

## 🗺️ Karakteristike

- ✅ Realna fotografija Boke Kotorske sa zastavom Crne Gore
- ✅ Vektorska mapa Crne Gore (SVG)
- ✅ Dinamički grafikon kretanja cijena
- ✅ Responzivan dizajn (mobile-first)
- ✅ API za eksternu upotrebu
- ✅ Automatski scraper sa fallback-om

## 📝 Licenca

MIT — Slobodno koristi i prilagođavaj.

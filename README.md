# ⛽ Gorivo.me — Cijene goriva na Balkanu

Cijene goriva za Crnu Goru, Srbiju, Bosnu i Hercegovinu, Hrvatsku i Albaniju.

## 🚀 Start

```bash
npm install
npm start
```

## 📁 Fajlovi

- `index.html` — Frontend
- `admin.html` — Admin panel za ručno ažuriranje
- `server.js` — Express API
- `scraper.js` — Dnevni scraper (bihamk.ba, mondo.rs, dnevnik.hr)
- `db.js` — JSON baza

## 🔌 API

- `GET /api/prices?country=me` — Cijene za zemlju
- `GET /api/history/:country/:fuelId` — Istorija
- `POST /api/admin/update` — Ručno ažuriranje

## 🕐 Auto-scrape

Svaki dan u 08:00 CET. Pametan — ažurira samo zemlje koje su promijenile cijenu.

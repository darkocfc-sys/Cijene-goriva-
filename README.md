# ⛽ Gorivo.me — Cijene goriva na Balkanu

Cijene goriva za Crnu Goru, Srbiju, Bosnu i Hercegovinu, Hrvatsku i Albaniju.

## 🚀 Start

```bash
npm install
npm start
```

## 🔐 Podešavanje admin pristupa (OBAVEZNO prije deploy-a)

Admin panel (`/admin.html`) i `/api/admin/update` su zaštićeni lozinkom preko
environment varijabli. Bez njih server neće dozvoliti pristup adminu (vratiće grešku).

Na Railway-u: **Settings → Variables** i dodaj:
- `ADMIN_USER` — korisničko ime po tvom izboru
- `ADMIN_PASS` — jaka lozinka (ne koristi istu koju koristiš negdje drugo)

Lokalno za razvoj: kopiraj `.env.example` u `.env` i upiši svoje vrijednosti
(`.env` je u `.gitignore`, nikad se ne šalje na GitHub).

## 💾 Trajni podaci (OBAVEZNO prije deploy-a)

Baza (`data/prices.json`, `data/history.json`) se čuva kao fajl na disku.
Na Railway-u fajl sistem je efemeran — bez volume-a, svaki redeploy briše istoriju cijena.

Na Railway-u: **Settings → Volumes → New Volume**, mount path: `/app/data`

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

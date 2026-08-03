# cijenegoriva.me

Sajt koji prati zvanične cijene goriva u Crnoj Gori, sa gov.me.

## Šta je unutra

- `scraper.js` — provjerava gov.me i izvlači cijene iz najnovijeg članka
- `db.js` — SQLite baza, čuva istoriju cijena
- `server.js` — web server (Express) + raspored (cron) za automatsko pokretanje scrapera
- `public/index.html` — stranica koja prikazuje trenutne cijene

## Korak 1: Stavi kod na GitHub

1. Idi na github.com, klikni "New repository"
2. Nazovi ga npr. `cijenegoriva-me`, ostavi "Public" ili "Private" (svejedno je za Render)
3. NE dodaj README/gitignore preko GitHub-a (mi već imamo)
4. Na svom računaru (ili direktno preko "upload files" na GitHub sajtu ako ti je lakše):
   - Upload-uj SVE fajlove iz ovog projekta osim `node_modules` i `data` foldera (oni se ne prate, `.gitignore` se za to brine ako radiš preko terminala)

Ako nemaš iskustva sa Git komandama, najlakše je:
- Otvori novi repo na GitHub-u
- Klikni "uploading an existing file"
- Prevuci sve fajlove (package.json, server.js, scraper.js, db.js, public/index.html, .gitignore, README.md)
- Klikni "Commit changes"

## Korak 2: Poveži GitHub repo sa Render-om

1. Idi na render.com, uloguj se preko GitHub-a
2. Klikni "New +" → "Web Service"
3. Izaberi svoj `cijenegoriva-me` repo
4. Podešavanja:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (za početak)
5. Klikni "Create Web Service"

Render će sam instalirati zavisnosti i pokrenuti sajt. Dobićeš privremeni URL tipa `cijenegoriva-me.onrender.com` — provjeri da sajt radi.

## Korak 3: Poveži svoj domen (cijenegoriva.me)

1. U Render-u, na stranici tvog servisa, idi na "Settings" → "Custom Domains"
2. Dodaj `cijenegoriva.me` i `www.cijenegoriva.me`
3. Render će ti dati CNAME/A record vrijednosti
4. Idi kod registratora gdje si kupio domen → DNS podešavanja → dodaj te zapise
5. Sačekaj da se DNS propagira (do par sati)

## Napomena o besplatnom tier-u

Render free web servisi "zaspu" nakon 15 min neaktivnosti i probude se kad neko pristupi sajtu (par sekundi kašnjenja na prvi zahtjev). Za mali sajt na početku to je sasvim OK. Free SQLite baza (`data/` folder) se BRIŠE pri svakom redeploy-u — čim projekat postane ozbiljniji, prelazi se na Render PostgreSQL (imaju besplatan tier).

## Ručno testiranje scrapera

Nakon deploy-a, možeš ručno pokrenuti scraping posjetom:
```
https://tvoj-sajt.onrender.com/api/scrape-now
```
(Preporuka: kasnije zaštiti ovu rutu tajnim ključem prije nego sajt bude javno poznat.)

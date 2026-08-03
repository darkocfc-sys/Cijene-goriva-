// db.js
// Jednostavna SQLite baza za čuvanje istorije cijena goriva.
// Napomena: na Render free tier-u fajl-sistem NIJE trajan preko redeploy-a.
// Za pravu produkciju kasnije prebaci na Render PostgreSQL (besplatan tier).

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'prices.db');
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS price_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_url TEXT NOT NULL UNIQUE,
    published_at TEXT,
    effective_from TEXT,
    scraped_at TEXT NOT NULL,
    raw_title TEXT
  );

  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    update_id INTEGER NOT NULL,
    derivat TEXT NOT NULL,
    cijena REAL,
    promjena REAL,
    FOREIGN KEY (update_id) REFERENCES price_updates(id)
  );
`);

function saveUpdate({ sourceUrl, publishedAt, effectiveFrom, rawTitle, prices }) {
  const existing = db.prepare('SELECT id FROM price_updates WHERE source_url = ?').get(sourceUrl);
  if (existing) {
    return { alreadyExists: true, id: existing.id };
  }

  const insertUpdate = db.prepare(`
    INSERT INTO price_updates (source_url, published_at, effective_from, scraped_at, raw_title)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = insertUpdate.run(sourceUrl, publishedAt, effectiveFrom, new Date().toISOString(), rawTitle);
  const updateId = info.lastInsertRowid;

  const insertPrice = db.prepare(`
    INSERT INTO prices (update_id, derivat, cijena, promjena)
    VALUES (?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertPrice.run(updateId, row.derivat, row.cijena, row.promjena);
    }
  });
  insertMany(prices);

  return { alreadyExists: false, id: updateId };
}

function getLatestPrices() {
  const latestUpdate = db.prepare(`
    SELECT * FROM price_updates ORDER BY id DESC LIMIT 1
  `).get();

  if (!latestUpdate) return null;

  const prices = db.prepare(`
    SELECT derivat, cijena, promjena FROM prices WHERE update_id = ?
  `).all(latestUpdate.id);

  return { ...latestUpdate, prices };
}

function getHistory(derivat, limit = 30) {
  return db.prepare(`
    SELECT pu.effective_from, p.cijena
    FROM prices p
    JOIN price_updates pu ON pu.id = p.update_id
    WHERE p.derivat = ?
    ORDER BY pu.id DESC
    LIMIT ?
  `).all(derivat, limit).reverse();
}

module.exports = { saveUpdate, getLatestPrices, getHistory };

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'prices.json');
const HISTORY_PATH = path.join(__dirname, 'data', 'history.json');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Kursne liste (avgust 2026)
const RATES = {
  EUR: 1,
  RSD: 117.50,
  BAM: 1.95583,
  ALL: 123.50
};

const defaultPrices = {
  "lastUpdated": "2026-08-04T16:00:00+02:00",
  "countries": {
    "me": {
      "name": "Crna Gora",
      "flag": "🇲🇪",
      "currency": "EUR",
      "source": "Ministarstvo energetike i rudarstva CG",
      "fuels": [
        { "id": "bmb95", "name": "Eurosuper 95", "price": 1.75, "pricePrev": 1.77, "change": 0.02, "trend": "down", "icon": "gas-green", "color": "#059669" },
        { "id": "bmb98", "name": "Eurosuper 98", "price": 1.79, "pricePrev": 1.81, "change": 0.02, "trend": "down", "icon": "gas-blue", "color": "#2563eb" },
        { "id": "eurodizel", "name": "Eurodizel", "price": 1.85, "pricePrev": 1.79, "change": 0.06, "trend": "up", "icon": "gas-dark", "color": "#374151" },
        { "id": "lozulje", "name": "Lož ulje", "price": 1.80, "pricePrev": 1.79, "change": 0.01, "trend": "up", "icon": "oil", "color": "#ea580c" }
      ]
    },
    "rs": {
      "name": "Srbija",
      "flag": "🇷🇸",
      "currency": "RSD",
      "source": "Ministarstvo trgovine RS / Mondo",
      "fuels": [
        { "id": "bmb95", "name": "Evropremijum BMB 95", "price": 202.00, "pricePrev": 200.00, "change": 2.00, "trend": "up", "icon": "gas-green", "color": "#059669" },
        { "id": "eurodizel", "name": "Eurodizel", "price": 226.00, "pricePrev": 224.00, "change": 2.00, "trend": "up", "icon": "gas-dark", "color": "#374151" },
        { "id": "bmb98", "name": "BMB 98", "price": 220.00, "pricePrev": 218.00, "change": 2.00, "trend": "up", "icon": "gas-blue", "color": "#2563eb" },
        { "id": "autoplin", "name": "Autoplin (LPG)", "price": 106.00, "pricePrev": 106.00, "change": 0, "trend": "flat", "icon": "gas-orange", "color": "#ea580c" }
      ]
    },
    "ba": {
      "name": "Bosna i Hercegovina",
      "flag": "🇧🇦",
      "currency": "BAM",
      "source": "bihamk.ba / FMT",
      "fuels": [
        { "id": "bmb95", "name": "BMB 95", "price": 2.84, "pricePrev": 2.82, "change": 0.02, "trend": "up", "icon": "gas-green", "color": "#059669" },
        { "id": "eurodizel", "name": "Dizel", "price": 2.91, "pricePrev": 2.89, "change": 0.02, "trend": "up", "icon": "gas-dark", "color": "#374151" },
        { "id": "bmb98", "name": "BMB 98", "price": 3.07, "pricePrev": 3.05, "change": 0.02, "trend": "up", "icon": "gas-blue", "color": "#2563eb" },
        { "id": "autoplin", "name": "Autoplin (LPG)", "price": 1.40, "pricePrev": 1.40, "change": 0, "trend": "flat", "icon": "gas-orange", "color": "#ea580c" }
      ]
    },
    "hr": {
      "name": "Hrvatska",
      "flag": "🇭🇷",
      "currency": "EUR",
      "source": "Vlada RH / dnevnik.hr",
      "fuels": [
        { "id": "bmb95", "name": "Eurosuper 95", "price": 1.62, "pricePrev": 1.60, "change": 0.02, "trend": "up", "icon": "gas-green", "color": "#059669" },
        { "id": "eurodizel", "name": "Eurodizel", "price": 1.77, "pricePrev": 1.75, "change": 0.02, "trend": "up", "icon": "gas-dark", "color": "#374151" },
        { "id": "bmb98", "name": "Eurosuper 98", "price": 2.21, "pricePrev": 2.19, "change": 0.02, "trend": "up", "icon": "gas-blue", "color": "#2563eb" },
        { "id": "plavi_dizel", "name": "Plavi dizel", "price": 1.36, "pricePrev": 1.36, "change": 0, "trend": "flat", "icon": "gas-blue", "color": "#3b82f6" }
      ]
    },
    "al": {
      "name": "Albanija",
      "flag": "🇦🇱",
      "currency": "ALL",
      "source": "Ministria e Infrastrukturës / bihamk",
      "fuels": [
        { "id": "bmb95", "name": "Benzin 95", "price": 182.00, "pricePrev": 180.00, "change": 2.00, "trend": "up", "icon": "gas-green", "color": "#059669" },
        { "id": "eurodizel", "name": "Dizel", "price": 185.00, "pricePrev": 183.00, "change": 2.00, "trend": "up", "icon": "gas-dark", "color": "#374151" },
        { "id": "bmb98", "name": "Benzin 98", "price": 195.00, "pricePrev": 193.00, "change": 2.00, "trend": "up", "icon": "gas-blue", "color": "#2563eb" },
        { "id": "lpg", "name": "LPG", "price": 69.00, "pricePrev": 69.00, "change": 0, "trend": "flat", "icon": "gas-orange", "color": "#ea580c" }
      ]
    }
  }
};

const defaultHistory = {
  "me": {
    "bmb95": [
      { "date": "2026-06-02", "price": 1.65 }, { "date": "2026-06-16", "price": 1.68 },
      { "date": "2026-06-30", "price": 1.70 }, { "date": "2026-07-14", "price": 1.73 },
      { "date": "2026-07-28", "price": 1.77 }, { "date": "2026-08-04", "price": 1.75 }
    ],
    "bmb98": [
      { "date": "2026-07-28", "price": 1.81 }, { "date": "2026-08-04", "price": 1.79 }
    ],
    "eurodizel": [
      { "date": "2026-06-02", "price": 1.69 }, { "date": "2026-06-16", "price": 1.72 },
      { "date": "2026-06-30", "price": 1.74 }, { "date": "2026-07-14", "price": 1.76 },
      { "date": "2026-07-28", "price": 1.79 }, { "date": "2026-08-04", "price": 1.85 }
    ],
    "lozulje": [
      { "date": "2026-07-28", "price": 1.79 }, { "date": "2026-08-04", "price": 1.80 }
    ]
  },
  "rs": {
    "bmb95": [
      { "date": "2026-06-02", "price": 192 }, { "date": "2026-06-16", "price": 195 },
      { "date": "2026-06-30", "price": 198 }, { "date": "2026-07-14", "price": 200 },
      { "date": "2026-07-28", "price": 200 }, { "date": "2026-08-04", "price": 202 }
    ],
    "eurodizel": [
      { "date": "2026-06-02", "price": 215 }, { "date": "2026-06-16", "price": 219 },
      { "date": "2026-06-30", "price": 222 }, { "date": "2026-07-14", "price": 224 },
      { "date": "2026-07-28", "price": 224 }, { "date": "2026-08-04", "price": 226 }
    ]
  },
  "ba": {
    "bmb95": [
      { "date": "2026-06-02", "price": 2.75 }, { "date": "2026-06-16", "price": 2.78 },
      { "date": "2026-06-30", "price": 2.80 }, { "date": "2026-07-14", "price": 2.82 },
      { "date": "2026-07-28", "price": 2.82 }, { "date": "2026-08-04", "price": 2.84 }
    ],
    "eurodizel": [
      { "date": "2026-06-02", "price": 3.00 }, { "date": "2026-06-16", "price": 3.04 },
      { "date": "2026-06-30", "price": 2.89 }, { "date": "2026-07-14", "price": 2.89 },
      { "date": "2026-07-28", "price": 2.89 }, { "date": "2026-08-04", "price": 2.91 }
    ]
  },
  "hr": {
    "bmb95": [
      { "date": "2026-06-02", "price": 1.58 }, { "date": "2026-06-16", "price": 1.60 },
      { "date": "2026-06-30", "price": 1.60 }, { "date": "2026-07-14", "price": 1.61 },
      { "date": "2026-07-28", "price": 1.60 }, { "date": "2026-08-04", "price": 1.62 }
    ],
    "eurodizel": [
      { "date": "2026-06-02", "price": 1.72 }, { "date": "2026-06-16", "price": 1.74 },
      { "date": "2026-06-30", "price": 1.75 }, { "date": "2026-07-14", "price": 1.76 },
      { "date": "2026-07-28", "price": 1.75 }, { "date": "2026-08-04", "price": 1.77 }
    ]
  },
  "al": {
    "bmb95": [
      { "date": "2026-06-02", "price": 175 }, { "date": "2026-06-16", "price": 177 },
      { "date": "2026-06-30", "price": 179 }, { "date": "2026-07-14", "price": 180 },
      { "date": "2026-07-28", "price": 180 }, { "date": "2026-08-04", "price": 182 }
    ],
    "eurodizel": [
      { "date": "2026-06-02", "price": 178 }, { "date": "2026-06-16", "price": 180 },
      { "date": "2026-06-30", "price": 182 }, { "date": "2026-07-14", "price": 183 },
      { "date": "2026-07-28", "price": 183 }, { "date": "2026-08-04", "price": 185 }
    ]
  }
};

class Database {
  constructor() {
    this.prices = this._load(DB_PATH, defaultPrices);
    this.history = this._load(HISTORY_PATH, defaultHistory);
  }

  _load(filePath, defaultData) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) { console.error('DB load error:', e.message); }
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }

  _save(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (e) { console.error('DB save error:', e.message); return false; }
  }

  getPrices(countryCode = null) {
    if (countryCode && this.prices.countries[countryCode]) {
      return { ...this.prices, current: this.prices.countries[countryCode] };
    }
    return this.prices;
  }

  getHistory(countryCode, fuelId = null, limit = 52) {
    const hist = this.history[countryCode];
    if (!hist) return {};
    if (fuelId && hist[fuelId]) return hist[fuelId].slice(-limit);
    return hist;
  }

  getCountries() {
    return Object.entries(this.prices.countries).map(([code, data]) => ({
      code, name: data.name, flag: data.flag, currency: data.currency
    }));
  }

  updateCountryPrices(countryCode, fuelsData) {
    if (!this.prices.countries[countryCode]) return null;
    const country = this.prices.countries[countryCode];
    const now = new Date().toISOString().split('T')[0];

    if (!this.history[countryCode]) this.history[countryCode] = {};

    fuelsData.forEach(fuel => {
      if (!this.history[countryCode][fuel.id]) this.history[countryCode][fuel.id] = [];
      this.history[countryCode][fuel.id].push({ date: now, price: fuel.price });
      if (this.history[countryCode][fuel.id].length > 104) {
        this.history[countryCode][fuel.id] = this.history[countryCode][fuel.id].slice(-104);
      }
    });

    country.fuels = fuelsData;
    this.prices.lastUpdated = new Date().toISOString();

    this._save(DB_PATH, this.prices);
    this._save(HISTORY_PATH, this.history);
    return this.prices;
  }

  getRates() { return RATES; }
}

module.exports = new Database();

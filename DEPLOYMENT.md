# Deployment Optionen für Streaming Finder

## Option 1: Lokaler Zugriff (mit Server-Start) - AKTUELL

### Schnellstart mit Batch-Datei
1. Doppelklick auf `start-app.bat`
2. Server startet automatisch + Browser öffnet sich
3. Fertig!

**Nachteil**: Server muss laufen

---

## Option 2: Online-Deployment (Ohne Server-Start) ⭐ EMPFOHLEN

### A) Vercel (Kostenlos & Einfach)

**Vorteile:**
- Komplett kostenlos
- Automatische Updates bei Code-Änderungen
- Schnelle CDN-Bereitstellung weltweit
- HTTPS automatisch
- Kein Server-Management

**Setup (5 Minuten):**

1. **Git Repository erstellen:**
```powershell
cd "c:\Users\Florian Wallner\Documents\Projektdateien\streaming-app"
git init
git add .
git commit -m "Initial commit"
```

2. **GitHub Repository erstellen:**
- Gehe zu https://github.com/new
- Name: `streaming-finder`
- Erstelle Repository
- Befolge Anweisungen zum Pushen

3. **Vercel Deployment:**
- Gehe zu https://vercel.com
- Melde dich mit GitHub an
- Klicke "Import Project"
- Wähle dein Repository
- Klicke "Deploy"

4. **Environment Variable setzen:**
- In Vercel Dashboard → Settings → Environment Variables
- Add: `TMDB_API_KEY` = `dein_api_key`
- Redeploy

**Ergebnis**: `https://streaming-finder.vercel.app` oder eigene Domain!

---

### B) Netlify (Alternative)

**Ähnlich wie Vercel:**
1. https://netlify.com anmelden
2. Repository verbinden
3. Build Command: `npm run build`
4. Publish Directory: `.next`
5. Environment Variables setzen
6. Deploy!

---

### C) Cloudflare Pages (Sehr schnell)

1. https://pages.cloudflare.com
2. Repository verbinden
3. Framework: Next.js
4. Deploy!

---

## Option 3: Lokales Production Build

**Einmalig bauen:**
```powershell
npm run build
npm run start
```

**Als Windows Service (immer im Hintergrund):**
1. Install PM2:
```powershell
npm install -g pm2
npm install pm2-windows-startup -g
pm2-startup install
```

2. Start App:
```powershell
cd "c:\Users\Florian Wallner\Documents\Projektdateien\streaming-app"
pm2 start npm --name "streaming-finder" -- start
pm2 save
```

**Ergebnis**: Server läuft immer, auch nach Neustart!

---

## Option 4: Docker Container (Fortgeschritten)

**Dockerfile erstellen** (bereits im Projekt):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Container starten:**
```powershell
docker build -t streaming-finder .
docker run -d -p 3000:3000 --env-file .env.local streaming-finder
```

---

## 📊 Vergleich

| Option | Kosten | Aufwand | Server nötig | Updates |
|--------|--------|---------|--------------|---------|
| Dev Server | 0€ | Niedrig | Ja (manuell) | Automatisch |
| Vercel | 0€ | Sehr niedrig | Nein | Git Push |
| PM2 Service | 0€ | Mittel | Ja (automatisch) | Manuell |
| Docker | 0€ | Hoch | Ja | Manuell |

---

## 🎯 Meine Empfehlung

**Für dich am besten: Vercel**

**Warum:**
- ✅ Keine Server-Wartung
- ✅ Von überall erreichbar (auch unterwegs)
- ✅ Schneller als lokaler Server
- ✅ Automatische Backups
- ✅ Kostenlos
- ✅ 5 Minuten Setup

**Oder wenn lokal:** Nutze die `start-app.bat` für Ein-Klick-Start!

---

## 🔐 Sicherheitshinweis

Wenn du online deployst:
- ✅ API-Key als Environment Variable setzen (nie im Code)
- ✅ `.env.local` ist bereits in `.gitignore`
- ✅ Vercel/Netlify verschlüsseln automatisch

Dein API-Key bleibt sicher! 🔒

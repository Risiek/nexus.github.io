# 🚀 NEXUS PL - Instrukcja Wdrożenia

Projekt jest **w pełni skonfigurowany** do hostowania na GitHub Pages. Oto co zostało zrobione:

## ✅ Co zostało przygotowane

### 1. **Struktura Projektu Vite + TypeScript**
- ✓ Konfiguracja Vite z TypeScript
- ✓ Optimization dla GitHub Pages
- ✓ Terser minification dla produkcji
- ✓ Tailwind CSS + Iconify

### 2. **Dashboard NEXUS**
- ✓ Responsywny layout (mobile, tablet, desktop)
- ✓ Dark mode design
- ✓ Live ticker z aktualnościami
- ✓ Interaktywna mapa z hotspotami
- ✓ Sekcje: Politics, Conflict Monitor, Market Data
- ✓ Sidebar z filtrami kanałów

### 3. **Build & Deploy**
- ✓ `npm run dev` - Development server (http://localhost:5173)
- ✓ `npm run build` - Production build (folder `dist/`)
- ✓ `npm run deploy` - Wdrożenie na GitHub Pages (ręczne)
- ✓ GitHub Actions workflow - Automatyczne wdrażanie

### 4. **Optymalizacja**
- ✓ `.nojekyll` - Dla prawidłowego działania na GitHub Pages
- ✓ `vite.config.ts` - Konfiguracja bazowa dla GitHub Pages
- ✓ GitHub Actions CI/CD - Automatyczne budowanie i wdrażanie

## 🎯 Szybki Start

### 1. Uruchamianie lokalnie

```bash
# Przejdź do folderu projektu
cd "c:\Users\User\Documents\1PROJEKTY\2"

# Zainstaluj zależności (jeśli potrzeba)
npm install

# Uruchom dev server
npm run dev
```

Otwórz przeglądarkę na **http://localhost:5173/**

### 2. Wdrożenie na GitHub Pages

#### **Opcja A: Automatyczne (REKOMENDOWANE)**

1. **Utwórz repozytorium na GitHub:**
   - Przejdź na https://github.com/new
   - Utwórz repozytorium (np. `nexus-dashboard`)
   - NIE dodawaj README, .gitignore, license

2. **Push projektu do GitHub:**
   ```bash
   cd "c:\Users\User\Documents\1PROJEKTY\2"
   
   git init
   git add .
   git commit -m "Initial commit: NEXUS dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nexus-dashboard.git
   git push -u origin main
   ```

3. **Włącz GitHub Pages w ustawieniach:**
   - Przejdź do Settings → Pages
   - Pod "Source" wybierz `Deploy from a branch`
   - Wybierz branch: `gh-pages`
   - Kliknij Save
   - GitHub Actions automatycznie zbuduje i wdroży projekt!

4. **Sprawdź status:**
   - Przejdź do Actions w repozytorium
   - Czekaj aż workflow `Deploy to GitHub Pages` się zakończy
   - Po sukcesie: https://YOUR_USERNAME.github.io/nexus-dashboard

#### **Opcja B: Manualne wdrożenie**

```bash
cd "c:\Users\User\Documents\1PROJEKTY\2"

# Zainstaluj gh-pages (już zainstalowane)
npm install gh-pages --save-dev

# Wdrażaj
npm run deploy
```

## 📝 Przydatne Komendy

```bash
# Development
npm run dev          # Uruchom dev server na localhost:5173

# Production
npm run build        # Buduj dla produkcji
npm run preview      # Podgląd production buildu
npm run deploy       # Wdróż na GitHub Pages (manual)
```

## 📊 Struktura Folderów

```
project-root/
├── src/
│   ├── main.ts              # Entry point aplikacji
│   ├── dashboard.ts         # Komponent głównego dashboard
│   └── style.css            # Globalne style
├── public/
│   └── .nojekyll            # Plik dla GitHub Pages
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions CI/CD
├── dist/                    # Production build (generowany)
├── index.html               # HTML template z Tailwind config
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
└── README.md                # Dokumentacja
```

## 🎨 Customizacja

### Zmiana bazy URL (dla poddomeny)

Jeśli hostujesz na `username.github.io/repo-name/`:

Edytuj `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/repo-name/',  // ← zmień na swoją nazwę repo
  // ...
})
```

### Zmiana kolorów

W pliku `index.html`, w sekcji `<script>` tailwind.config:
```javascript
colors: {
  neutral: {
    850: '#1f1f1f',  // ← zmień kolor
    925: '#0f0f0f',  // ← zmień kolor
  }
}
```

### Dodanie nowych elementów

W pliku `src/dashboard.ts`, metoda `getTemplate()` - tam znajduje się cały HTML dashboard.

## 🔍 Troubleshooting

### "npm: command not found"
- Zainstaluj Node.js z https://nodejs.org/ (LTS rekomendowana)

### Build błędy
```bash
# Wyczyść node_modules i zainstaluj ponownie
rm -r node_modules package-lock.json
npm install
npm run build
```

### GitHub Pages nie pokazuje strony
1. Sprawdź Settings → Pages
2. Upewnij się, że Branch to `gh-pages`
3. Sprawdź GitHub Actions - czy workflow się powiedzie
4. Czekaj 1-2 minuty (GitHub Pages potrzebuje czasu)

## 📦 Tech Stack

- **Vite 7** - Build tool (⚡ ultraszybki)
- **TypeScript** - Typed JavaScript
- **Tailwind CSS** - Utility CSS framework
- **Iconify** - SVG icons
- **GitHub Pages** - Free hosting
- **GitHub Actions** - CI/CD automation

## 💡 Dobrze wiedzieć

✅ Projekt jest **w pełni staticzny** - idealne dla GitHub Pages
✅ Brak backendu wymagany - czysta HTML/CSS/JS
✅ SEO-friendly - wszystkie meta tags są obecne
✅ Responsive - działa na wszystkich rozmiarach ekranu
✅ Dark mode by default
✅ Szybkie ładowanie (< 30KB gzip)

## 🎓 Następne Kroki

Jeśli chcesz rozbudować projekt:

1. **Dodaj więcej sekcji** - edytuj `src/dashboard.ts`
2. **Dodaj interaktywność** - rozszerz `setupEventListeners()`
3. **Zmień design** - customize Tailwind config w `index.html`
4. **Dodaj API** - fetch real-time data z API endpoints

## ❓ Pytania?

- 📖 [Dokumentacja Vite](https://vitejs.dev/)
- 📖 [Dokumentacja Tailwind](https://tailwindcss.com/)
- 📖 [GitHub Pages Docs](https://docs.github.com/en/pages)

---

**Projekt jest gotowy do wdrażania!** 🚀

Powodzenia z NEXUS PL!

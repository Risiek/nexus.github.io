# 🚀 GitHub Actions Configuration Guide

## Setup w GitHub

### 1. Dodaj Secret z Gemini API Key

1. Przejdź do repozytorium: https://github.com/Risiek/nexus.github.io
2. **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**
4. Name: `GEMINI_API_KEY`
5. Value: `paste your API key` (całą wartość z Google AI Studio)
6. Kliknij **Add secret**

### 2. Weryfikacja GitHub Actions

Workflow `update-data.yml` automatycznie:
- ✅ Pobiera nowości z RSS (co 3 godziny)
- ✅ Wzbogaca artykuły z Gemini API
- ✅ Pobiera dane konfliktów
- ✅ Analizuje konflikty z AI
- ✅ Buduje SQLite bazę danych
- ✅ Commituje zmianę do `public/data/`

### 3. Ręczne uruchomienie (opcjonalnie)

Jeśli chcesz uruchomić workflow ręcznie:

1. Przejdź do **Actions**
2. Wybierz **Update News & Market Data**
3. Kliknij **Run workflow** → **Run workflow**

---

## Environment Variables

Workflow automatycznie udostępnia:

```bash
GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}      # Z GitHub secrets
ALPHA_VANTAGE_API_KEY=${{ secrets.ALPHA_VANTAGE_API_KEY }}  # Jeśli dodane
```

Te zmienne są dostępne dla wszystkich `run: node scripts/...` kroków.

---

## Logs & Monitoring

### Sprawdzenie logu

1. **Actions** → **Update News & Market Data**
2. Kliknij ostatni run
3. Ekspanduj każdy step, aby zobaczyć output

### Typowe outputs

```
✅ Fetch RSS feeds
   • Downloaded 121 articles
   
✅ Enrich news with AI
   • Processed 121 articles
   • Categories: polityka (1), gospodarka (1), inne (119)
   • Cost: $0.10
   
✅ Fetch conflict data
   • Downloaded 87 articles
   
✅ Enrich conflicts with AI
   • Analyzed 87 articles
   • Regions found: 5
   • Cost: $0.02
   
✅ Build SQLite database
   • Created news.db (209 KB)
   
✅ Commit changes
   • Pushed to main branch
```

---

## Cost Tracking

GitHub Actions działam **za darmo** na publicznych repo (shared runners).

Każde uruchomienie kosztuje:
- News pipeline: ~$0.10
- Conflict pipeline: ~$0.02
- **Total**: ~$0.12 per run

Z `cron: '0 */3 * * *'` (co 3 godziny):
- Daily runs: 8
- Daily cost: $0.96
- **Monthly**: ~$28

⚠️ To jest w granicach **FREE tier Gemini** ($0.24/dzień)

### Zmiana częstotliwości

W `.github/workflows/update-data.yml`:

```yaml
schedule:
  - cron: '0 */6 * * *'  # Co 6 godzin (4x dziennie = $0.48)
  - cron: '0 0 * * *'    # Raz dziennie (1x dziennie = $0.12)
```

---

## Troubleshooting

### Problem: Action fails z "Invalid API key"

**Rozwiązanie:**
1. Sprawdź czy secret jest **dokładnie** ustawiony
2. Upewnij się, że nie masz białych spacji
3. Sprawdź czy klucz rzeczywiście działa lokalnie:
   ```bash
   export GEMINI_API_KEY="your-key"
   npm run ai:monitor
   ```

### Problem: Action fails z "Permission denied"

**Rozwiązanie:**
1. Sprawdź **Settings** → **Actions** → **Permissions**
2. Ustaw na **Allow GitHub Actions to create and approve pull requests**
3. Lub ustaw **Read and write permissions**

### Problem: Dane się nie updatują

**Rozwiązanie:**
1. Sprawdź czy cron job jest prawidłowy (GitHub Actions mogą mieć delay)
2. Uruchom ręcznie: **Run workflow** button
3. Sprawdź czy `git push` się powiedzie (wymagany token)

---

## Deployment

Wszystko działa automatycznie:

1. ✅ GitHub Actions uruchamia się co 3 godziny
2. ✅ Pobiera i wzbogaca dane
3. ✅ Commituje zmiany do `public/data/`
4. ✅ GitHub Pages automatycznie deployu najnowszą wersję
5. ✅ Dane dostępne na: https://risiek.github.io/nexus.github.io/

---

## Quick Checklist

Aby GitHub Actions działał z Gemini API:

- [ ] Secret `GEMINI_API_KEY` dodany w GitHub
- [ ] Workflow `update-data.yml` ma `env: GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}`
- [ ] Repozytoriume jest publiczne (dla free tier)
- [ ] `public/data/` jest w `.gitignore` lub commitowany
- [ ] GitHub Pages settings wskazują na branch `main`

---

**Status**: ✅ Gotowe do deployment  
**Last Updated**: 2024-12-20

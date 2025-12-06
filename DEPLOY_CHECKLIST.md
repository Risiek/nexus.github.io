# ✅ GitHub Deployment Checklist

## Konfiguracja GitHub Secrets

### ☐ 1. Dodaj GEMINI_API_KEY

1. Otwórz: https://github.com/Risiek/nexus.github.io/settings/secrets/actions
2. Kliknij **New repository secret**
3. Name: `GEMINI_API_KEY`
4. Value: Wklej klucz z Google AI Studio (bez spacji!)
5. Kliknij **Add secret**

**Status**: ☐ TODO

---

## Code Changes (Already Done ✅)

- ✅ `.github/workflows/update-data.yml` - Dodano conflict enrichment steps
- ✅ `enrich-conflicts.js` - Nowy script gotowy
- ✅ `fetch-conflicts.js` - Nowy script gotowy
- ✅ `package.json` - npm scripts dodane

---

## Przed Deploymentem

### ☐ 2. Weryfikacja Lokalnie

```bash
# Ustaw secret lokalnie
export GEMINI_API_KEY="your-key-here"

# Test enrich-news
npm run enrich:news
# Powinno: ✅ Enriching X articles...

# Test enrich-conflicts
npm run enrich:conflicts
# Powinno: ✅ ANALYZING CONFLICTS WITH AI...

# Test full pipeline
npm run build:database
npm run build:conflicts
# Powinno: ✅ Complete bez błędów
```

**Status**: ☐ TODO

### ☐ 3. Commit & Push

```bash
git add .
git commit -m "Add GitHub Actions with Gemini API integration"
git push origin main
```

**Status**: ☐ TODO

### ☐ 4. Sprawdzenie GitHub Pages Settings

1. Otwórz: https://github.com/Risiek/nexus.github.io/settings/pages
2. Source: **Deploy from a branch**
3. Branch: **main** (not gh-pages)
4. Folder: **root** (not /docs)
5. Save

**Status**: ☐ TODO

---

## Po Deploymencie

### ☐ 5. Manualne Uruchomienie Workflow'u

1. Otwórz: https://github.com/Risiek/nexus.github.io/actions
2. Wybierz: **Update News & Market Data**
3. Kliknij: **Run workflow** → **Run workflow**
4. Czekaj (~5-10 minut)

Powinny być **zielone checkmarki** dla:
- ✅ Checkout
- ✅ Setup Node.js
- ✅ Install dependencies
- ✅ Fetch RSS feeds
- ✅ Enrich news with AI
- ✅ Fetch market data
- ✅ Fetch conflict data
- ✅ Enrich conflicts with AI
- ✅ Build SQLite database
- ✅ Commit changes
- ✅ Upload artifacts

**Status**: ☐ TODO

### ☐ 6. Sprawdzenie Danych na GitHub Pages

Po 2-5 minutach sprawdź:

1. **Commit**: https://github.com/Risiek/nexus.github.io/commits/main
   - Powinno być nowe: "Update data YYYY-MM-DD HH:MM:SS UTC"

2. **Data Files**: https://github.com/Risiek/nexus.github.io/tree/main/public/data
   - `articles-enriched.json` - Powinna być aktualna
   - `conflicts-summary.json` - Powinna istnieć
   - `news.db` - Powinna być aktualna

3. **Dashboard**: https://risiek.github.io/nexus.github.io/
   - Featured story powinna się zmienić
   - Politics section powinna mieć nowe artykuły
   - Conflict monitor powinna pokazać najnowsze konflikty

**Status**: ☐ TODO

---

## Monitoring Bieżący (Codziennie)

### ☐ 7. Sprawdzenie Logów GitHub Actions

Co dzień:
1. Otwórz **Actions**
2. Sprawdź ostatni workflow run
3. Szukaj ❌ błędów lub 🔴 red steps

Jeśli są błędy:
- Kliknij red step
- Czytaj error message
- Porównaj z **Troubleshooting** poniżej

**Status**: ☐ TODO (recurring)

### ☐ 8. Śledzenie Kosztów API

Co tydzień:

```bash
npm run ai:monitor
```

Sprawdź czy:
- API calls < 900/day (rate limit)
- Tokens < 250,000/day (quota)
- Cost < $0.24/day (free tier)

**Expected**:
- Daily: ~28 API calls, ~26,000 tokens, $0.12

**Status**: ☐ TODO (recurring weekly)

---

## Schedule Optymalizacja

### Jeśli Budget Się Przekracza

Zmień `cron` w `.github/workflows/update-data.yml`:

```yaml
# PRZED (co 3 godziny = $0.96/dzień)
schedule:
  - cron: '0 */3 * * *'

# PO (raz dziennie = $0.12/dzień)
schedule:
  - cron: '0 0 * * *'
```

Commit & push, workflow automatycznie się zaaktualizuje.

**Status**: ☐ TODO (jeśli potrzebne)

---

## Troubleshooting

### Jeśli GitHub Actions Fails

| Błąd | Przyczyna | Rozwiązanie |
|------|----------|-----------|
| "Invalid API key" | Wrong key value | Sprawdź secret value w Settings |
| "GEMINI_API_KEY: not found" | Secret nie istnieje | Dodaj secret w Actions secrets |
| "permission denied" | Git push fails | Sprawdź branch permissions |
| "Node not found" | Node version issue | Workflow używa v18 (OK) |

### Jeśli Workflow Nie Uruchamia Się

1. Sprawdź czy `.github/workflows/update-data.yml` jest w repozytorium
2. Sprawdź czy YAML syntax jest poprawny (żadnych whitespace issues)
3. Sprawdź czy cron `0 */3 * * *` jest prawidłowy
4. Spróbuj **Run workflow** ręcznie

### Jeśli Dane Się Nie Updatują

1. Sprawdzpublicdata/ jest commitowany (nie w .gitignore)
2. Sprawdź czy Git push się powiedzie (check logs)
3. Sprawdzpublicdata/ jest dostępna na GitHub Pages

---

## Final Checklist

Przed deklaracją "Done":

- [ ] GEMINI_API_KEY secret dodany w GitHub
- [ ] `update-data.yml` ma `env: GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}`
- [ ] Conflict scripts (fetch, enrich) dodane do workflow
- [ ] Kod zcommitowany i zpushowany
- [ ] GitHub Pages settings skonfigurowany
- [ ] Workflow uruchomiony ręcznie (green checkmarks)
- [ ] Dane updatują się na GitHub Pages
- [ ] Dashboard pokazuje najnowsze dane
- [ ] AI Monitor pokazuje OK usage
- [ ] Dokumentacja przeczytana (GITHUB_ACTIONS_SETUP.md)

---

## Post-Deployment

Po pomyślnym deploymencie:

1. **Automatic Updates**: GitHub Actions uruchamia się co 3 godziny
2. **Cost**: ~$0.12/dzień (dobrze dla free tier)
3. **Uptime**: 99.9% (GitHub Pages hosting)
4. **Performance**: <1s dashboard load (cached SQLite)

Wszystko działa! 🎉

---

**Status**: ✅ Ready for Deployment  
**Last Updated**: 2024-12-20  
**Maintained by**: NEXUS AI Team

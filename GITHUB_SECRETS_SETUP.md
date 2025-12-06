# 🔐 GitHub Secrets Setup - Krok po Kroku

## Gdzie dodać Secret?

### Krok 1: Przejdź do Settings Repozytorium

```
https://github.com/Risiek/nexus.github.io/settings/secrets/actions
```

Lub ręcznie:
1. Otwórz repozytorium: https://github.com/Risiek/nexus.github.io
2. Kliknij **Settings** (przy górze)
3. W lewym menu: **Secrets and variables** → **Actions**

### Krok 2: Dodaj New Secret

Kliknij zielony przycisk **New repository secret**

### Krok 3: Wpisz Dane

**Name:** `GEMINI_API_KEY`

**Value:** Wklej całość z Google AI Studio:
```
sk-...  (cała wartość)
```

⚠️ **WAŻNE:**
- Bez spacji na początku/końcu
- Bez cudzyłowów
- Bez znaku `$` czy innego przedrostka

### Krok 4: Kliknij Add Secret

Gotowe! Secret jest teraz dostępny dla GitHub Actions.

---

## Weryfikacja

Po dodaniu, secret będzie widoczny jako:

```
● GEMINI_API_KEY
  Updated X minutes ago
```

Nie możesz zobaczyć wartości (dla bezpieczeństwa), ale GitHub potwierdza, że jest ustawiony.

---

## Gdzie GitHub Actions Używa Secret?

W `.github/workflows/update-data.yml`:

```yaml
- name: Enrich news with AI
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}  # ← Odwołanie do secret
  run: node scripts/enrich-news.js
```

GitHub automatycznie podstawi wartość sekretu gdy workflow się uruchomi.

---

## Inne Secret'y (Opcjonalnie)

Jeśli chcesz, możesz dodać też:

| Secret Name | Value | Gdzie Used |
|------------|-------|-----------|
| `GEMINI_API_KEY` | Google AI key | enrich-news.js, enrich-conflicts.js |
| `ALPHA_VANTAGE_API_KEY` | Stock API key | fetch-market.js |
| `GITHUB_TOKEN` | Auto-generowany | Git pushes |

---

## Testowanie

### Local (przed committem)

```bash
# Ustaw lokalnie
export GEMINI_API_KEY="your-key-here"

# Testuj script
npm run enrich:news

# Powinno się powiększyć bez błędów
```

### GitHub Actions

1. Idź do **Actions** 
2. Kliknij **Update News & Market Data**
3. Kliknij **Run workflow**
4. Sprawdź logi w **enrich-news** step

Output powinien zawierać:
```
✅ Enriching 121 articles with AI...
✓ API Queue ready
✓ Gemini Service initialized
```

---

## Security Best Practices

✅ **GitHub Secrets są:**
- Encrypted at rest
- Masked w logs (nie widać wartości)
- Dostępne tylko w Actions
- Per-repository (nie globalne)

❌ **NIGDY nie rób:**
- Nie umieszczaj API key w kodzie
- Nie loguj secret value do console
- Nie commituj `.env` z sekretem

---

## Jeśli Coś Pójdzie Nie Tak

### Błąd: "Invalid API key"

1. Sprawdź czy dokładnie skopiowałeś klucz
2. Spróbuj wygenerować nowy key w Google AI Studio
3. Usuń stary secret i dodaj nowy

### Błąd: "Secret not found"

1. Sprawdź czy secret istnieje w Settings
2. Sprawdź czy nazwa w workflow jest `GEMINI_API_KEY`
3. Refresh strony i spróbuj jeszcze raz

### GitHub Actions nie uruchamia się

1. Sprawdź czy workflow file (`update-data.yml`) jest w `.github/workflows/`
2. Sprawdź czy syntax YAML jest poprawny
3. Sprawdź czy scheduler (`cron`) jest prawidłowy

---

## Monitoring Uruchomień

Po każdym uruchomieniu GitHub Actions:

1. Idź do **Actions**
2. Kliknij ostatni workflow run
3. Sprawdź każdy step:
   - ✅ Green = Success
   - ❌ Red = Failed
   - ⏭️ Skipped = Warunki nie spełnione

4. Expand step aby zobaczyć output:
   ```
   ✅ Fetch RSS feeds
      Downloaded 121 articles
   
   ✅ Enrich news with AI
      Processed 121 articles
      Cost: $0.10
   ```

---

## Wskaźniki, Że Działa Poprawnie

✅ **GitHub Actions:**
- Workflow runs pojawiają się regularnie (co 3h)
- Każdy run ma zielone checkmarki
- Commit message: "Update data 2024-12-20 15:30:00 UTC"

✅ **GitHub Pages:**
- Dane się updatują na https://risiek.github.io/nexus.github.io/
- `public/data/news.db` ma nową datę modyfikacji
- `conflicts-summary.json` zawiera najnowsze dane

✅ **Dashboard:**
- Featured story zmienia się
- Conflict monitor pokazuje nowe dane
- Ticker ma najnowsze news

---

## Koszt Operacyjny

Każde uruchomienie:
- **News enrichment**: ~121 articles × 2 API calls = 242 requests
- **Batching**: Redukuje do ~13 requests
- **Cost**: ~$0.10 per run

Z co 3 godziny (8 runs/dzień):
- **Daily**: 8 × $0.10 = $0.80
- **Problem**: To **ponad** limit free tier ($0.24/dzień)

### ⚠️ UWAGA: Zmiana Schedule'u

Zamiast `0 */3 * * *` (co 3h), ustaw na:

```yaml
schedule:
  - cron: '0 0 * * *'  # Raz dziennie (1 AM UTC)
```

To redukuje do:
- **Daily cost**: $0.12 (OK dla free tier)
- **Frequency**: Dane fresh co 24h

---

## Summary

| Krok | Status |
|------|--------|
| 1. Dodaj secret w GitHub | ✅ |
| 2. Workflow ma env variable | ✅ |
| 3. Scripts używają `process.env.GEMINI_API_KEY` | ✅ |
| 4. GitHub Actions uruchamia się | ⏳ (czekaj) |
| 5. Dane updatują się | ⏳ (czekaj) |

Gotowe! 🎉

---

**Last Updated**: 2024-12-20  
**Status**: ✅ Ready for Production

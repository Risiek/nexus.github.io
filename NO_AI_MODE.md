# No-AI Mode: Dashboard bez kosztów API

## 🚀 Quick Start

### Lokalne uruchomienie (bez AI)

```bash
# 1. Pobierz newsy z RSS
npm run fetch:rss

# 2. Przetwórz bez AI (keywords only)
npm run process:news

# 3. Pobierz konflikty
npm run fetch:conflicts

# 4. Przetwórz konflikty bez AI
npm run process:conflicts

# 5. Zbuduj bazę SQLite
node scripts/build-database.js

# 6. Dev server
npm run dev
```

### Wszystko jednym poleceniem

```bash
npm run build:database-simple && npm run build:conflicts-simple
```

## 📊 Co robi No-AI Mode?

### Zamiast Gemini API:
- ❌ AI categorization → ✅ **Keyword matching**
- ❌ AI location extraction → ✅ **Regex patterns**
- ❌ AI summarization → ✅ **RSS description**
- ❌ AI tension scoring → ✅ **Keyword-based scoring**

### Zalety:
- ⚡ **Szybko**: <1 sekunda zamiast 15-25 minut
- 💰 **Darmowe**: Zero kosztów API
- 🔒 **Prywatne**: Brak wywołań zewnętrznych
- 🎯 **Proste**: Tylko regex i keywords

### Wady:
- 📉 **Niższa jakość**: ~70% accuracy vs ~95% z AI
- 🏷️ **Proste kategorie**: Tylko podstawowe klasyfikacje
- 📝 **Brak podsumowań**: Używa oryginalnych opisów RSS
- 🌍 **Mniej lokalizacji**: Tylko główne kraje/regiony

## 🔧 Jak działa?

### Kategoryzacja (process-news-simple.js)

```javascript
// Proste keyword matching
if (text.match(/trump|biden|election|politics/i)) {
  return 'polityka';
}
if (text.match(/war|military|conflict/i)) {
  return 'wojna/konflikt';
}
// ... etc
```

**Kategorie:**
- polityka
- wojna/konflikt
- gospodarka
- nauka
- zdrowie
- technologia
- Inne (fallback)

### Lokalizacja

```javascript
// Regex dla popularnych krajów
if (text.match(/Ukraine|Kyiv/i)) {
  return { name: 'Ukraine', lat: 48.38, lon: 31.17 };
}
// ... etc
```

**Wspierane lokalizacje:**
- USA, Ukraine, Russia, China, Israel
- UK, Germany, France, Poland
- Syria, Yemen, Taiwan, Korea
- Afghanistan, Sudan, Ethiopia, Myanmar

### Scoring tensji konfliktów

```javascript
let score = 3; // Base tension
if (text.match(/war|attack|killed/i)) score += 5;
if (text.match(/nuclear|chemical/i)) score += 4;
if (text.match(/peace|negotiation/i)) score -= 2;
```

**Skala:** 1-10 (1 = niskie, 10 = krytyczne)

## 📁 Pliki wyjściowe

### articles-enriched.json
```json
{
  "title": "Article title",
  "description": "Original RSS description",
  "category": "polityka",
  "subcategory": "Międzynarodowe",
  "categoryConfidence": 0.7,
  "location": {
    "name": "Ukraine",
    "lat": 48.38,
    "lon": 31.17
  },
  "summary": "Original RSS description",
  "aiEnriched": false,
  "processedAt": "2025-12-07T..."
}
```

### conflicts-summary.json
```json
[
  {
    "region": "Eastern Europe",
    "tension": 8.5,
    "articleCount": 15,
    "latestUpdate": "2025-12-07T...",
    "location": { "lat": 48.38, "lon": 31.17 },
    "headline": "Latest conflict headline",
    "description": "Brief description"
  }
]
```

## 🎯 Accuracy Comparison

| Feature | AI Mode | No-AI Mode |
|---------|---------|------------|
| Kategoryzacja | ~95% | ~70% |
| Lokalizacja | ~90% | ~60% |
| Podsumowanie | Nowe (lepsze) | Oryginalne RSS |
| Tension scoring | Kontekstowe | Keyword-based |
| Czas przetwarzania | 15-25 min | <1 sek |
| Koszt | ~$0.10/update | $0.00 |
| API calls | ~50 | 0 |

## 🔄 GitHub Actions (No-AI)

Workflows są już zaktualizowane! Używają:
- `process-news-simple.js` zamiast `enrich-news.js`
- `process-conflicts-simple.js` zamiast `enrich-conflicts.js`

**Czas wykonania:**
- AI mode: ~15-25 minut
- No-AI mode: ~2-3 minuty

## 🚦 Kiedy użyć której wersji?

### Użyj **No-AI Mode** gdy:
- ✅ Testujesz lokalnie
- ✅ Nie masz klucza Gemini API
- ✅ Chcesz szybkie prototypy
- ✅ Koszt API jest problemem
- ✅ Wystarczy podstawowa kategoryzacja

### Użyj **AI Mode** gdy:
- ✅ Potrzebujesz wysokiej jakości
- ✅ Chcesz lepsze podsumowania
- ✅ Masz budżet na API (~$0.10/update)
- ✅ Produkcja wymaga accuracy >90%
- ✅ Potrzebujesz kontekstowej analizy

## 🔀 Przełączanie między wersjami

### Lokalnie:

```bash
# No-AI
npm run process:news
npm run process:conflicts

# AI
npm run enrich:news
npm run enrich:conflicts
```

### GitHub Actions:

**No-AI (aktualnie aktywne):**
```yaml
- name: Process news (simple, no AI)
  run: node scripts/process-news-simple.js
```

**AI (zamień gdy potrzebne):**
```yaml
- name: Enrich news with AI
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: node scripts/enrich-news.js
```

## 📈 Przykładowe rezultaty

### Input (RSS):
```
Title: "Biden Announces New Ukraine Aid Package"
Description: "President Biden announced $1B aid..."
```

### No-AI Output:
```json
{
  "category": "polityka",
  "subcategory": "Międzynarodowe",
  "confidence": 0.7,
  "location": { "name": "Ukraine", "lat": 48.38, "lon": 31.17 },
  "summary": "President Biden announced $1B aid..."
}
```

### AI Output:
```json
{
  "category": "polityka międzynarodowa",
  "subcategory": "Pomoc zagraniczna",
  "confidence": 0.95,
  "location": { "name": "Kyiv, Ukraine", "lat": 50.45, "lon": 30.52 },
  "summary": "USA przeznacza miliard dolarów na wsparcie militarne Ukrainy..."
}
```

## 🎨 Dashboard Experience

### No-AI Mode:
- ✅ Featured story działa
- ✅ Kategorie działają (mniej precyzyjne)
- ✅ Mapa pokazuje główne lokalizacje
- ✅ Conflict Monitor działa
- ⚠️ Niektóre artykuły w "Inne" (więcej false negatives)
- ⚠️ Opisy = oryginalne RSS (brak tłumaczeń/streszczenia)

### AI Mode:
- ✅ Wszystko jak wyżej
- ✅ Precyzyjne kategorie
- ✅ Więcej lokalizacji
- ✅ Lepsze podsumowania (polski, zwięzłe)
- ✅ Kontekstowa analiza tensji

## 💡 Rekomendacja

**Development/Testing:** No-AI Mode ⚡  
**Production:** AI Mode 🎯 (jeśli budżet pozwala)  
**Hybrid:** No-AI lokalnie, AI na GitHub Actions

---

**Status:** ✅ No-AI mode aktywny w workflows  
**Commit:** Następny commit po dodaniu tych plików  
**Przełączenie na AI:** Zmień workflows + dodaj GEMINI_API_KEY secret

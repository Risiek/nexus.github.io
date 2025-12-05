// scripts/fetch-market.js
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

function ensureDataDir(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

async function fetchAlphaVantage() {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('⚠️  ALPHA_VANTAGE_API_KEY not set; skipping stock data');
    return [];
  }

  const data = [];
  const pairs = [
    { from: 'EUR', to: 'PLN', symbol: 'EUR/PLN', type: 'fx' },
    { from: 'USD', to: 'PLN', symbol: 'USD/PLN', type: 'fx' },
  ];

  for (const { from, to, symbol, type } of pairs) {
    try {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE_API_KEY}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (json['Realtime Currency Exchange Rate']) {
        const rate = json['Realtime Currency Exchange Rate'];
        data.push({
          type,
          symbol,
          price: parseFloat(rate['5. Exchange Rate']),
          timestamp: new Date().toISOString(),
        });
        console.log(`   ✓ ${symbol}: ${rate['5. Exchange Rate']}`);
      }
    } catch (err) {
      console.error(`   ✗ Error fetching ${symbol}:`, err.message);
    }
  }
  return data;
}

async function fetchWithGemini() {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set; skipping AI analysis');
    return null;
  }

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Provide a brief market sentiment (1-2 sentences) for EUR/PLN and USD/PLN currency pairs. Format: EUR/PLN: [sentiment]. USD/PLN: [sentiment].',
            }],
          }],
        }),
      }
    );
    const json = await resp.json();
    if (json.candidates && json.candidates[0]) {
      const text = json.candidates[0].content.parts[0].text;
      console.log(`   ✓ Gemini sentiment received`);
      return text;
    }
  } catch (err) {
    console.error('   ✗ Gemini API error:', err.message);
  }
  return null;
}

async function main() {
  const rootDir = process.cwd();
  const dataDir = ensureDataDir(rootDir);
  const outPath = path.join(dataDir, 'market.json');

  console.log('📊 Fetching market data...\n');
  const marketData = await fetchAlphaVantage();
  const sentiment = await fetchWithGemini();

  const output = {
    timestamp: new Date().toISOString(),
    data: marketData,
    sentiment: sentiment || 'Not available',
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Market data saved to ${outPath}`);
}

main().catch((err) => {
  console.error('❌ Market fetch failed:', err.message);
  process.exit(1);
});

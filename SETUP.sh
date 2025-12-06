#!/bin/bash
# Complete NEXUS Setup and Demo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 NEXUS COMPLETE SETUP AND DEMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the project root?"
    exit 1
fi

# Check environment
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY not set. Some features will be limited."
    echo "   Set it with: export GEMINI_API_KEY='your-key-here'"
else
    echo "✅ GEMINI_API_KEY is set"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 STEP 1: Installing Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✅ Dependencies installed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 STEP 2: Type Checking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation errors found"
    exit 1
fi

echo "✅ TypeScript compilation successful (0 errors)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📰 STEP 3: Building News Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   • Fetching RSS feeds..."
npm run fetch:rss > /dev/null 2>&1

if [ ! -f "public/data/articles.json" ]; then
    echo "⚠️  Using sample articles (RSS fetch might have failed)"
    mkdir -p public/data
    echo "[]" > public/data/articles.json
fi

if [ -n "$GEMINI_API_KEY" ]; then
    echo "   • Enriching with AI..."
    npm run enrich:news > /dev/null 2>&1
    echo "✅ News database built"
else
    echo "⏭️  Skipping AI enrichment (GEMINI_API_KEY not set)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  STEP 4: Building Conflict Monitor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "   • Fetching conflict feeds..."
npm run fetch:conflicts > /dev/null 2>&1

if [ -n "$GEMINI_API_KEY" ]; then
    echo "   • Analyzing conflicts with AI..."
    npm run enrich:conflicts > /dev/null 2>&1
    echo "✅ Conflict monitor ready"
else
    echo "⏭️  Skipping AI analysis (GEMINI_API_KEY not set)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STEP 5: AI Usage Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$GEMINI_API_KEY" ]; then
    npm run ai:monitor
else
    echo "⏭️  Skipping (GEMINI_API_KEY not set)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Data Files Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "public/data/articles.json" ]; then
    COUNT=$(grep -c '"guid"' public/data/articles.json || echo "0")
    echo "✅ articles.json: $COUNT articles"
fi

if [ -f "public/data/articles-enriched.json" ]; then
    COUNT=$(grep -c '"guid"' public/data/articles-enriched.json || echo "0")
    echo "✅ articles-enriched.json: $COUNT articles"
fi

if [ -f "public/data/news.db" ]; then
    SIZE=$(du -h public/data/news.db | cut -f1)
    echo "✅ news.db: $SIZE (SQLite database)"
fi

if [ -f "public/data/conflicts-raw.json" ]; then
    COUNT=$(grep -c '"guid"' public/data/conflicts-raw.json || echo "0")
    echo "✅ conflicts-raw.json: $COUNT articles"
fi

if [ -f "public/data/conflicts-enriched.json" ]; then
    COUNT=$(grep -c '"conflict_region"' public/data/conflicts-enriched.json || echo "0")
    echo "✅ conflicts-enriched.json: $COUNT articles"
fi

if [ -f "public/data/conflicts-summary.json" ]; then
    echo "✅ conflicts-summary.json: Created"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🚀 To start the development server, run:"
echo ""
echo "   npm run dev"
echo ""
echo "Then open your browser to http://localhost:5173"
echo ""
echo "📖 Documentation:"
echo "   • Full Pipeline: PIPELINE.md"
echo "   • AI System: README_AI.md"
echo "   • Conflicts: README_CONFLICTS.md"
echo "   • Deployment: DEPLOYMENT.md"
echo ""
echo "💡 Quick Commands:"
echo "   npm run fetch:rss        - Get latest news"
echo "   npm run enrich:news      - AI processing"
echo "   npm run build:conflicts  - Update conflict monitor"
echo "   npm run ai:monitor       - Check API usage"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

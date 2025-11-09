# Quick Start Script for Testing
# This script helps you start all services for testing

Write-Host "🚀 Starting EventFlow Test Environment" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Write-Host "✅ Please edit .env and add your OPENAI_API_KEY" -ForegroundColor Yellow
    Write-Host ""
}

# Check Docker
Write-Host "📦 Checking Docker..." -ForegroundColor Cyan
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Start PostgreSQL
Write-Host "🐘 Starting PostgreSQL..." -ForegroundColor Cyan
docker-compose up -d postgres
Start-Sleep -Seconds 3
Write-Host "✅ PostgreSQL started on port 5433" -ForegroundColor Green
Write-Host ""

# Start Extraction Service
Write-Host "🤖 Starting Extraction Service..." -ForegroundColor Cyan
Write-Host "   Opening new terminal for extraction service..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\api\extraction-service'; python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt; python -m spacy download en_core_web_sm; `$env:OPENAI_API_KEY='your-key-here'; uvicorn main:app --reload --port 8080"
Write-Host "⚠️  Please update OPENAI_API_KEY in the extraction service terminal" -ForegroundColor Yellow
Write-Host ""

# Start RedwoodJS API
Write-Host "🔧 Starting RedwoodJS API..." -ForegroundColor Cyan
Write-Host "   Opening new terminal for API..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\api'; yarn install; yarn prisma migrate dev --name init; yarn prisma generate; yarn rw dev api"
Write-Host ""

# Start Angular Frontend
Write-Host "🌐 Starting Angular Frontend..." -ForegroundColor Cyan
Write-Host "   Opening new terminal for frontend..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\web'; yarn install; yarn start"
Write-Host ""

Write-Host "✅ All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Services:" -ForegroundColor Cyan
Write-Host "   - PostgreSQL:     http://localhost:5433" -ForegroundColor White
Write-Host "   - Extraction:    http://localhost:8080" -ForegroundColor White
Write-Host "   - GraphQL API:   http://localhost:8911/graphql" -ForegroundColor White
Write-Host "   - Frontend:      http://localhost:4200" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test the app:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:4200 in your browser" -ForegroundColor White
Write-Host "   2. Click 'Quick Add' (or press Cmd/Ctrl+K)" -ForegroundColor White
Write-Host "   3. Paste: 'Meeting tomorrow at 2pm in Conference Room A'" -ForegroundColor White
Write-Host "   4. Click 'Extract' and verify the event appears" -ForegroundColor White
Write-Host ""
Write-Host "📖 See TESTING_GUIDE.md for more test scenarios" -ForegroundColor Cyan


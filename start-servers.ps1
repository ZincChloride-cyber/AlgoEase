# PowerShell script to start both backend and frontend servers
# Run with: .\start-servers.ps1

Write-Host "=== Starting AlgoEase Servers ===" -ForegroundColor Green
Write-Host ""

# Check if backend directory exists
if (-Not (Test-Path "backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Check if frontend directory exists
if (-Not (Test-Path "frontend")) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Check if .env files exist
if (-Not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Warning: backend/.env file not found!" -ForegroundColor Yellow
    Write-Host "   Please create backend/.env with your Supabase credentials" -ForegroundColor Yellow
    Write-Host ""
}

if (-Not (Test-Path "frontend\.env")) {
    Write-Host "⚠️  Warning: frontend/.env file not found!" -ForegroundColor Yellow
    Write-Host "   Please create frontend/.env with your API URL" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Starting backend server..." -ForegroundColor Cyan
Write-Host "  Opening new terminal for backend..." -ForegroundColor White

# Start backend server in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '=== Backend Server ===' -ForegroundColor Green; Write-Host ''; npm run dev"

Write-Host "  Backend server starting in new window..." -ForegroundColor White
Write-Host "  Waiting 5 seconds for backend to start..." -ForegroundColor White
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Write-Host "  Opening new terminal for frontend..." -ForegroundColor White

# Start frontend server in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '=== Frontend Server ===' -ForegroundColor Green; Write-Host ''; npm start"

Write-Host "  Frontend server starting in new window..." -ForegroundColor White
Write-Host ""
Write-Host "✓ Servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait for both servers to start" -ForegroundColor White
Write-Host "2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "3. Connect your wallet" -ForegroundColor White
Write-Host "4. Create a bounty to test" -ForegroundColor White
Write-Host ""


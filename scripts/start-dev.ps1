# AlgoEase Development Startup Script for Windows PowerShell
Write-Host "🚀 Starting AlgoEase Development Environment..." -ForegroundColor Green

# Check if MongoDB is running
$mongodbRunning = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if (-not $mongodbRunning) {
    Write-Host "⚠️  MongoDB is not running. Please start MongoDB first:" -ForegroundColor Yellow
    Write-Host "   - Start MongoDB service or run 'mongod' in a separate terminal" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway (backend will fail without MongoDB)"
}

# Start backend
Write-Host "📦 Starting Backend Server..." -ForegroundColor Blue
Set-Location backend
npm install
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Blue
Set-Location ../frontend
npm install
Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ AlgoEase is starting up!" -ForegroundColor Green
Write-Host "   - Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - Health Check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Both servers are running in separate windows. Close them manually to stop." -ForegroundColor Yellow

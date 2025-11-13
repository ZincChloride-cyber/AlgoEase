# AlgoEase Backend Startup Script
Write-Host "🚀 Starting AlgoEase Backend..." -ForegroundColor Green
Write-Host ""

# Check if MongoDB is running
Write-Host "📦 Checking MongoDB..." -ForegroundColor Yellow
$mongoRunning = $false

# Check if MongoDB service exists and is running
try {
    $mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    if ($mongoService -and $mongoService.Status -eq 'Running') {
        Write-Host "✅ MongoDB service is running" -ForegroundColor Green
        $mongoRunning = $true
    } elseif ($mongoService) {
        Write-Host "⚠️  MongoDB service found but not running. Starting..." -ForegroundColor Yellow
        Start-Service MongoDB
        Start-Sleep -Seconds 2
        $mongoRunning = $true
    }
} catch {
    # Service doesn't exist
}

# Check if mongod process is running
if (-not $mongoRunning) {
    $mongoProcess = Get-Process -Name mongod -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Host "✅ MongoDB process is running" -ForegroundColor Green
        $mongoRunning = $true
    }
}

# Check if MongoDB is listening on port 27017
if (-not $mongoRunning) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($connection) {
            Write-Host "✅ MongoDB is listening on port 27017" -ForegroundColor Green
            $mongoRunning = $true
        }
    } catch {
        # Port not open
    }
}

if (-not $mongoRunning) {
    Write-Host "❌ MongoDB is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start MongoDB using one of these methods:" -ForegroundColor Yellow
    Write-Host "1. If MongoDB is installed as a service:" -ForegroundColor Cyan
    Write-Host "   Start-Service MongoDB" -ForegroundColor White
    Write-Host ""
    Write-Host "2. If MongoDB is installed but not as a service:" -ForegroundColor Cyan
    Write-Host "   Run mongod.exe from your MongoDB installation directory" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Use Docker (if installed):" -ForegroundColor Cyan
    Write-Host "   docker run -d -p 27017:27017 --name mongodb mongo:latest" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Use MongoDB Atlas (cloud - free):" -ForegroundColor Cyan
    Write-Host "   Sign up at https://www.mongodb.com/cloud/atlas/register" -ForegroundColor White
    Write-Host "   Then update backend/.env with your connection string" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to continue anyway (backend will fail without MongoDB)..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found at: $backendPath" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from env.example..." -ForegroundColor Yellow
    Copy-Item env.example .env
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the backend server
Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host "Backend will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev


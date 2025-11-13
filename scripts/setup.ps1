# AlgoEase Development Setup Script

# This script sets up the development environment for AlgoEase

Write-Host "🚀 Setting up AlgoEase development environment..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python 3 is required but not installed. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is required but not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version 2>&1
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is required but not installed. Please install npm" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Install Python dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
Set-Location contracts
pip install -r requirements.txt
Set-Location ..

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

# Install AlgoKit
Write-Host "🔧 Installing AlgoKit..." -ForegroundColor Yellow
pip install algokit

# Initialize AlgoKit
Write-Host "🔧 Initializing AlgoKit..." -ForegroundColor Yellow
algokit init

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "logs" -Force | Out-Null
New-Item -ItemType Directory -Path "data" -Force | Out-Null
New-Item -ItemType Directory -Path "temp" -Force | Out-Null

# Set up environment files
Write-Host "⚙️ Setting up environment files..." -ForegroundColor Yellow
if (!(Test-Path "backend/.env")) {
    Copy-Item "backend/env.example" "backend/.env"
    Write-Host "📝 Created backend/.env from template" -ForegroundColor Green
}

# Compile smart contracts
Write-Host "🔨 Compiling smart contracts..." -ForegroundColor Yellow
Set-Location projects/algoease-contracts
python algoease_contract.py
Set-Location ../..

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 AlgoEase is ready for development!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Start the frontend: cd projects/algoease-frontend && npm run dev" -ForegroundColor White
Write-Host "3. Deploy contracts: cd projects/algoease-contracts && algokit project deploy localnet" -ForegroundColor White
Write-Host "4. Run tests: cd projects/algoease-contracts && python test_contract.py" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Cyan

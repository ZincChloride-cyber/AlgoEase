# AlgoEase Contract Deployment Helper Script
# This script helps deploy the smart contract to TestNet

Write-Host "🚀 AlgoEase Contract Deployment Helper" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if mnemonic is set
if (-not $env:CREATOR_MNEMONIC) {
    Write-Host "⚠️  CREATOR_MNEMONIC environment variable is not set" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please set your mnemonic phrase:" -ForegroundColor White
    Write-Host '$env:CREATOR_MNEMONIC = "your 25 word mnemonic phrase here"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verify TEAL files exist
Write-Host "📋 Checking contract files..." -ForegroundColor Yellow
if (-not (Test-Path "projects/algoease-contracts/algoease_approval.teal")) {
    Write-Host "❌ Missing: projects/algoease-contracts/algoease_approval.teal" -ForegroundColor Red
    Write-Host "   Run: cd projects/algoease-contracts && python algoease_contract.py" -ForegroundColor Gray
    exit 1
}

if (-not (Test-Path "projects/algoease-contracts/algoease_clear.teal")) {
    Write-Host "❌ Missing: projects/algoease-contracts/algoease_clear.teal" -ForegroundColor Red
    Write-Host "   Run: cd projects/algoease-contracts && python algoease_contract.py" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Contract files found" -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan
Write-Host ""

# Run deployment
node scripts/deploy-contract.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check projects/algoease-frontend/.env.local for the new App ID" -ForegroundColor White
    Write-Host "2. Start the frontend: cd projects/algoease-frontend && npm start" -ForegroundColor White
    Write-Host "3. Test creating a bounty" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    Write-Host ""
    exit 1
}


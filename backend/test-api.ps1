# Quick API Test Script for AlgoEase Backend
# Make sure the server is running before executing this script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AlgoEase Backend API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test Health Endpoint
Write-Host "[1/2] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing
    Write-Host "✓ Health check passed (Status: $($health.StatusCode))" -ForegroundColor Green
    $healthJson = $health.Content | ConvertFrom-Json
    Write-Host "  Status: $($healthJson.status)" -ForegroundColor Gray
    Write-Host "  Service: $($healthJson.service)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "✗ Health check failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure the server is running on port 5000" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Test Bounties Endpoint
Write-Host "[2/2] Testing Bounties Endpoint..." -ForegroundColor Yellow
try {
    $bounties = Invoke-WebRequest -Uri http://localhost:5000/api/bounties -UseBasicParsing
    Write-Host "✓ Bounties endpoint working (Status: $($bounties.StatusCode))" -ForegroundColor Green
    $bountiesJson = $bounties.Content | ConvertFrom-Json
    Write-Host "  Total bounties: $($bountiesJson.pagination.total)" -ForegroundColor Gray
    Write-Host "  Bounties in response: $($bountiesJson.bounties.Count)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Response preview:" -ForegroundColor Gray
    $bounties.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
    Write-Host ""
} catch {
    Write-Host "✗ Bounties endpoint failed!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Check your Supabase connection in .env file" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All tests passed! ✓" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan


# PowerShell script to restart frontend with cache clearing
# Run with: .\restart-frontend.ps1

Write-Host "🔄 Restarting Frontend with Cache Clear..." -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
Set-Location frontend

# Clear node cache
Write-Host "🧹 Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Cache cleared!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No cache folder found (that's okay)" -ForegroundColor Gray
}

# Clear build folder if exists
if (Test-Path "build") {
    Write-Host "🧹 Clearing build folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
    Write-Host "✅ Build folder cleared!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting frontend server..." -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT: After server starts, clear your browser cache!" -ForegroundColor Yellow
Write-Host "   Press Ctrl+Shift+R or use incognito mode" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm start


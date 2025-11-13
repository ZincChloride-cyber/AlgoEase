# Start Server Script with Error Checking
Write-Host "Starting AlgoEase Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file from env.example and add your Supabase credentials." -ForegroundColor Yellow
    exit 1
}

# Check if SUPABASE_URL is set
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "SUPABASE_URL=https://") {
    Write-Host "⚠️  Warning: SUPABASE_URL might not be configured in .env" -ForegroundColor Yellow
    Write-Host "Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env file" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Starting server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
npm start


# Testing Supabase Integration

## Prerequisites
- Make sure your `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured
- Make sure the `bounties` table exists in Supabase

## Step 1: Start the Backend Server

```bash
npm start
```

**Expected Output:**
```
📦 Supabase Connected: https://your-project-id.supabase.co
🚀 AlgoEase Backend API running on port 5000
📊 Health check: http://localhost:5000/health
🌍 Environment: development
```

If you see connection errors, check your `.env` file.

## Step 2: Test Health Endpoint

Open a new terminal (keep the server running) and run:

### Windows PowerShell:
```powershell
curl http://localhost:5000/health
```

### Or use Invoke-WebRequest:
```powershell
Invoke-WebRequest -Uri http://localhost:5000/health | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "AlgoEase Backend API"
}
```

## Step 3: Test Bounties API

### Get All Bounties (should be empty initially)
```powershell
curl http://localhost:5000/api/bounties
```

### Or with Invoke-WebRequest:
```powershell
Invoke-WebRequest -Uri http://localhost:5000/api/bounties | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "bounties": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

## Step 4: Test Creating a Bounty (Optional)

**Note:** This requires authentication. If you have auth set up, use:

```powershell
$body = @{
    title = "Test Bounty"
    description = "This is a test bounty"
    amount = 10.5
    deadline = "2024-12-31T23:59:59Z"
    requirements = @("Requirement 1", "Requirement 2")
    tags = @("test", "algorand")
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/bounties -Method POST -Body $body -ContentType "application/json" -Headers @{"Authorization" = "Bearer YOUR_TOKEN"}
```

## Step 5: Verify in Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → **bounties**
3. You should see any bounties created through the API

## Quick Test Script

Save this as `test-api.ps1` in the backend folder:

```powershell
# Test Health Endpoint
Write-Host "Testing Health Endpoint..." -ForegroundColor Cyan
$health = Invoke-WebRequest -Uri http://localhost:5000/health
Write-Host "Status: $($health.StatusCode)" -ForegroundColor Green
Write-Host $health.Content
Write-Host ""

# Test Bounties Endpoint
Write-Host "Testing Bounties Endpoint..." -ForegroundColor Cyan
$bounties = Invoke-WebRequest -Uri http://localhost:5000/api/bounties
Write-Host "Status: $($bounties.StatusCode)" -ForegroundColor Green
Write-Host $bounties.Content
```

Run it with:
```powershell
.\test-api.ps1
```

## Troubleshooting

### Server won't start
- Check if port 5000 is already in use
- Verify `.env` file exists and has correct values
- Check for syntax errors in `.env` file

### Connection errors
- Verify `SUPABASE_URL` is correct (no trailing slash)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (full key, no spaces)
- Check Supabase project is active

### 404 errors
- Make sure server is running
- Check the URL is correct: `http://localhost:5000/api/bounties`

### Database errors
- Verify `bounties` table exists in Supabase
- Check RLS policies are set correctly
- Verify service role key has proper permissions


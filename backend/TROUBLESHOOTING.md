# Troubleshooting Server Connection Issues

## Issue: "Unable to connect to the remote server"

This means the server is not running on port 5000.

## Solution Steps

### Step 1: Start the Server

Open a terminal in the `backend` folder and run:

```powershell
npm start
```

**Expected output:**
```
📦 Supabase Connected: https://your-project-id.supabase.co
✓ Database connection test successful
🚀 AlgoEase Backend API running on port 5000
📊 Health check: http://localhost:5000/health
🌍 Environment: development
```

### Step 2: Keep the Server Running

**IMPORTANT:** Keep the terminal window open! The server must stay running.

- Don't close the terminal
- Don't press Ctrl+C (unless you want to stop the server)
- Open a NEW terminal window for running test commands

### Step 3: Test in a New Terminal

Open a **NEW** PowerShell window and run:

```powershell
cd "C:\Users\Aditya singh\AlgoEase\backend"
.\test-api.ps1
```

Or test manually:
```powershell
Invoke-WebRequest -Uri http://localhost:5000/health | Select-Object -ExpandProperty Content
```

## Common Issues

### Issue 1: Server Won't Start

**Error:** "Missing Supabase configuration"

**Solution:**
1. Check that `.env` file exists in the `backend` folder
2. Verify it contains:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-actual-key-here
   ```
3. Make sure there are no quotes around the values
4. Make sure there are no extra spaces

### Issue 2: Connection Error

**Error:** "Supabase connection error"

**Solution:**
1. Verify your `SUPABASE_URL` is correct (no trailing slash)
2. Verify your `SUPABASE_SERVICE_ROLE_KEY` is the full key
3. Check that the `bounties` table exists in Supabase Table Editor
4. Make sure your Supabase project is active (not paused)

### Issue 3: Port Already in Use

**Error:** "Port 5000 is already in use"

**Solution:**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F

# Or change the port in .env
PORT=5001
```

### Issue 4: Server Starts But Tests Fail

**Check:**
1. Is the server still running? (Check the terminal)
2. Are you testing in a different terminal window?
3. Try accessing http://localhost:5000/health in your browser

## Quick Diagnostic Commands

```powershell
# Check if server is running
netstat -ano | findstr :5000

# Check if .env exists
Test-Path .env

# Check environment variables (without showing values)
Get-Content .env | Select-String -Pattern "SUPABASE"

# Test connection
Invoke-WebRequest -Uri http://localhost:5000/health -UseBasicParsing
```

## Still Having Issues?

1. Check the server terminal for error messages
2. Verify Supabase credentials in Settings → API
3. Make sure the `bounties` table exists in Supabase
4. Try restarting the server


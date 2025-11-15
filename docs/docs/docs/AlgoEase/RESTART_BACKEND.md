# Restart Backend Server - Fix CORS Issue

## Problem
After creating a bounty, you're seeing: **"Failed to load bounties: Failed to fetch"**

This is a CORS (Cross-Origin Resource Sharing) issue. The backend server needs to be restarted with updated CORS configuration.

## Solution

### Step 1: Stop the Current Backend Server

1. Open a new terminal/PowerShell window
2. Find the process using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   ```
3. Stop the process (replace `PID` with the actual process ID):
   ```powershell
   taskkill /F /PID <PID>
   ```

   Or simply close the terminal window where the backend is running.

### Step 2: Restart the Backend Server

Navigate to the backend directory and start the server:

```powershell
cd backend
npm start
```

You should see:
- `✓ Database connection test successful`
- `📦 Supabase Connected (API URL: ...)`
- `🚀 AlgoEase Backend API running on port 5000`

### Step 3: Refresh Your Frontend

1. Go back to your browser where the frontend is running
2. Refresh the page (F5 or Ctrl+R)
3. The bounties should now load correctly

## What Was Fixed

✅ **CORS Configuration**: Updated to allow requests from frontend (localhost:3000, localhost:3001, etc.)  
✅ **Helmet Security**: Configured to not block CORS requests  
✅ **Better Error Handling**: Added more permissive CORS for development

## Verify It's Working

1. Check the browser console (F12) - you should see API requests succeeding
2. The bounties list should load without errors
3. Creating a new bounty should work without issues

## If Issues Persist

1. **Check browser console** (F12) for specific error messages
2. **Verify backend is running**: Visit http://localhost:5000/health in your browser
3. **Check API URL**: Make sure frontend is using `http://localhost:5000/api`
4. **Clear browser cache**: Try a hard refresh (Ctrl+Shift+R)


# ⚠️ CRITICAL: Restart Frontend Server

## The Problem
The home page is still showing the old contract ID (`749599170`) because the frontend server is serving the old JavaScript bundle. The code has been updated, but the server needs to be restarted to rebuild and serve the new code.

## Solution: Restart Frontend Server

### Step 1: Stop the Current Server
1. Go to the terminal where the frontend server is running
2. Press `Ctrl + C` to stop the server

### Step 2: Clear Browser Cache (Important!)
1. Open your browser
2. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
3. Select "Cached images and files"
4. Click "Clear data"
5. **OR** Do a hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Step 3: Restart the Server
```bash
cd frontend
npm start
```

### Step 4: Verify
1. Open the browser console (F12)
2. Look for these logs:
   ```
   [ContractUtils] Contract initialized: { appId: 749646001, ... }
   [Home] Contract info loaded: { appId: 749646001, ... }
   ```
3. Check the home page - it should now show:
   - **Contract App ID:** `749646001`
   - **Contract Address:** `L5GY7SCG...LQ7A4U`

## Alternative: Force Rebuild
If restarting doesn't work, try:
```bash
cd frontend
# Clear node_modules cache
rm -rf node_modules/.cache
# Or on Windows:
# rmdir /s /q node_modules\.cache

# Restart
npm start
```

## What Was Fixed
1. ✅ Code updated to detect and reject old contract IDs
2. ✅ Added explicit checks for old values (`749599170`, `749540140`)
3. ✅ Added checks for old addresses (`K2M726DQ`)
4. ✅ Forces correct values from environment or defaults
5. ✅ Added detailed logging for debugging

## Expected Result
After restarting, the home page should display:
- **Contract App ID:** `749646001` ✅
- **Contract Address:** `L5GY7SCG...LQ7A4U` ✅

If it still shows old values after restarting, check the browser console for error messages.


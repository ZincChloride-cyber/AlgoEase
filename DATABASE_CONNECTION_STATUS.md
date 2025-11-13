# Database Connection Status

## Connection Architecture

The database connection follows this flow:

```
Frontend (React) → Backend API (Express) → Supabase Database
```

**Important**: The frontend does NOT connect directly to the database. All database operations go through the backend API.

## Current Status: ❌ NOT CONNECTED

The database is **not currently connected** because:

1. **Missing Backend `.env` file**: The backend needs environment variables to connect to Supabase
2. **Missing Supabase credentials**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not configured

## How the Connection Works

### 1. Frontend → Backend API
- Frontend uses `apiService` from `frontend/src/utils/api.js`
- Makes HTTP requests to `http://localhost:5000/api`
- Example: `apiService.getBounties()` → `GET /api/bounties`

### 2. Backend API → Supabase Database
- Backend uses the `Bounty` model from `backend/models/Bounty.js`
- The model uses `getSupabase()` from `backend/config/database.js`
- Database operations are performed via Supabase client

### 3. Data Flow Example

**Fetching Bounties:**
```
User clicks "View Bounties" 
  → Frontend calls apiService.getBounties()
  → HTTP GET request to http://localhost:5000/api/bounties
  → Backend route handler (backend/routes/bounties.js)
  → Bounty.find() queries Supabase
  → Data returned to frontend
  → Displayed in UI
```

## How to Connect the Database

### Step 1: Create Backend `.env` File

```powershell
# Copy the example file
Copy-Item backend\env.example backend\.env
```

### Step 2: Configure Supabase Credentials

Edit `backend/.env` and add your Supabase credentials:

```env
# Database - Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Run Database Migrations

The database tables need to be created. Run the migration:

```powershell
# See backend/migrations/HOW_TO_RUN_IN_SUPABASE.md for instructions
```

Or use the SQL file:
```powershell
# Run the migration SQL in your Supabase SQL editor
# File: backend/migrations/00_create_database_fresh.sql
```

### Step 4: Start the Backend Server

```powershell
cd backend
npm run dev
```

You should see:
```
✓ Database connection test successful
📦 Supabase Connected (API URL: https://...)
🚀 AlgoEase Backend API running on port 5000
```

### Step 5: Verify Connection

1. **Backend Health Check:**
   ```powershell
   Invoke-WebRequest -Uri http://localhost:5000/health
   ```

2. **Test Database Connection:**
   ```powershell
   Invoke-WebRequest -Uri http://localhost:5000/api/bounties
   ```
   Should return: `{"bounties":[],"pagination":{...}}` (empty if no bounties)

3. **Frontend Test:**
   - Start frontend: `cd frontend && npm start`
   - Open browser console (F12)
   - Navigate to Bounty List page
   - Check console for API request logs

## Troubleshooting

### Error: "Missing Supabase configuration"
- **Solution**: Create `backend/.env` file with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Error: "relation 'bounties' does not exist"
- **Solution**: Run the database migration SQL in Supabase SQL editor

### Error: "Failed to fetch bounties" in frontend
- **Check**: Is backend server running? (`http://localhost:5000/health`)
- **Check**: Are CORS settings correct? (Should allow `http://localhost:3000`)
- **Check**: Browser console for specific error messages

### Error: "Supabase connection error"
- **Check**: Supabase URL is correct (should end with `.supabase.co`)
- **Check**: Service role key is correct (starts with `eyJ...`)
- **Check**: Supabase project is active (not paused)

## Connection Verification Checklist

- [ ] Backend `.env` file exists
- [ ] `SUPABASE_URL` is set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- [ ] Database migrations have been run
- [ ] Backend server starts without errors
- [ ] Backend health check works (`/health`)
- [ ] Backend API returns data (`/api/bounties`)
- [ ] Frontend can fetch data from backend
- [ ] Browser console shows successful API requests

## Files Involved in Database Connection

- **Backend Database Config**: `backend/config/database.js`
- **Bounty Model**: `backend/models/Bounty.js`
- **API Routes**: `backend/routes/bounties.js`
- **Frontend API Service**: `frontend/src/utils/api.js`
- **Frontend Components**: 
  - `frontend/src/pages/BountyList.js`
  - `frontend/src/pages/CreateBounty.js`
  - `frontend/src/pages/BountyDetail.js`
  - `frontend/src/pages/MyBounties.js`


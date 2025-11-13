# Setup Database Tables - Quick Guide

Your backend `.env` file has been created with your Supabase credentials! ✅

## Next Step: Create Database Tables

You need to create the database tables in Supabase. Here's how:

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project (qsdrxpunfhzrouxxeskl)
3. Click **SQL Editor** in the left sidebar
4. Click **"New query"** button

### Step 2: Run the Migration SQL

1. Open the file: `backend/migrations/00_create_database_fresh.sql`
2. Copy **ALL** the SQL code from that file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button (or press `Ctrl+Enter`)

You should see: ✅ **Success. No rows returned**

### Step 3: Verify Tables Were Created

1. In Supabase dashboard, click **Table Editor** in the left sidebar
2. You should see a table named **`bounties`**
3. Click on it to see the table structure

---

## Test the Connection

After creating the tables, test the connection:

### Start Backend Server

```powershell
cd backend
npm run dev
```

You should see:
```
✓ Database connection test successful
📦 Supabase Connected (API URL: https://qsdrxpunfhzrouxxeskl.supabase.co)
🚀 AlgoEase Backend API running on port 5000
```

### Test API Endpoint

Open a new PowerShell window:

```powershell
Invoke-WebRequest -Uri http://localhost:5000/health
Invoke-WebRequest -Uri http://localhost:5000/api/bounties
```

---

## Troubleshooting

### Error: "relation 'bounties' does not exist"
- **Solution**: Make sure you ran the migration SQL in Supabase SQL Editor

### Error: "Missing Supabase configuration"
- **Solution**: The `.env` file should be in `backend/.env` with your credentials

### Error: "Invalid API key"
- **Solution**: Double-check your `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`

---

## What's Next?

Once the tables are created and backend is running:

1. ✅ Backend is connected to Supabase
2. ✅ Frontend is already configured to connect to backend
3. ✅ Start frontend: `cd frontend && npm start`
4. ✅ Test creating a bounty through the frontend!


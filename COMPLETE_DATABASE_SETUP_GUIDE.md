# Complete Database Setup Guide

This guide will walk you through connecting Supabase database to your backend and frontend.

## Overview

**Connection Flow:**
```
Frontend (React) → Backend API (Express) → Supabase Database
```

The frontend connects to the backend API, and the backend connects to Supabase. You don't need to configure anything in the frontend - it's already set up!

---

## Step 1: Set Up Supabase Project

### 1.1 Create/Login to Supabase Account

1. Go to https://supabase.com
2. Sign up or log in to your account

### 1.2 Create a New Project

1. Click **"New Project"** button
2. Fill in:
   - **Name**: AlgoEase (or any name you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be created

---

## Step 2: Get Supabase Credentials

### 2.1 Navigate to API Settings

1. In your Supabase project dashboard, click **Settings** (⚙️ icon at bottom of left sidebar)
2. Click **API** in the settings menu

### 2.2 Copy Your Credentials

You'll need two values:

1. **Project URL** (under "Project URL" section)
   - Looks like: `https://xxxxxxxxxxxxx.supabase.co`
   - Copy this → This is your `SUPABASE_URL`

2. **Service Role Key** (under "Project API keys" section)
   - Find the `service_role` key (it's marked as `secret`)
   - Click the **eye icon** 👁️ to reveal it
   - Click the **copy icon** 📋 to copy it
   - Copy this → This is your `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Keep the service role key secret! Never share it or commit it to git.

---

## Step 3: Create Backend Environment File

### 3.1 Create `.env` File

Open PowerShell in your project root and run:

```powershell
Copy-Item backend\env.example backend\.env
```

### 3.2 Edit `.env` File

Open `backend/.env` in a text editor and update these values:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database - Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace:**
- `https://your-project-id.supabase.co` with your actual Project URL from Step 2.2
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your actual Service Role Key from Step 2.2

**Example:**
```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ1MTkyMDAwLCJleHAiOjE5NjA3NjgwMDB9.actual-signature-here
```

---

## Step 4: Create Database Tables

### 4.1 Open Supabase SQL Editor

1. In your Supabase project dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"** button

### 4.2 Run the Migration SQL

1. Open the file: `backend/migrations/00_create_database_fresh.sql`
2. Copy **ALL** the SQL code from that file
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button (or press `Ctrl+Enter`)

You should see: ✅ **Success. No rows returned**

### 4.3 Verify Tables Were Created

1. In Supabase dashboard, click **Table Editor** in the left sidebar
2. You should see a table named **`bounties`**
3. Click on it to see the table structure

---

## Step 5: Test Backend Connection

### 5.1 Install Backend Dependencies (if not done)

```powershell
cd backend
npm install
```

### 5.2 Start the Backend Server

```powershell
npm run dev
```

### 5.3 Check for Success Messages

You should see:
```
✓ Database connection test successful
📦 Supabase Connected (API URL: https://...)
🚀 AlgoEase Backend API running on port 5000
📊 Health check: http://localhost:5000/health
```

If you see errors, check the troubleshooting section below.

### 5.4 Test the API

Open a new PowerShell window and run:

```powershell
# Test health endpoint
Invoke-WebRequest -Uri http://localhost:5000/health

# Test bounties endpoint (should return empty array if no bounties)
Invoke-WebRequest -Uri http://localhost:5000/api/bounties
```

You should get JSON responses. If you get errors, check the troubleshooting section.

---

## Step 6: Test Frontend Connection

### 6.1 Start the Frontend

Open a new PowerShell window:

```powershell
cd frontend
npm start
```

The frontend will open at `http://localhost:3000`

### 6.2 Verify Connection

1. Open your browser to `http://localhost:3000`
2. Open **Developer Tools** (Press `F12`)
3. Go to the **Console** tab
4. Navigate to the "Bounties" page in your app
5. You should see logs like:
   ```
   🔍 Fetching all bounties with filter: all
   🌐 Making API request to: http://localhost:5000/api/bounties
   📡 Response status: 200 OK
   ✅ API response received: {bounties: Array(0), pagination: {...}}
   ```

If you see these logs, the connection is working! 🎉

---

## Quick Start Script

You can also use the provided script to start both servers:

```powershell
.\start-servers.ps1
```

This will:
1. Start the backend server in a new window
2. Wait 5 seconds
3. Start the frontend server in another new window

---

## Troubleshooting

### ❌ Error: "Missing Supabase configuration"

**Problem**: Backend can't find Supabase credentials

**Solution**:
1. Make sure `backend/.env` file exists
2. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
3. Make sure there are no extra spaces or quotes around the values
4. Restart the backend server

### ❌ Error: "relation 'bounties' does not exist"

**Problem**: Database tables haven't been created

**Solution**:
1. Go to Supabase SQL Editor
2. Run the migration SQL from `backend/migrations/00_create_database_fresh.sql`
3. Verify the `bounties` table exists in Table Editor
4. Restart the backend server

### ❌ Error: "Failed to fetch" in frontend

**Problem**: Frontend can't reach the backend

**Solution**:
1. Make sure backend is running (`http://localhost:5000/health`)
2. Check browser console for CORS errors
3. Verify `FRONTEND_URL=http://localhost:3000` in `backend/.env`
4. Try restarting both servers

### ❌ Error: "Invalid API key" or "Unauthorized"

**Problem**: Wrong Supabase credentials

**Solution**:
1. Double-check you copied the **service_role** key (not the anon key)
2. Make sure you copied the entire key (they're very long)
3. Check for any extra spaces or line breaks
4. Verify the Project URL is correct

### ❌ Backend won't start

**Problem**: Port 5000 might be in use

**Solution**:
1. Check if another process is using port 5000
2. Change `PORT=5001` in `backend/.env`
3. Update `REACT_APP_API_URL=http://localhost:5001/api` in frontend (if you created `.env`)

---

## Verification Checklist

Use this checklist to verify everything is connected:

- [ ] Supabase project created
- [ ] `backend/.env` file created with correct credentials
- [ ] Database tables created (migration SQL run)
- [ ] Backend server starts without errors
- [ ] Backend shows "✓ Database connection test successful"
- [ ] Health check works: `http://localhost:5000/health`
- [ ] API endpoint works: `http://localhost:5000/api/bounties`
- [ ] Frontend starts without errors
- [ ] Frontend can fetch data from backend (check browser console)
- [ ] No CORS errors in browser console

---

## Next Steps

Once everything is connected:

1. **Create a test bounty** through the frontend
2. **Check Supabase Table Editor** to see the data
3. **View bounties** in the frontend to verify they load from database

---

## Need Help?

- Check `backend/FINDING_SUPABASE_KEYS.md` for detailed key-finding instructions
- Check `backend/migrations/HOW_TO_RUN_IN_SUPABASE.md` for migration details
- Check `DATABASE_CONNECTION_STATUS.md` for connection architecture details

---

## Summary

**What you did:**
1. ✅ Created Supabase project
2. ✅ Got Supabase credentials
3. ✅ Created `backend/.env` file
4. ✅ Ran database migrations
5. ✅ Started backend server
6. ✅ Started frontend server
7. ✅ Verified connection

**Result:**
- Frontend → Backend → Database connection is complete! 🎉


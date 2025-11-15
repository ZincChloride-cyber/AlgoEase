# AlgoEase Quick Start Guide

## 🚀 Make Everything Work - Step by Step

### 1. Database Setup (CRITICAL - Do This First!)

**Run this SQL in Supabase SQL Editor:**
```sql
-- Add transaction_id columns
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS accept_transaction_id VARCHAR(64) NULL;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS approve_transaction_id VARCHAR(64) NULL;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS reject_transaction_id VARCHAR(64) NULL;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS claim_transaction_id VARCHAR(64) NULL;
ALTER TABLE bounties ADD COLUMN IF NOT EXISTS refund_transaction_id VARCHAR(64) NULL;
```

Or run the complete migration file: `backend/migrations/add_transaction_ids.sql`

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with:
# PORT=5000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:3000
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-key-here

# Start backend
npm start
```

Backend should start on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with:
# REACT_APP_API_URL=http://localhost:5000/api
# REACT_APP_CONTRACT_APP_ID=749653911
# REACT_APP_CONTRACT_ADDRESS=YGKN4WYULCTVLA6JHY6XEVKV2LQF4A5DOCEJWGUNGMUHIZQANLO4JGFFEQ

# Start frontend
npm start
```

Frontend should start on: `http://localhost:3000`

### 4. Test the Connection

1. **Backend Health Check:**
   - Open: http://localhost:5000/health
   - Should see: `{"status":"OK",...}`

2. **Frontend to Backend:**
   - Open browser console (F12)
   - Navigate to http://localhost:3000
   - Check for API calls in Network tab
   - No CORS errors = ✅ Connected!

### 5. Test Complete Flow

1. **Create a Bounty:**
   - Go to "Create Bounty"
   - Fill in details
   - Click "Deploy Bounty"
   - ✅ Transaction ID should be stored

2. **Accept a Bounty:**
   - Go to "Browse Bounties"
   - Click on a bounty
   - Click "Accept Bounty"
   - ✅ Transaction ID should be stored in `accept_transaction_id`

3. **Approve a Bounty:**
   - Go to "My Bounties" or bounty detail
   - Click "Approve Work"
   - ✅ Funds transfer from escrow to freelancer wallet
   - ✅ Transaction ID stored in `approve_transaction_id`

## ✅ What's Fixed

1. ✅ Transaction IDs are now stored in database
2. ✅ CORS allows PATCH method
3. ✅ Backend validates and stores transaction IDs
4. ✅ Frontend automatically stores transaction IDs after on-chain transactions
5. ✅ Approve bounty transfers funds from escrow to freelancer wallet
6. ✅ Complete error handling and logging

## 🔍 Verify It's Working

**Check Database:**
```sql
SELECT id, contract_id, accept_transaction_id, approve_transaction_id, status
FROM bounties
ORDER BY created_at DESC
LIMIT 5;
```

**Check Backend Logs:**
- Look for "💾 Updating transaction ID" messages
- Look for "✅ Transaction ID saved" messages

**Check Frontend Console:**
- Look for "💾 Storing transaction ID" messages
- Look for "✅ Transaction ID stored successfully" messages

## 🎯 Complete Transaction Flow

### Accept Bounty:
1. Frontend → Backend API (update database)
2. Frontend → Smart Contract (on-chain transaction)
3. Frontend → Backend API (store transaction ID)
4. ✅ Complete!

### Approve Bounty (Funds Transfer):
1. Frontend → Backend API (update database)
2. Frontend → Smart Contract (on-chain transaction with freelancer address)
3. Smart Contract → Inner Transaction (escrow → freelancer wallet)
4. Frontend → Backend API (store transaction ID)
5. ✅ Funds are now in freelancer's wallet!

## 🐛 Still Having Issues?

1. **Check database columns exist:**
   - Run the SQL migration
   - Verify with: `SELECT column_name FROM information_schema.columns WHERE table_name = 'bounties' AND column_name LIKE '%transaction_id%';`

2. **Check environment variables:**
   - Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - Frontend: `REACT_APP_API_URL`

3. **Check CORS:**
   - Backend logs should show incoming requests
   - Browser console should not show CORS errors

4. **Check backend logs:**
   - Look for database errors
   - Look for transaction ID update logs

Everything is now connected and ready to work! 🎉


# Backend-Frontend Connection Checklist

## ✅ Completed Fixes

### 1. Database Schema
- ✅ Added transaction_id columns to Bounty model
- ✅ Created SQL migration: `backend/migrations/add_transaction_ids.sql`
- ✅ Created complete table migration: `backend/migrations/complete_bounties_table.sql`

### 2. Backend API
- ✅ Added `PATCH /api/bounties/:id/transaction` endpoint
- ✅ Fixed CORS to allow PATCH method
- ✅ Added comprehensive logging for debugging
- ✅ Validates transaction IDs before saving
- ✅ Handles both database ID and contract ID lookups

### 3. Frontend Integration
- ✅ Added `updateBountyTransaction()` method to API service
- ✅ Frontend stores transaction ID after accept bounty
- ✅ Frontend stores transaction ID after approve bounty
- ✅ Error handling for transaction ID storage failures

### 4. Transaction Flow
- ✅ Accept bounty: Updates database → Calls contract → Stores transaction ID
- ✅ Approve bounty: Updates database → Calls contract → Stores transaction ID → Funds transfer to freelancer

## 🔧 Setup Steps

### Step 1: Run Database Migration
1. Open Supabase SQL Editor: https://app.supabase.com/project/_/sql
2. Run: `backend/migrations/add_transaction_ids.sql`
3. Verify columns were added:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'bounties' 
   AND column_name LIKE '%transaction_id%';
   ```

### Step 2: Configure Environment Variables

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CONTRACT_APP_ID=749653911
REACT_APP_CONTRACT_ADDRESS=YGKN4WYULCTVLA6JHY6XEVKV2LQF4A5DOCEJWGUNGMUHIZQANLO4JGFFEQ
```

### Step 3: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

### Step 4: Verify Connection

1. **Test Backend:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Test API:**
   ```bash
   curl http://localhost:5000/api/bounties
   ```

3. **Check Browser Console:**
   - Open http://localhost:3000
   - Open DevTools (F12)
   - Check Network tab for API calls
   - Check Console for any errors

## 🔍 Troubleshooting

### Transaction IDs Not Saving?

1. **Check if columns exist:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'bounties' 
   AND column_name LIKE '%transaction_id%';
   ```

2. **Check backend logs:**
   - Look for "💾 Updating transaction ID" messages
   - Check for database errors

3. **Check frontend console:**
   - Look for "💾 Storing transaction ID" messages
   - Check for API errors

### CORS Errors?

1. Verify `FRONTEND_URL` in backend `.env`
2. Check `allowedOrigins` in `backend/server.js`
3. Ensure frontend URL matches exactly (including port)

### Database Connection Errors?

1. Verify Supabase credentials in backend `.env`
2. Test connection: `node backend/test-connection.js`
3. Check Supabase dashboard for connection status

## 📊 API Endpoints Reference

### Bounties
- `GET /api/bounties` - List all bounties
- `GET /api/bounties/:id` - Get single bounty
- `POST /api/bounties` - Create bounty
- `PUT /api/bounties/:id` - Update bounty
- `PATCH /api/bounties/:id/transaction` - Update transaction ID ⭐ NEW
- `POST /api/bounties/:id/accept` - Accept bounty
- `POST /api/bounties/:id/approve` - Approve bounty
- `POST /api/bounties/:id/reject` - Reject bounty
- `POST /api/bounties/:id/claim` - Claim bounty
- `POST /api/bounties/:id/refund` - Refund bounty

## 🎯 Complete Transaction Flow

### Accept Bounty Flow:
1. User clicks "Accept Bounty"
2. Frontend calls `POST /api/bounties/:id/accept` → Updates database (sets freelancer, status='accepted')
3. Frontend calls `acceptBounty(contractId)` → Creates and signs transaction
4. Transaction submitted to blockchain → Returns transaction ID
5. Frontend calls `PATCH /api/bounties/:id/transaction` → Stores transaction ID in database
6. ✅ Complete!

### Approve Bounty Flow:
1. User clicks "Approve Work"
2. Frontend verifies bounty exists on blockchain
3. Frontend calls `POST /api/bounties/:id/approve` → Updates database (status='approved')
4. Frontend calls `approveBounty(contractId)` → Creates transaction with freelancer address
5. Transaction submitted → Funds transfer from escrow to freelancer wallet
6. Frontend calls `PATCH /api/bounties/:id/transaction` → Stores transaction ID
7. ✅ Complete! Funds are now in freelancer's wallet

## 🚀 Next Steps

1. Run the database migration
2. Set up environment variables
3. Start both servers
4. Test the complete flow
5. Check transaction IDs are being stored


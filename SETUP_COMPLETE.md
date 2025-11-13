# Setup Complete: Frontend Connected to Smart Contract

## Summary

The frontend has been successfully connected to the deployed smart contract, and the SQL migration scripts have been created for the Supabase database.

## Contract Connection

### Contract Details
- **Contract App ID**: `749570296`
- **Contract Address**: `LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U`
- **Network**: Algorand TestNet
- **Deployment Transaction**: `BN25OXQUI3LWM6VVL47QII4CLGJQQTZAAOG5OBW62XYZ6P3FXEAA`

### Frontend Updates
1. **`frontend/src/pages/Home.js`**
   - Updated default contract ID from `749335380` to `749570296`
   - Displays correct contract ID on homepage

2. **`frontend/src/config/contract.js`**
   - Updated default contract ID from `0` to `749570296`
   - Includes all status constants (OPEN, ACCEPTED, APPROVED, CLAIMED, REFUNDED, REJECTED)
   - Includes all method names (CREATE_BOUNTY, ACCEPT_BOUNTY, APPROVE_BOUNTY, REJECT_BOUNTY, etc.)

3. **`frontend/src/utils/contractUtils.js`**
   - Already configured with correct contract ID (`749570296`)
   - Contract address is calculated from app ID: `algosdk.getApplicationAddress(appId)`
   - Box storage integration is working correctly

## SQL Migration Scripts

### 1. Complete Migration Script (`backend/migrations/supabase_bounties_table.sql`)
**Use this script in Supabase SQL Editor** - It handles both new table creation and updates to existing tables.

**Features**:
- Creates bounties table if it doesn't exist
- Makes `contract_id` nullable (can be set after on-chain creation)
- Includes `'rejected'` status in the status check constraint
- Creates all necessary indexes for performance
- Creates automatic `updated_at` timestamp trigger
- Sets up Row Level Security (RLS) policies

### 2. New Table Creation (`backend/migrations/create_bounties_table_complete.sql`)
**Use this if**: You're creating the table for the first time.

### 3. Update Existing Table (`backend/migrations/update_bounties_table.sql`)
**Use this if**: You already have a bounties table and need to update it.

## Database Schema

### Table: `bounties`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
| `contract_id` | BIGINT | **Yes** | On-chain contract ID (nullable) |
| `client_address` | VARCHAR(58) | No | Client's Algorand address |
| `freelancer_address` | VARCHAR(58) | Yes | Freelancer's Algorand address |
| `verifier_address` | VARCHAR(58) | Yes | Verifier's Algorand address |
| `amount` | DECIMAL(18, 6) | No | Bounty amount in ALGO |
| `deadline` | TIMESTAMP WITH TIME ZONE | No | Bounty deadline |
| `status` | VARCHAR(20) | No | Bounty status (open, accepted, approved, claimed, refunded, rejected) |
| `title` | VARCHAR(200) | No | Bounty title |
| `description` | TEXT | No | Bounty description |
| `requirements` | JSONB | Yes | Bounty requirements (array) |
| `tags` | JSONB | Yes | Bounty tags (array) |
| `submissions` | JSONB | Yes | Bounty submissions (array) |
| `created_at` | TIMESTAMP WITH TIME ZONE | No | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No | Last update timestamp |

### Status Values
- `'open'` - Bounty is open for acceptance
- `'accepted'` - Bounty has been accepted by a freelancer
- `'approved'` - Bounty work has been approved by verifier
- `'claimed'` - Bounty payment has been claimed by freelancer
- `'refunded'` - Bounty has been refunded to client
- `'rejected'` - Bounty work has been rejected by verifier

## Next Steps

### 1. Run SQL Migration in Supabase
1. Open Supabase SQL Editor
2. Copy the contents of `backend/migrations/supabase_bounties_table.sql`
3. Paste into SQL Editor
4. Click "Run" to execute
5. Verify the migration using the verification queries in the script

### 2. Verify Environment Variables
Ensure the following environment variables are set:

#### Frontend (`frontend/.env`)
```env
REACT_APP_CONTRACT_APP_ID=749570296
REACT_APP_CONTRACT_ADDRESS=LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
```

#### Backend (`backend/.env`)
```env
CONTRACT_APP_ID=749570296
CONTRACT_ADDRESS=LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U
ALGOD_URL=https://testnet-api.algonode.cloud
INDEXER_URL=https://testnet-idx.algonode.cloud
```

### 3. Test Contract Connection
1. Start the frontend server: `cd frontend && npm start`
2. Connect your Pera Wallet
3. Check the homepage - it should display contract ID `749570296`
4. Try creating a test bounty to verify the connection

### 4. Test Database Connection
1. Start the backend server: `cd backend && npm start`
2. Verify the backend can connect to Supabase
3. Test creating a bounty through the API
4. Verify the bounty is stored in the database

## Verification Queries

Run these queries in Supabase SQL Editor to verify the migration:

### 1. Verify Table Structure
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;
```

### 2. Verify Status Constraint
```sql
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'bounties_status_check';
```

### 3. Verify contract_id is Nullable
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bounties' AND column_name = 'contract_id';
```

### 4. Verify Indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bounties';
```

### 5. Verify Trigger
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'bounties';
```

## Files Created/Updated

### Frontend Files
- ✅ `frontend/src/pages/Home.js` - Updated contract ID
- ✅ `frontend/src/config/contract.js` - Updated contract ID
- ✅ `frontend/src/utils/contractUtils.js` - Already configured correctly

### Backend Files
- ✅ `backend/migrations/supabase_bounties_table.sql` - Complete migration script
- ✅ `backend/migrations/create_bounties_table_complete.sql` - New table creation
- ✅ `backend/migrations/update_bounties_table.sql` - Update existing table

### Documentation
- ✅ `CONTRACT_CONNECTION_GUIDE.md` - Contract connection guide
- ✅ `SQL_MIGRATION_GUIDE.md` - SQL migration guide
- ✅ `SETUP_COMPLETE.md` - This file

## Troubleshooting

### Issue: Contract not found
**Solution**: Verify `REACT_APP_CONTRACT_APP_ID` is set correctly in `frontend/.env`

### Issue: contract_id is NOT NULL
**Solution**: Run the SQL migration script to make it nullable

### Issue: 'rejected' status not allowed
**Solution**: Run the SQL migration script to add 'rejected' to the status constraint

### Issue: Box reference error
**Solution**: 
1. Verify app account has sufficient ALGO for box storage
2. Run `node scripts/fund_app_account.js` to fund app account
3. Verify box references are included in transactions

## Resources

- **Contract Info**: `contract-info.json`
- **Contract Deployment**: `scripts/deploy_contract.py`
- **Contract Explorer**: https://testnet.algoexplorer.io/application/749570296
- **TestNet Faucet**: https://bank.testnet.algorand.network/
- **Supabase Dashboard**: Your Supabase project dashboard

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend logs for errors
3. Check the Supabase logs for database errors
4. Verify all environment variables are set correctly
5. Verify the SQL migration was run successfully



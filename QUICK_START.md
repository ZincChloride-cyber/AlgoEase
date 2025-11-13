# AlgoEase Quick Start Guide

## ✅ Migration Verified

The database migration has been successfully verified and all tests passed!

## Quick Start

### Option 1: Use the Start Script (Recommended)

1. Run the start script:
   ```powershell
   .\start-servers.ps1
   ```
   This will start both backend and frontend servers in separate terminals.

### Option 2: Manual Start

#### Start Backend Server

1. Open a terminal/command prompt
2. Navigate to backend directory:
   ```bash
   cd backend
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
4. Verify it's running:
   - Check for: `🚀 AlgoEase Backend API running on port 5000`
   - Check for: `✓ Database connection test successful`
   - Test: http://localhost:5000/health

#### Start Frontend Server

1. Open a **new** terminal/command prompt
2. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Browser should open automatically to http://localhost:3000

## Testing Checklist

### ✅ Database Migration
- [x] contract_id is nullable
- [x] rejected status is allowed
- [x] Migration verified successfully

### ⏳ Backend Server
- [ ] Backend server starts without errors
- [ ] Database connection successful
- [ ] Health endpoint responds (http://localhost:5000/health)

### ⏳ Frontend Server
- [ ] Frontend server starts without errors
- [ ] UI loads correctly
- [ ] Wallet can connect

### ⏳ Bounty Creation
- [ ] Can create a bounty in the UI
- [ ] Bounty is saved to database
- [ ] Bounty appears in the bounty list
- [ ] Bounty details are displayed correctly

### ⏳ Bounty Actions
- [ ] Can accept a bounty
- [ ] Can approve a bounty
- [ ] Can reject a bounty
- [ ] Can claim a bounty
- [ ] Database updates correctly
- [ ] UI updates correctly

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CONTRACT_APP_ID=749570296
REACT_APP_CONTRACT_ADDRESS=LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U
```

## Troubleshooting

### Backend Issues
- **Database connection error**: Check Supabase credentials in `.env`
- **Port already in use**: Change PORT in `.env` to a different port
- **Migration not applied**: Run migration in Supabase SQL Editor

### Frontend Issues
- **API connection error**: Check REACT_APP_API_URL in `.env`
- **Wallet connection issues**: Install Pera Wallet extension
- **Contract not found**: Verify REACT_APP_CONTRACT_APP_ID in `.env`

## Verification Script

Run the verification script to test the database:
```bash
node backend/scripts/verify-migration-simple.js
```

Expected output:
```
✓ All tests passed!
  ✓ contract_id is nullable
  ✓ "rejected" status is allowed
```

## Next Steps

1. Start both servers
2. Open http://localhost:3000
3. Connect your wallet
4. Create a test bounty
5. Verify it appears in the database
6. Test all bounty actions

## Support

For detailed testing instructions, see `TESTING_GUIDE.md`

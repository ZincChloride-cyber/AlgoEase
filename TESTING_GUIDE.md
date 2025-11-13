# AlgoEase Testing Guide

## ✅ Migration Verification Complete

The database migration has been successfully verified:
- ✓ `contract_id` is nullable (bounties can be created without a contract ID)
- ✓ `rejected` status is allowed in the status constraint

## Step-by-Step Testing Guide

### Step 1: Verify Database Migration (Already Done ✅)

The migration has been verified. All tests passed:
- ✓ Can create bounties with NULL contract_id
- ✓ Can update contract_id after creation
- ✓ Can set status to 'rejected'

### Step 2: Start Backend Server

1. Open a terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Make sure you have a `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
5. Verify the server is running:
   - You should see: `🚀 AlgoEase Backend API running on port 5000`
   - You should see: `✓ Database connection test successful`
   - Test the health endpoint: http://localhost:5000/health

### Step 3: Start Frontend Server

1. Open a **new** terminal/command prompt (keep backend running)
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Make sure you have a `.env` file with your API URL:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_CONTRACT_APP_ID=749570296
   REACT_APP_CONTRACT_ADDRESS=LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U
   ```
4. Start the frontend server:
   ```bash
   npm start
   ```
5. The browser should open automatically to http://localhost:3000

### Step 4: Test Bounty Creation in UI

1. **Connect Your Wallet**
   - Click "Connect Wallet" in the top right
   - Connect with Pera Wallet (mobile or browser extension)
   - Verify your wallet address is displayed

2. **Create a Bounty**
   - Click "Launch bounty" or navigate to `/create`
   - Fill in the bounty details:
     - Title: "Test Bounty - Database Integration"
     - Description: "This is a test bounty to verify database integration"
     - Amount: 1 ALGO (or any amount you want to test with)
     - Deadline: Select a date in the future
     - Verifier: Leave empty to use your address as verifier
   - Click "Deploy bounty"
   - Sign the transaction in Pera Wallet
   - Wait for transaction confirmation

3. **Verify Bounty in Database**
   - After creating the bounty, check the backend console
   - You should see: `✅ Bounty saved successfully with ID: <id>`
   - The bounty should be saved to Supabase with:
     - `contract_id`: The bounty ID from the smart contract (or NULL if not available yet)
     - `status`: 'open'
     - All other fields populated correctly

4. **Verify Bounty in UI**
   - Navigate to `/bounties` or the home page
   - You should see your newly created bounty in the list
   - Click on it to view details
   - Verify all information is displayed correctly

### Step 5: Test Bounty Actions

1. **Accept a Bounty**
   - As a different user (or different wallet), view an open bounty
   - Click "Accept bounty"
   - Sign the transaction
   - Verify:
     - Status changes to "accepted" in the database
     - Freelancer address is set in the database
     - Status updates in the UI

2. **Approve a Bounty**
   - As the verifier, view an accepted bounty
   - Click "Approve work"
   - Sign the transaction
   - Verify:
     - Status changes to "approved" in the database
     - Status updates in the UI

3. **Reject a Bounty**
   - As the verifier, view an accepted bounty
   - Click "Reject work"
   - Sign the transaction
   - Verify:
     - Status changes to "rejected" in the database
     - Funds are refunded to the client
     - Status updates in the UI

4. **Claim a Bounty**
   - As the freelancer, view an approved bounty
   - Click "Claim bounty"
   - Sign the transaction
   - Verify:
     - Status changes to "claimed" in the database
     - Funds are transferred to the freelancer
     - Status updates in the UI

### Step 6: Test Database Queries

1. **Check Bounties in Supabase**
   - Go to Supabase Dashboard
   - Navigate to Table Editor > bounties
   - Verify all bounties are stored correctly
   - Check that `contract_id` can be NULL
   - Check that `status` can be 'rejected'

2. **Test API Endpoints**
   - GET `/api/bounties` - Should return all bounties
   - GET `/api/bounties/:id` - Should return a specific bounty
   - POST `/api/bounties` - Should create a new bounty
   - POST `/api/bounties/:id/accept` - Should accept a bounty
   - POST `/api/bounties/:id/approve` - Should approve a bounty
   - POST `/api/bounties/:id/reject` - Should reject a bounty
   - POST `/api/bounties/:id/claim` - Should claim a bounty

## Troubleshooting

### Backend Server Issues

1. **Database Connection Error**
   - Check your `.env` file has correct Supabase credentials
   - Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
   - Check that the bounties table exists in Supabase

2. **Port Already in Use**
   - Change PORT in `.env` to a different port (e.g., 5001)
   - Update FRONTEND_URL in backend `.env` if needed
   - Update REACT_APP_API_URL in frontend `.env` if needed

3. **Migration Not Applied**
   - Run the migration in Supabase SQL Editor
   - Verify `contract_id` is nullable
   - Verify `rejected` status is in the constraint

### Frontend Server Issues

1. **API Connection Error**
   - Check REACT_APP_API_URL in frontend `.env`
   - Verify backend server is running
   - Check CORS settings in backend

2. **Wallet Connection Issues**
   - Install Pera Wallet browser extension
   - Or use Pera Wallet mobile app
   - Check that wallet is connected to Algorand TestNet

3. **Contract Not Found**
   - Verify REACT_APP_CONTRACT_APP_ID in frontend `.env`
   - Check that the contract is deployed on TestNet
   - Verify contract address is correct

### Database Issues

1. **Bounty Not Saved**
   - Check backend console for errors
   - Verify Supabase connection is working
   - Check that all required fields are provided
   - Verify address format is correct (58 characters, base32)

2. **Status Update Fails**
   - Check that the status constraint includes the new status
   - Verify the user has permission to update the bounty
   - Check backend logs for specific error messages

## Success Criteria

✅ **Migration Verified**
- contract_id is nullable
- rejected status is allowed

✅ **Backend Running**
- Server starts without errors
- Database connection successful
- Health endpoint responds

✅ **Frontend Running**
- Server starts without errors
- UI loads correctly
- Wallet can connect

✅ **Bounty Creation Works**
- Bounty is created on smart contract
- Bounty is saved to database
- Bounty appears in UI

✅ **Bounty Actions Work**
- Accept, approve, reject, claim all work
- Database updates correctly
- UI updates correctly

## Next Steps

After successful testing:
1. Deploy to production
2. Set up monitoring
3. Configure production Supabase instance
4. Set up CI/CD pipeline
5. Add automated tests

## Support

If you encounter any issues:
1. Check the backend console for errors
2. Check the browser console for errors
3. Check Supabase logs
4. Verify all environment variables are set correctly
5. Run the verification script: `node backend/scripts/verify-migration-simple.js`


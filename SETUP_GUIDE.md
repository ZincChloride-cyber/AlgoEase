# AlgoEase Setup Guide

## Quick Start - Connect Backend to Frontend

### 1. Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` (if it exists) or create a `.env` file
   - Add your Supabase credentials:
     ```
     PORT=5000
     NODE_ENV=development
     FRONTEND_URL=http://localhost:3000
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```

4. **Run database migration:**
   - Open Supabase SQL Editor: https://app.supabase.com/project/_/sql
   - Run the migration file: `backend/migrations/complete_bounties_table.sql`
   - Or run just the transaction IDs migration: `backend/migrations/add_transaction_ids.sql`

5. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```
   
   The backend should start on `http://localhost:5000`

### 2. Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Create a `.env` file in the frontend directory
   - Add:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     REACT_APP_CONTRACT_APP_ID=749653911
     REACT_APP_CONTRACT_ADDRESS=YGKN4WYULCTVLA6JHY6XEVKV2LQF4A5DOCEJWGUNGMUHIZQANLO4JGFFEQ
     ```

4. **Start the frontend:**
   ```bash
   npm start
   ```
   
   The frontend should start on `http://localhost:3000`

### 3. Verify Connection

1. **Check backend health:**
   - Open: http://localhost:5000/health
   - Should return: `{"status":"OK",...}`

2. **Check frontend can reach backend:**
   - Open browser console (F12)
   - Look for API requests in the Network tab
   - Check for any CORS errors

3. **Test API connection:**
   - In browser console, run:
     ```javascript
     fetch('http://localhost:5000/api/bounties')
       .then(r => r.json())
       .then(console.log)
     ```

## Troubleshooting

### Backend not starting?
- Check if port 5000 is already in use
- Verify Supabase credentials in `.env`
- Check database connection logs

### Frontend can't connect to backend?
- Verify `REACT_APP_API_URL` in frontend `.env`
- Check CORS settings in `backend/server.js`
- Ensure backend is running on the correct port
- Check browser console for CORS errors

### Database errors?
- Run the SQL migrations in Supabase
- Verify Supabase credentials
- Check table structure matches the model

### Transaction IDs not saving?
- Ensure you ran the `add_transaction_ids.sql` migration
- Check backend logs for database errors
- Verify the columns exist in Supabase

## API Endpoints

### Bounties
- `GET /api/bounties` - List all bounties
- `GET /api/bounties/:id` - Get single bounty
- `POST /api/bounties` - Create bounty
- `PUT /api/bounties/:id` - Update bounty
- `PATCH /api/bounties/:id/transaction` - Update transaction ID
- `POST /api/bounties/:id/accept` - Accept bounty
- `POST /api/bounties/:id/approve` - Approve bounty
- `POST /api/bounties/:id/reject` - Reject bounty
- `POST /api/bounties/:id/claim` - Claim bounty
- `POST /api/bounties/:id/refund` - Refund bounty

### Contracts
- `GET /api/contracts/:contractId` - Get contract info
- `GET /api/contracts/:contractId/state` - Get contract state
- `GET /api/contracts/params` - Get transaction params

## Environment Variables Reference

### Backend (.env)
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CONTRACT_APP_ID=749653911
REACT_APP_CONTRACT_ADDRESS=YGKN4WYULCTVLA6JHY6XEVKV2LQF4A5DOCEJWGUNGMUHIZQANLO4JGFFEQ
```


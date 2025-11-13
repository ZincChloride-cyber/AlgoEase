# Frontend-Backend Connection Guide

This guide explains how the frontend and backend are connected in AlgoEase.

## Connection Overview

- **Frontend**: React app running on `http://localhost:3000`
- **Backend**: Express API server running on `http://localhost:5000`
- **API Base URL**: `http://localhost:5000/api`

## Configuration Files

### Frontend Configuration

The frontend uses environment variables to configure the API connection. Create a `.env` file in the `frontend/` directory:

```env
# Frontend Environment Variables
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FRONTEND_URL=http://localhost:3000
```

**Note**: If you don't create a `.env` file, the frontend will use the default value `http://localhost:5000/api` from `frontend/src/utils/api.js`.

### Backend Configuration

The backend needs a `.env` file in the `backend/` directory. Copy from `backend/env.example`:

```powershell
Copy-Item backend\env.example backend\.env
```

Then edit `backend/.env` and configure:
- `PORT=5000` (must match the frontend API URL port)
- `FRONTEND_URL=http://localhost:3000` (for CORS)
- Supabase credentials
- Other required environment variables

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (default React dev server)
- `http://localhost:3001` (alternative port)
- `http://127.0.0.1:3000` and `http://127.0.0.1:3001`
- Any origin in development mode (`NODE_ENV=development`)

## API Service

The frontend uses a centralized API service located at `frontend/src/utils/api.js`. This service:

- Handles all HTTP requests to the backend
- Automatically adds authentication tokens from localStorage
- Provides methods for all API endpoints:
  - Bounties: `getBounties()`, `createBounty()`, `updateBounty()`, etc.
  - Contracts: `getContractInfo()`, `getContractState()`, etc.
  - Health check: `healthCheck()`

## Usage in Components

Components import and use the API service like this:

```javascript
import apiService from '../utils/api';

// Example: Fetch bounties
const bounties = await apiService.getBounties({ status: 'open' });

// Example: Create a bounty
const newBounty = await apiService.createBounty(bountyData);
```

## Starting Both Servers

### Option 1: Use the Startup Script (Recommended)

```powershell
.\start-servers.ps1
```

This script will:
1. Start the backend server in a new terminal window
2. Wait 5 seconds for the backend to initialize
3. Start the frontend server in another new terminal window

### Option 2: Start Manually

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```

## Testing the Connection

1. **Backend Health Check:**
   Open `http://localhost:5000/health` in your browser. You should see:
   ```json
   {
     "status": "OK",
     "timestamp": "...",
     "service": "AlgoEase Backend API"
   }
   ```

2. **Frontend API Test:**
   - Open the browser console (F12)
   - Navigate to the Bounty List page
   - Check the console for API request logs
   - You should see: `🌐 Making API request to: http://localhost:5000/api/bounties`

3. **Common Issues:**
   - **CORS Error**: Make sure the backend is running and `FRONTEND_URL` is set correctly
   - **Connection Refused**: Verify the backend is running on port 5000
   - **404 Errors**: Check that API routes are prefixed with `/api` (e.g., `/api/bounties`)

## API Endpoints

### Bounties
- `GET /api/bounties` - List all bounties
- `GET /api/bounties/:id` - Get a specific bounty
- `POST /api/bounties` - Create a new bounty
- `PUT /api/bounties/:id` - Update a bounty
- `POST /api/bounties/:id/accept` - Accept a bounty
- `POST /api/bounties/:id/approve` - Approve a bounty
- `POST /api/bounties/:id/reject` - Reject a bounty
- `POST /api/bounties/:id/claim` - Claim a bounty
- `POST /api/bounties/:id/refund` - Refund a bounty

### Contracts
- `GET /api/contracts/:id` - Get contract information
- `GET /api/contracts/:id/state` - Get contract state
- `GET /api/contracts/params` - Get transaction parameters

### Health
- `GET /health` - Health check endpoint

## Troubleshooting

### Backend not starting
- Check if port 5000 is already in use
- Verify `.env` file exists in `backend/` directory
- Check Supabase credentials are correct

### Frontend can't connect to backend
- Verify backend is running: `http://localhost:5000/health`
- Check browser console for CORS errors
- Ensure `REACT_APP_API_URL` matches backend port
- Try restarting both servers

### API requests failing
- Check network tab in browser DevTools
- Verify the request URL is correct
- Check backend logs for errors
- Ensure database connection is working


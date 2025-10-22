# AlgoEase Frontend-Backend Connection Guide

This guide explains how to connect and run the AlgoEase frontend and backend together.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (running locally or accessible)
3. **Git** (for cloning the repository)

## Quick Start

### Option 1: Using the Development Scripts

#### For Windows (PowerShell):
```powershell
.\scripts\start-dev.ps1
```

#### For Linux/macOS (Bash):
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### Option 2: Manual Setup

#### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The backend will start on `http://localhost:5000`

#### 2. Start the Frontend (in a new terminal)

```bash
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`

## Configuration

### Backend Configuration

The backend uses environment variables. Create a `.env` file in the `backend` directory:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/algoease
ALGOD_SERVER=https://testnet-api.algonode.cloud
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Frontend Configuration

The frontend automatically connects to the backend API. The API URL is configured in `frontend/src/utils/api.js`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## API Endpoints

The backend provides the following API endpoints:

### Bounties
- `GET /api/bounties` - Get all bounties with filtering
- `GET /api/bounties/:id` - Get specific bounty
- `POST /api/bounties` - Create new bounty
- `PUT /api/bounties/:id` - Update bounty
- `POST /api/bounties/:id/submit` - Submit work for bounty
- `GET /api/bounties/user/:address` - Get user's bounties

### Contracts
- `GET /api/contracts/:contractId` - Get contract information
- `GET /api/contracts/:contractId/state` - Get contract state
- `GET /api/contracts/params` - Get transaction parameters
- `POST /api/contracts/simulate` - Simulate transaction

### Health Check
- `GET /health` - Backend health status

## Frontend Components Updated

The following frontend components have been updated to use the backend API:

1. **BountyList** (`frontend/src/pages/BountyList.js`)
   - Fetches bounties from `/api/bounties`
   - Supports filtering by status
   - Handles loading and error states

2. **CreateBounty** (`frontend/src/pages/CreateBounty.js`)
   - Submits new bounties to `/api/bounties`
   - Validates form data
   - Shows loading and error states

3. **MyBounties** (`frontend/src/pages/MyBounties.js`)
   - Fetches user-specific bounties from `/api/bounties/user/:address`
   - Separates created vs accepted bounties
   - Handles authentication requirements

## API Service

A centralized API service (`frontend/src/utils/api.js`) handles all backend communication:

- Automatic error handling
- Request/response formatting
- Authentication token management
- Consistent error messages

## Testing the Connection

1. **Backend Health Check**: Visit `http://localhost:5000/health`
2. **Frontend**: Visit `http://localhost:3000`
3. **API Test**: Use browser dev tools to check network requests

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly in backend `.env`
2. **MongoDB Connection**: Make sure MongoDB is running
3. **Port Conflicts**: Check if ports 3000 and 5000 are available
4. **API Errors**: Check browser console and backend logs

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

### Backend Logs
```bash
cd backend
npm run dev
```

### Frontend Logs
Check browser developer console for API errors.

## Development Workflow

1. Start MongoDB
2. Start backend (`npm run dev` in backend directory)
3. Start frontend (`npm start` in frontend directory)
4. Make changes to either frontend or backend
5. Hot reload will automatically update the respective service

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper CORS origins
4. Set secure JWT secrets
5. Use environment-specific API URLs

## Next Steps

- Implement smart contract integration
- Add authentication middleware
- Set up database models
- Add real-time updates
- Implement file upload functionality

# Starting the AlgoEase Backend Server

## Prerequisites

1. **MongoDB must be running** - The backend requires MongoDB to store bounty data.

## Steps to Start Backend

### 1. Start MongoDB

**Option A: If MongoDB is installed as a Windows Service:**
```powershell
Start-Service MongoDB
```

**Option B: If MongoDB is installed but not as a service:**
```powershell
# Navigate to MongoDB bin directory (adjust path as needed)
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongod.exe
```

**Option C: If using MongoDB via Docker:**
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Verify MongoDB is Running

```powershell
# Check if MongoDB is listening on port 27017
Test-NetConnection -ComputerName localhost -Port 27017
```

### 3. Start the Backend Server

```powershell
cd "C:\Users\Aditya singh\AlgoEase\backend"
npm run dev
```

The server should start on `http://localhost:5000`

### 4. Verify Backend is Running

Open your browser and go to: `http://localhost:5000/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "...",
  "service": "AlgoEase Backend API"
}
```

## Troubleshooting

- **"MongoDB connection error"**: Make sure MongoDB is running (see step 1)
- **"Port 5000 already in use"**: Another process is using port 5000. Stop it or change PORT in `.env`
- **"Cannot find module"**: Run `npm install` in the backend directory

## Quick Start Script

You can also use the provided PowerShell script:
```powershell
.\scripts\start-dev.ps1
```

This will start both MongoDB (if needed) and the backend server.


# AlgoEase

**Decentralized Escrow Platform for Freelance Payments on Algorand**

## 📄 Overview

AlgoEase is a trustless escrow platform that enables secure payments between clients and freelancers using Algorand smart contracts. The platform solves the trust problem in freelance work by locking funds in a smart contract escrow until work is completed and approved. The contract automatically releases payments or refunds based on predefined conditions, eliminating the need for middlemen while ensuring fast transactions (~4.5 second finality) and low fees (~0.001 ALGO per transaction).

### Key Features

- **Trustless Escrow**: Funds locked in smart contracts, not controlled by anyone
- **Fast Transactions**: ~4.5 second finality on Algorand
- **Low Fees**: ~0.001 ALGO per transaction
- **Secure**: Code-enforced rules, no human interference
- **User-Friendly**: Web interface with wallet integration

### How It Works

1. **Create Bounty**: Client posts a task and deposits payment to escrow
2. **Accept Task**: Freelancer accepts and commits to complete the work
3. **Approve Work**: Client/verifier approves the completed work
4. **Claim Payment**: Funds automatically release to the freelancer

If work isn't approved, the client can request a refund that returns funds from escrow.

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 20+ and npm 9+
- Python 3.12+ and pip
- AlgoKit CLI 2.0.0+ ([Install](https://github.com/algorandfoundation/algokit-cli))
- Docker (for running Algorand LocalNet)
- Supabase account (for backend database)
- Algorand wallet (Pera Wallet recommended) and TestNet ALGO for contract actions

### Getting Started

#### 1. Clone the Repository

```bash
git clone https://github.com/ZincChloride-cyber/AlgoEase.git
cd AlgoEase
```

#### 2. Install Dependencies

```bash
# Install all dependencies (root, frontend, backend, contracts)
npm run install:all
```

#### 3. Configure Environment Variables

**Backend Configuration**

Copy `backend/env.example` to `backend/.env` and configure:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Algorand Configuration
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_TOKEN=

# Contract Configuration
CONTRACT_APP_ID=749707697
CONTRACT_CREATOR_ADDRESS=your_creator_address
```

**Frontend Configuration**

Create `frontend/.env`:

For TestNet:
```env
REACT_APP_CONTRACT_APP_ID=749707697
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet
```

**Important**: Never commit `.env` files or share your mnemonic phrase or private keys.

#### 4. Set Up Database

The backend uses Supabase for data persistence:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations located in `backend/migrations/`
3. Set up Row Level Security (RLS) policies as needed

## 🚀 Running the Application

### Running the Frontend

The frontend is a React application that provides the user interface for interacting with the AlgoEase platform.

**Option 1: Using npm script (from root directory)**
```bash
npm run dev:frontend
```

**Option 2: Directly from frontend directory**
```bash
cd frontend
npm install
npm start
# or
npm run dev
```

The frontend will start on **http://localhost:3000**

**Requirements:**
- Ensure `frontend/.env` is configured with the correct contract App ID and network settings
- Make sure the backend is running (for API calls)
- Have Pera Wallet installed in your browser for wallet connection

### Running the Backend

The backend is an Express.js API server that handles metadata storage and provides REST endpoints.

**Option 1: Using npm script (from root directory)**
```bash
npm run dev:backend
```

**Option 2: Directly from backend directory**
```bash
cd backend
npm install
npm run dev
# or for production
npm start
```

The backend will start on **http://localhost:5000**

**Requirements:**
- Ensure `backend/.env` is configured with Supabase credentials
- Database migrations should be run in Supabase
- Make sure Supabase project is active and accessible

**Backend API Endpoints:**
- `GET /api/bounties` - List all bounties
- `POST /api/bounties` - Create new bounty (metadata)
- `GET /api/bounties/:id` - Get bounty details
- `GET /api/contracts/info` - Get contract information
- `GET /health` - Health check

### Running Both Together

To run both frontend and backend concurrently:

```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📦 Deploying AlgoEase Bounty Escrow V2 Contract

The AlgoEase Bounty Escrow V2 contract is a PyTeal smart contract that manages escrow functionality using box storage for multiple concurrent bounties.

### Prerequisites for Deployment

- Python 3.12+ installed
- Algorand TestNet account with sufficient ALGO (at least 0.5 ALGO for deployment)
- Creator mnemonic phrase (keep this secure!)

### Deployment Steps

#### 1. Prepare Contract Files

The contract consists of:
- `contracts/algoease_bounty_escrow_v2.py` - PyTeal source code
- `contracts/algoease_bounty_escrow_v2_approval.teal` - Compiled approval program
- `contracts/algoease_bounty_escrow_v2_clear.teal` - Compiled clear program

#### 2. Configure Deployment Script

Edit `deploy_bounty_escrow_v2.py` and update the following:

```python
# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"  # TestNet endpoint
ALGOD_TOKEN = ""  # Empty for public endpoints

# Your creator mnemonic (NEVER commit this!)
CREATOR_MNEMONIC = "your mnemonic phrase here"
```

**⚠️ Security Warning:** Never commit your mnemonic phrase to version control. Consider using environment variables instead.

#### 3. Deploy to TestNet

Run the deployment script:

```bash
python deploy_bounty_escrow_v2.py
```

The script will:
1. ✅ Check creator account balance
2. ✅ Compile TEAL programs
3. ✅ Create the application transaction
4. ✅ Sign and submit to TestNet
5. ✅ Wait for confirmation
6. ✅ Display App ID and Contract Address
7. ✅ Update `contract.env`, `frontend/.env`, and `backend/.env` files

#### 4. Verify Deployment

After deployment, you'll receive:
- **App ID**: The application ID (e.g., `749707697`)
- **Contract Address**: The escrow address (e.g., `ZS2EW3YGUDATK5OH4S7QUPMIJ4T6ROU6OFJEAGKFD2RSEHPSOCJ3BZBFLU`)

Verify on Lora Explorer:
```
https://lora.algokit.io/testnet/application/{APP_ID}
```

#### 5. Update Configuration Files

The deployment script automatically updates:
- `contract.env` - Contract configuration
- `frontend/.env` - Frontend environment variables
- `backend/.env` - Backend environment variables

**Manual Update (if needed):**

Update `frontend/.env`:
```env
REACT_APP_CONTRACT_APP_ID={APP_ID}
REACT_APP_CONTRACT_ADDRESS={CONTRACT_ADDRESS}
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet
```

Update `backend/.env`:
```env
CONTRACT_APP_ID={APP_ID}
CONTRACT_ADDRESS={CONTRACT_ADDRESS}
```

#### 6. Restart Services

After deployment, restart your frontend and backend:

```bash
# Stop existing processes (Ctrl+C)
# Then restart
npm run dev
```

### Contract Features

The Bounty Escrow V2 contract supports:

- **Multiple Concurrent Bounties**: Uses box storage to support unlimited bounties
- **Status Management**: Tracks bounty status (OPEN, ACCEPTED, SUBMITTED, APPROVED, REJECTED)
- **Automatic Fund Transfer**: Funds automatically transfer on approve/reject
- **Box Storage**: Each bounty stored in a separate box for scalability

### Contract Methods

- `create_bounty(amount, task_desc)` - Create a new bounty and lock funds
- `accept_bounty(bounty_id)` - Freelancer accepts a bounty
- `submit_bounty(bounty_id)` - Freelancer submits completed work
- `approve_bounty(bounty_id)` - Creator approves work, funds transfer to freelancer
- `reject_bounty(bounty_id)` - Creator rejects work, funds refund to creator

### Troubleshooting Deployment

**Insufficient Balance:**
- Get TestNet ALGO from [Algorand Dispenser](https://bank.testnet.algorand.network/)
- Need at least 0.5 ALGO for deployment

**Compilation Errors:**
- Ensure TEAL files are present in `contracts/` directory
- Check Python and algosdk versions

**Transaction Failed:**
- Verify network connectivity
- Check account balance
- Ensure mnemonic is correct

## 🔗 Deployed Smart Contracts (TestNet)

The AlgoEase smart contract is deployed on Algorand TestNet:

- **Contract Application**: [View on Lora Explorer](https://lora.algokit.io/testnet/application/749707697)
- **App ID**: `749707697`
- **Contract Address**: `ZS2EW3YGUDATK5OH4S7QUPMIJ4T6ROU6OFJEAGKFD2RSEHPSOCJ3BZBFLU`

## 🧠 Architecture & Components

AlgoEase consists of four main components working together to provide a secure, decentralized escrow platform:

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  Frontend   │────────▶│   Backend   │────────▶│   Supabase   │
│   (React)   │  HTTP   │  (Express)  │         │  (Metadata)  │
└──────┬──────┘         └─────────────┘         └──────────────┘
       │
       │ Blockchain Calls
       │
       ▼
┌──────────────────────────────────────┐
│    Algorand Smart Contract           │
│    (Handles Escrow & Payments)       │
└──────────────────────────────────────┘
```

### Component Breakdown

- **Frontend (React)**: User interface built with React, providing wallet connection via Pera Wallet, bounty browsing, creation, and management. Handles all user interactions and displays real-time bounty status.

- **Backend (Express.js)**: Node.js API server that stores bounty metadata (descriptions, images, additional details) in Supabase. Provides REST API endpoints for bounty management while keeping financial transactions on-chain.

- **Smart Contract (PyTeal)**: Algorand Application Smart Contract written in PyTeal that manages escrow functionality. Stores bounty state using box storage to support multiple concurrent bounties. Handles payment escrow, approval workflow, and automated fund distribution.

- **Supabase (PostgreSQL)**: Relational database for storing off-chain metadata. Used because storing large amounts of data on-chain is expensive. Implements Row Level Security (RLS) for data protection.

### Data Flow

1. **Bounty Creation**: Client creates bounty via frontend → Frontend calls smart contract to lock funds → Backend stores metadata in Supabase
2. **Bounty Acceptance**: Freelancer accepts via frontend → Frontend calls smart contract to update state
3. **Work Submission**: Freelancer submits work → Backend stores submission details in Supabase
4. **Approval & Payment**: Client approves → Frontend calls smart contract → Smart contract releases funds to freelancer
5. **Refund Flow**: Client requests refund → Frontend calls smart contract → Smart contract returns funds to client

## 🌐 Deployed Frontend

The frontend is configured for deployment on Vercel. Once deployed, the live application URL will be available here.

## License

This project is licensed under the MIT License.

## Useful Links

- [Algorand Developer Docs](https://developer.algorand.org/)
- [Pera Wallet](https://perawallet.app/)
- [AlgoExplorer TestNet](https://testnet.algoexplorer.io/)
- [PyTeal Documentation](https://pyteal.readthedocs.io/)
- [AlgoKit Documentation](https://github.com/algorandfoundation/algokit-cli)
- [Supabase Documentation](https://supabase.com/docs)

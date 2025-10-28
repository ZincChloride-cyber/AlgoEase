# AlgoEase

**Decentralized Escrow Platform for Freelance Payments on Algorand**

AlgoEase is a trustless escrow platform that enables secure payments between clients and freelancers using Algorand smart contracts. No middlemen, low fees (~0.001 ALGO), and instant settlement.

## Overview

AlgoEase solves the trust problem in freelance work by locking funds in a smart contract escrow until work is completed and approved. The contract automatically releases payments or refunds based on predefined conditions.

### Key Features

- 🔒 **Trustless Escrow**: Funds locked in smart contracts, not controlled by anyone
- ⚡ **Fast Transactions**: ~4.5 second finality on Algorand
- 💰 **Low Fees**: ~0.001 ALGO per transaction
- 🔐 **Secure**: Code-enforced rules, no human interference
- 📱 **User-Friendly**: Web interface with wallet integration

## How It Works

1. **Create Bounty**: Client posts a task and deposits payment to escrow
2. **Accept Task**: Freelancer accepts and commits to complete the work
3. **Approve Work**: Client/verifier approves the completed work
4. **Claim Payment**: Funds automatically release to freelancer from escrow

If work isn't approved, the client can request a refund.

## Project Structure

```
AlgoEase/
├── frontend/          # React web application
│   └── src/
│       ├── pages/     # Main pages (Home, CreateBounty, BountyList, etc.)
│       ├── components/# Reusable UI components
│       ├── contexts/  # React context (Wallet)
│       └── utils/     # Helper functions (contract, API, wallet)
│
├── backend/           # Node.js/Express API server
│   ├── routes/        # API endpoints
│   ├── models/        # MongoDB models
│   └── middleware/    # Auth and validation
│
├── contracts/         # Algorand smart contracts
│   ├── algoease_contract.py  # Main PyTeal contract
│   └── *.teal         # Compiled TEAL bytecode
│
└── scripts/           # Deployment and testing scripts
```

## Prerequisites

- Node.js v16+
- Python v3.8+
- MongoDB (local or Atlas)
- Algorand wallet (Pera Wallet recommended)
- TestNet ALGO ([Get free ALGO here](https://bank.testnet.algorand.network/))

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AlgoEase
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**

   **Backend** - Copy `backend/env.example` to `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/algoease
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   ```

   **Frontend** - Copy `frontend/.env.example` to `frontend/.env`:
   ```env
   REACT_APP_CREATOR_MNEMONIC="your 12 or 25 word mnemonic phrase"
   REACT_APP_CONTRACT_APP_ID=748437079
   REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
   ```

   ⚠️ **Never commit `.env` files or share your mnemonic phrase!**

## Running the Application

**Start both frontend and backend:**
```bash
npm run dev
```

This runs:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

**Or run separately:**
```bash
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

## Testing

**Test complete bounty lifecycle:**
```bash
python complete-lifecycle-test.py
```

This script will:
- Create a new bounty (locks 3 ALGO in escrow)
- Accept the bounty
- Approve the work
- Claim payment from escrow

**Other test scripts:**
- `check-bounty-state.py` - Check current bounty status
- `simple-bounty-test.py` - Basic functionality test
- `bounty-wizard.py` - Interactive CLI tool

## Smart Contract

The smart contract manages the escrow and enforces payment rules. It stores:

- **Status**: Current state (OPEN, ACCEPTED, APPROVED, CLAIMED, REFUNDED)
- **Client Address**: Who created the bounty
- **Freelancer Address**: Who accepted it
- **Amount**: ALGO locked in escrow
- **Deadline**: When bounty expires
- **Task Description**: Work requirements
- **Verifier Address**: Who can approve work

### Status Codes

- `0` - **OPEN**: Bounty available, waiting for freelancer
- `1` - **ACCEPTED**: Freelancer committed, work in progress
- `2` - **APPROVED**: Work verified, ready to claim
- `3` - **CLAIMED**: Payment released to freelancer
- `4` - **REFUNDED**: Funds returned to client

## API Endpoints

**Backend API:**

- `GET /api/bounties` - List all bounties
- `POST /api/bounties` - Create new bounty (metadata)
- `GET /api/bounties/:id` - Get bounty details
- `GET /api/contracts/info` - Get contract information
- `GET /health` - Health check

**Note**: Money transactions happen on-chain via smart contract, not through the API.

## Available Scripts

- `npm run dev` - Start frontend and backend concurrently
- `npm run install:all` - Install all dependencies (root, frontend, backend)
- `npm run build` - Build frontend for production

## Deployment

**python working-bounty-tool.py:**
```bash
python deploy-to-testnet.py
```

This will compile the PyTeal contract and deploy it to Algorand TestNet. Save the returned App ID in your `frontend/.env` file.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  Frontend   │────────▶│   Backend   │────────▶│     MongoDB  │
│   (React)   │  HTTP   │  (Express)  │         │   (Metadata) │
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

- **Frontend**: User interface, wallet connection, displays bounties
- **Backend**: Stores bounty metadata (descriptions, images), provides API
- **Smart Contract**: Holds escrowed funds, enforces payment rules
- **MongoDB**: Stores off-chain metadata (too expensive for blockchain)

## Security Notes

- ⚠️ Never commit `.env` files containing mnemonics or private keys
- 🧪 Always test on TestNet before MainNet
- 🔐 Keep your mnemonic phrase secure - if exposed, consider funds compromised
- ✅ Smart contracts are immutable once deployed - test thoroughly

## Troubleshooting

**Wallet connection issues:**
- Install Pera Wallet browser extension
- Refresh the page after installing

**Insufficient balance:**
- Get TestNet ALGO from [Algorand Dispenser](https://bank.testnet.algorand.network/)
- Need ~5-10 ALGO for testing

**MongoDB connection failed:**
- Ensure MongoDB is running locally, or use MongoDB Atlas (cloud)
- Check connection string in `backend/.env`

**Contract not found:**
- Verify `REACT_APP_CONTRACT_APP_ID` matches deployed contract
- Check contract on [AlgoExplorer](https://testnet.algoexplorer.io/)

## Useful Links

- [Algorand Developer Docs](https://developer.algorand.org/)
- [Pera Wallet](https://perawallet.app/)
- [AlgoExplorer TestNet](https://testnet.algoexplorer.io/)
- [PyTeal Documentation](https://pyteal.readthedocs.io/)





---


# AlgoEase

**Decentralized Escrow Platform for Freelance Payments on Algorand**

AlgoEase is a trustless escrow platform that enables secure payments between clients and freelancers using Algorand smart contracts. No middlemen, low fees (~0.001 ALGO), and instant settlement.

## Overview

AlgoEase solves the trust problem in freelance work by locking funds in a smart contract escrow until work is completed and approved. The contract automatically releases payments or refunds based on predefined conditions.

### Key Features

- **Trustless Escrow**: Funds locked in smart contracts, not controlled by anyone
- **Fast Transactions**: ~4.5 second finality on Algorand
- **Low Fees**: ~0.001 ALGO per transaction
- **Secure**: Code-enforced rules, no human interference
- **User-Friendly**: Web interface with wallet integration

## How It Works

1. **Create Bounty**: Client posts a task and deposits payment to escrow
2. **Accept Task**: Freelancer accepts and commits to complete the work
3. **Approve Work**: Client/verifier approves the completed work
4. **Claim Payment**: Funds automatically release to the freelancer

If work isn't approved, the client can request a refund that returns funds from escrow.

## Prerequisites

- Node.js 20+ and npm 9+
- Python 3.12+ and pip
- AlgoKit CLI 2.0.0+ ([Install](https://github.com/algorandfoundation/algokit-cli))
- Docker (for running Algorand LocalNet)
- Supabase account (for backend database)
- Algorand wallet (Pera Wallet recommended) and TestNet ALGO for contract actions

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AlgoEase
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, frontend, backend, contracts)
npm run install:all

# Or use AlgoKit to bootstrap
algokit project bootstrap all
```

### 3. Configure Environment Variables

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
CONTRACT_APP_ID=your_contract_app_id
CONTRACT_CREATOR_ADDRESS=your_creator_address
```

**Frontend Configuration**

Copy `.env.example` to `frontend/.env` (if it exists) or create one in `projects/algoease-frontend/.env`:

For LocalNet:
```env
REACT_APP_CONTRACT_APP_ID=<your_deployed_app_id>
REACT_APP_CONTRACT_ADDRESS=<your_contract_address>
REACT_APP_ALGOD_URL=http://localhost:4001
REACT_APP_INDEXER_URL=http://localhost:8980
REACT_APP_NETWORK=localnet
```

For TestNet:
```env
REACT_APP_CONTRACT_APP_ID=<your_deployed_app_id>
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet
```

**Important**: Never commit `.env` files or share your mnemonic phrase or private keys.

### 4. Set Up Database

The backend uses Supabase for data persistence. You need to:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations located in `backend/migrations/`
3. Set up Row Level Security (RLS) policies as needed

See `backend/migrations/README.md` for detailed migration instructions.

### 5. Start LocalNet (Optional for Local Development)

```bash
# Start Algorand LocalNet
npm run localnet:start
# or
algokit localnet start

# Verify LocalNet is running
npm run localnet:status
# or
algokit localnet status

# Open Lora Explorer
npm run localnet:explorer
# or
algokit localnet explorer
```

### 6. Deploy Smart Contracts

**For LocalNet:**
```bash
cd projects/algoease-contracts
algokit project deploy localnet

# Or from root
npm run deploy:localnet
```

**For TestNet:**
```bash
cd projects/algoease-contracts
algokit project deploy testnet

# Or from root
npm run deploy:testnet
```

Save the returned App ID in your frontend `.env` file.

### 7. Start the Application

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

## Project Structure

```
AlgoEase/
├── projects/                    # Main projects directory
│   ├── algoease-contracts/      # PyTeal smart contracts
│   │   ├── algoease_contract.py
│   │   ├── algoease_v2_contract.py
│   │   ├── algoease_approval.teal
│   │   ├── algoease_clear.teal
│   │   ├── test_contract.py
│   │   ├── requirements.txt
│   │   ├── package.json
│   │   └── .algokit.toml
│   │
│   └── algoease-frontend/       # React frontend application
│       ├── src/
│       │   ├── components/
│       │   ├── contexts/
│       │   ├── pages/
│       │   ├── utils/
│       │   └── config/
│       ├── public/
│       ├── tailwind.config.js
│       ├── package.json
│       └── .env.example
│
├── backend/                     # Node.js API server
│   ├── routes/                  # API route handlers
│   ├── models/                  # Data models
│   ├── middleware/              # Express middleware
│   ├── config/                  # Configuration files
│   ├── migrations/              # Database migrations
│   ├── scripts/                 # Utility scripts
│   └── server.js                # Main server file
│
├── contracts/                   # Legacy contract sources
├── scripts/                     # Deployment and testing scripts
├── .algokit.toml                # Root AlgoKit configuration
├── algokit.toml                 # Legacy Algokit config
├── package.json                 # Root package.json with scripts
└── README.md                    # This file
```

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

**Note**: Money transactions happen on-chain via smart contract, not through the API. The API only handles metadata storage.

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

## Available Scripts

- `npm run dev` - Start frontend and backend concurrently
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run install:all` - Install all dependencies (root, frontend, backend, contracts)
- `npm run build` - Build frontend for production
- `npm run localnet:start` - Start Algorand LocalNet
- `npm run localnet:stop` - Stop Algorand LocalNet
- `npm run localnet:status` - Check LocalNet status
- `npm run localnet:explorer` - Open Lora Explorer
- `npm run deploy:localnet` - Deploy contracts to LocalNet
- `npm run deploy:testnet` - Deploy contracts to TestNet

## Deployment

**Deploy to TestNet:**
```bash
cd projects/algoease-contracts
algokit project deploy testnet
```

This will compile the PyTeal contract and deploy it to Algorand TestNet. Save the returned App ID in your frontend `.env` file.

**Deploy to MainNet:**
```bash
cd projects/algoease-contracts
algokit project deploy mainnet
```

**Warning**: Always test thoroughly on TestNet before deploying to MainNet. Smart contracts are immutable once deployed.

## Architecture

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

- **Frontend**: User interface, wallet connection, displays bounties
- **Backend**: Stores bounty metadata (descriptions, images), provides API
- **Smart Contract**: Holds escrowed funds, enforces payment rules
- **Supabase**: Stores off-chain metadata (too expensive for blockchain)

## Security Notes

- Never commit `.env` files containing mnemonics or private keys
- Always test on TestNet before MainNet
- Keep your mnemonic phrase secure - if exposed, consider funds compromised
- Smart contracts are immutable once deployed - test thoroughly
- Use Supabase Row Level Security (RLS) policies to protect data
- Regularly update dependencies to patch security vulnerabilities

## Troubleshooting

**Wallet connection issues:**
- Install Pera Wallet browser extension
- Refresh the page after installing
- Check browser console for error messages

**Insufficient balance:**
- Get TestNet ALGO from [Algorand Dispenser](https://bank.testnet.algorand.network/)
- Need ~5-10 ALGO for testing (includes transaction fees)

**Supabase connection failed:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`
- Ensure database migrations have been run
- Check Supabase project status in dashboard

**Contract not found:**
- Verify `REACT_APP_CONTRACT_APP_ID` matches deployed contract
- Check contract on [AlgoExplorer](https://testnet.algoexplorer.io/)
- Ensure contract was deployed to the correct network (LocalNet/TestNet/MainNet)

**Backend won't start:**
- Check that all environment variables are set correctly
- Verify Supabase connection
- Check port 5000 is not already in use
- Review backend logs for specific error messages

**Frontend build errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 20+)
- Verify all environment variables are set

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Useful Links

- [Algorand Developer Docs](https://developer.algorand.org/)
- [Pera Wallet](https://perawallet.app/)
- [AlgoExplorer TestNet](https://testnet.algoexplorer.io/)
- [PyTeal Documentation](https://pyteal.readthedocs.io/)
- [AlgoKit Documentation](https://github.com/algorandfoundation/algokit-cli)
- [Supabase Documentation](https://supabase.com/docs)

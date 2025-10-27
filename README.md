# AlgoEase 🌟

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Algorand](https://img.shields.io/badge/Blockchain-Algorand-00D1FF?logo=algorand)](https://algorand.org/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)](https://nodejs.org/)
[![PyTeal](https://img.shields.io/badge/Smart_Contracts-PyTeal-3776AB?logo=python)](https://pyteal.readthedocs.io/)

**Decentralized Bounty & Freelance Platform on Algorand Blockchain**

AlgoEase is a trustless escrow system that automatically releases payments using smart contracts. No middlemen, no disputes—just secure, automated payments between clients and freelancers on the Algorand blockchain.

### 🎯 Why AlgoEase?
- **Zero Trust Required** - Smart contracts handle everything automatically
- **Instant Payments** - Payments released immediately upon approval
- **Low Fees** - Algorand's minimal transaction costs (~0.001 ALGO)
- **Complete Transparency** - All transactions visible on blockchain
- **Dispute Resolution** - Built-in verifier system for fairness

## ✨ Features

- 🔒 **Smart Contract Escrow** - Funds held securely until work is approved
- 💰 **Automatic Payments** - No manual intervention needed
- 🎯 **Bounty System** - Create tasks, freelancers apply, get paid
- 🔗 **Multi-Wallet Support** - Pera Wallet & Lute Wallet integration
- 📱 **Modern UI** - Clean, responsive design with Tailwind CSS
- ⚡ **Real-time Updates** - Live transaction status and notifications
- 🛡️ **Secure** - Built on Algorand's secure and fast blockchain

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16.0 or higher ([Download](https://nodejs.org/))
- **Python** 3.7+ ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Algorand Wallet** - [Pera Wallet](https://perawallet.app/) or [Lute Wallet](https://lute-wallet.com/)
- **MongoDB** (Optional, for backend) - [Download](https://www.mongodb.com/try/download/community)

### 1. Clone the Repository
```bash
git clone https://github.com/ZincChloride-cyber/AlgoEase.git
cd AlgoEase
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install contract dependencies (Python/PyTeal)
cd ../contracts
pip install -r requirements.txt
```

> **Note:** If you encounter any dependency issues, ensure you're using compatible Node.js and Python versions.

### 3. Setup Algorand Sandbox (Optional for Local Development)
```bash
# Clone Algorand Sandbox
cd sandbox
docker-compose up -d

# Verify sandbox is running
docker ps
```

### 4. Deploy Smart Contract

#### Option A: Deploy to TestNet
```bash

python working-bounty-tool.py
# Set your mnemonic (TestNet account with ALGO)
# Windows (PowerShell):
$env:CREATOR_MNEMONIC = "your 25 word mnemonic here"
```

### 7. Connect Your Wallet
1. Install [Pera Wallet](https://perawallet.app/) or [Lute Wallet](https://lute-wallet.com/) browser extension
2. Create/Import a TestNet account and fund it with [TestNet ALGO](https://bank.testnet.algorand.network/)
3. Open `http://localhost:3000`
4. Click **"Connect Wallet"** and approve the connection
5. Start creating or accepting bounties! 🎉

## 📁 Project Structure

```
AlgoEase/
├── 📂 frontend/                    # React application
│   ├── 📂 src/
│   │   ├── 📂 components/          # React components
│   │   │   ├── Header.js           # Navigation header
│   │   │   ├── WalletConnection.js # Wallet integration
│   │   │   ├── SmartContractBounty.js
│   │   │   └── WalletInstallGuide.js
│   │   ├── 📂 contexts/
│   │   │   └── WalletContext.js    # Global wallet state
│   │   ├── 📂 pages/               # Page components
│   │   │   ├── Home.js
│   │   │   ├── BountyList.js
│   │   │   ├── BountyDetail.js
│   │   │   ├── CreateBounty.js
│   │   │   └── MyBounties.js
│   │   ├── 📂 utils/               # Utility functions
│   │   │   ├── api.js              # API calls
│   │   │   ├── contractUtils.js    # Contract interactions
│   │   │   └── deployContract.js
│   │   └── 📂 config/
│   │       └── contract.js         # Contract configuration
│   ├── 📂 public/
│   │   ├── index.html
│   │   └── wallet-detection.js
│   ├── 📄 tailwind.config.js
│   ├── 📄 webpack.config.js
│   └── 📄 package.json
├── 📂 backend/                     # Node.js API Server
│   ├── 📂 routes/
│   │   ├── bounties.js            # Bounty endpoints
│   │   └── contracts.js           # Contract endpoints
│   ├── 📂 models/
│   │   └── Bounty.js              # MongoDB schema
│   ├── 📂 middleware/
│   │   ├── auth.js                # Authentication
│   │   └── validation.js          # Request validation
│   ├── 📂 config/
│   │   └── database.js            # DB configuration
│   ├── 📄 server.js               # Express app
│   └── 📄 package.json
├── 📂 contracts/                   # PyTeal Smart Contracts
│   ├── 📄 algoease_contract.py    # Main contract (PyTeal)
│   ├── 📄 algoease_v2_contract.py # V2 contract
│   ├── 📄 algoease_approval.teal  # Compiled approval program
│   ├── 📄 algoease_clear.teal     # Compiled clear program
│   ├── 📄 test_contract.py        # Contract tests
│   └── 📄 requirements.txt
├── 📂 scripts/                     # Utility Scripts
│   ├── 📄 deploy-contract.js      # Contract deployment
│   ├── 📄 setup-contract.js       # Contract setup
│   ├── 📄 test-contract.js        # Contract testing
│   ├── 📄 deploy.py               # Python deployment
│   └── 📄 start-dev.sh/ps1        # Development scripts
├── 📂 sandbox/                     # Algorand Sandbox
│   ├── 📄 docker-compose.yml      # Docker configuration
│   └── 📂 config/                 # Sandbox configs
├── 📂 docs/                        # Documentation
│   ├── 📄 README.md
│   ├── 📄 BACKEND.md
│   ├── 📄 FRONTEND.md
│   └── 📄 SMART_CONTRACT.md
├── 📄 bounty-wizard.py            # Interactive bounty CLI
├── 📄 deploy-to-testnet.py        # TestNet deployment
├── 📄 complete-lifecycle-test.py  # Full lifecycle test
├── 📄 .gitignore
├── 📄 package.json
└── 📄 README.md
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18.x with Hooks
- **Styling:** Tailwind CSS 3.x
- **Build Tool:** Webpack 5
- **Wallet Integration:** 
  - @perawallet/connect SDK
  - Lute Wallet integration
- **HTTP Client:** Axios
- **Routing:** React Router v6

### Backend
- **Runtime:** Node.js 16+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT-based auth
- **Middleware:** CORS, Body-parser, Morgan

### Smart Contracts
- **Language:** PyTeal (Python → TEAL)
- **Blockchain:** Algorand
- **SDK:** py-algorand-sdk
- **Network:** TestNet / MainNet support
- **Features:**
  - Stateful smart contracts
  - Escrow functionality
  - Atomic transactions
  - Deadline-based refunds

### Development Tools
- **Algorand Sandbox:** Local blockchain for testing
- **Docker:** Container orchestration
- **Python Scripts:** Automated deployment & testing
- **Git:** Version control

## 📋 How It Works

### Smart Contract Flow
1. **Client creates a bounty** with payment amount and deadline
2. **Funds are escrowed** in the smart contract
3. **Freelancer accepts** the bounty and starts working
4. **Work is submitted** for verification
5. **Verifier approves** the completed work
6. **Payment is automatically released** to the freelancer
7. **If work isn't approved** by deadline, funds are refunded

### Key Smart Contract Methods
- `create_bounty` - Create a new bounty with escrow
- `accept_bounty` - Freelancer accepts a bounty
- `approve_bounty` - Verifier approves completed work
- `refund_bounty` - Manual refund by client/verifier
- `auto_refund` - Automatic refund after deadline

## 🛠️ Helper Scripts & Tools

AlgoEase includes several utility scripts to make development and testing easier:

### Deployment Scripts
- **`deploy-to-testnet.py`** - Deploy smart contract to Algorand TestNet
- **`deploy.py`** - General deployment script
- **`scripts/deploy-contract.js`** - Node.js deployment script
- **`scripts/setup-contract.js`** - Initial contract setup

### Testing Tools
- **`bounty-wizard.py`** - Interactive CLI for creating and managing bounties
- **`working-bounty-tool.py`** - Complete bounty workflow testing
- **`test-full-lifecycle.py`** - Full lifecycle integration test
- **`complete-lifecycle-test.py`** - End-to-end bounty testing
- **`test-deployed-contract.py`** - Test deployed contract functionality

### Monitoring & Debugging
- **`monitor-transaction.py`** - Real-time transaction monitoring
- **`check-bounty-state.py`** - Check current bounty status
- **`watch-bounty.py`** - Watch bounty state changes
- **`simple-bounty-test.py`** - Simple bounty creation test

### Development Utilities
- **`bounty-cli.py`** - Command-line bounty management
- **`bounty-manager.py`** - Bounty management utilities
- **`scripts/start-dev.sh`** / **`.ps1`** - Start development servers
- **`auto-test-lifecycle.py`** - Automated lifecycle testing

### Usage Example
```bash
# Use the interactive wizard to create a bounty
python bounty-wizard.py

# Monitor a specific transaction
python monitor-transaction.py <txn_id>

# Check state of a bounty
python check-bounty-state.py <app_id>

# Run complete lifecycle test
python complete-lifecycle-test.py
```

## 🔧 Configuration

### Environment Variables

#### Frontend (`frontend/.env.local`)
```env
REACT_APP_CONTRACT_APP_ID=your_deployed_app_id
REACT_APP_CONTRACT_ADDRESS=your_contract_address
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet
```

#### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/algoease
JWT_SECRET=your_jwt_secret
```

### Smart Contract Configuration
The smart contract is automatically configured during deployment. The deployment script will:
- Compile PyTeal to TEAL
- Deploy to Algorand TestNet
- Update frontend environment variables
- Save contract information to `contract-info.json`

## 🎯 Usage

### For Clients
1. **Connect Wallet** - Use Pera Wallet or Lute Wallet
2. **Create Bounty** - Set task details, payment amount, and deadline
3. **Fund Escrow** - ALGO is automatically deducted from your wallet
4. **Review Work** - When freelancer submits work
5. **Approve/Reject** - Approve to release payment or reject for refund

### For Freelancers
1. **Connect Wallet** - Use Pera Wallet or Lute Wallet
2. **Browse Bounties** - View available tasks
3. **Accept Bounty** - Claim a task you want to work on
4. **Complete Work** - Submit your completed work
5. **Get Paid** - Receive payment after approval

### For Verifiers
1. **Connect Wallet** - Use Pera Wallet or Lute Wallet
2. **Review Submissions** - Check completed work quality
3. **Approve/Reject** - Make decision on work quality
4. **Payment Processing** - Approved work triggers automatic payment

## 🔐 Security Features

- **Smart Contract Escrow** - Funds locked until work approved
- **Deadline Protection** - Automatic refunds if deadline missed
- **Multi-signature Logic** - Requires client/verifier approval
- **Immutable Records** - All transactions recorded on blockchain
- **Wallet Integration** - Secure key management

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Wallet not detected | Install Pera Wallet or Lute Wallet extension |
| Connection failed | Check wallet permissions and network |
| Contract errors | Ensure contract is properly deployed |
| Transaction fails | Check wallet has enough ALGO for fees |
| "Transaction rejected by ApprovalProgram" | Redeploy contract with correct configuration |
| Frontend not loading | Check environment variables are set |

### Common Issues

#### Smart Contract Deployment
```bash
# If deployment fails, check your mnemonic
$env:CREATOR_MNEMONIC = "your 25 word mnemonic here"
node scripts/deploy-contract.js
```

#### Wallet Connection Issues
- Ensure wallet extension is installed and unlocked
- Check that you're on the correct network (TestNet)
- Refresh the page and try connecting again

#### Transaction Failures
- Ensure you have enough ALGO for transaction fees
- Check that the smart contract is properly deployed
- Verify the contract App ID in your environment variables

## 🧪 Testing

### Smart Contract Tests
```bash
# Test contract with Node.js
node scripts/test-contract.js

# Test contract with Python
python contracts/test_contract.py

# Run complete lifecycle test
python complete-lifecycle-test.py

# Test full bounty lifecycle
python test-full-lifecycle.py
```

### Frontend Tests
```bash
cd frontend
npm test

# Test wallet connection
# Open test-wallet-connection.html in browser
```

### Backend Tests
```bash
cd backend
npm test
```

### Manual Testing Scripts
```bash
# Interactive bounty wizard
python bounty-wizard.py

# Create and test a bounty
python working-bounty-tool.py

# Monitor transactions
python monitor-transaction.py

# Check bounty state
python check-bounty-state.py

# Watch bounty updates
python watch-bounty.py
```

## 📚 API Documentation

### Smart Contract Methods
- `create_bounty(amount, deadline, description)` - Create new bounty
- `accept_bounty()` - Accept available bounty
- `approve_bounty()` - Approve completed work
- `refund_bounty()` - Manual refund
- `auto_refund()` - Automatic deadline refund

### Backend API Endpoints
- `GET /api/bounties` - Get all bounties
- `POST /api/bounties` - Create new bounty
- `POST /api/bounties/:id/accept` - Accept bounty
- `POST /api/bounties/:id/approve` - Approve work
- `POST /api/bounties/:id/refund` - Refund bounty

## 🚀 Deployment

### TestNet Deployment
```bash
# Deploy to Algorand TestNet
$env:CREATOR_MNEMONIC = "your_testnet_mnemonic"
node scripts/deploy-contract.js
```

### MainNet Deployment
```bash
# Update environment for MainNet
# Change ALGOD_URL to mainnet endpoint
# Deploy with mainnet mnemonic
$env:CREATOR_MNEMONIC = "your_mainnet_mnemonic"
node scripts/deploy-contract.js
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Test on Algorand TestNet before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [Algorand](https://algorand.org/) blockchain
- Uses [Pera Wallet](https://perawallet.app/) and [Lute Wallet](https://lute-wallet.com/) for secure transactions
- Powered by [PyTeal](https://pyteal.readthedocs.io/) smart contracts
- Frontend built with [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)

## 📖 Additional Documentation

Detailed documentation is available in the `docs/` folder:

- **[docs/README.md](docs/README.md)** - General project documentation
- **[docs/FRONTEND.md](docs/FRONTEND.md)** - Frontend architecture and components
- **[docs/BACKEND.md](docs/BACKEND.md)** - Backend API and database schema
- **[docs/SMART_CONTRACT.md](docs/SMART_CONTRACT.md)** - Smart contract details and methods

For deployment guides, check:
- **[COMPLETE-DEPLOYMENT-GUIDE.md](COMPLETE-DEPLOYMENT-GUIDE.md)** - Step-by-step deployment
- **[DEPLOYMENT-INFO.md](DEPLOYMENT-INFO.md)** - Deployment information and logs
- **[HOW-TO-USE.md](HOW-TO-USE.md)** - Usage instructions
- **[QUICK-START-GUIDE.md](QUICK-START-GUIDE.md)** - Quick start reference

## 📝 Useful Commands Cheat Sheet

```bash
# --- Development ---
# Start everything (separate terminals)
cd backend && npm start
cd frontend && npm start

# --- Smart Contract ---
# Compile PyTeal to TEAL
cd contracts && python algoease_contract.py

# Deploy to TestNet
export CREATOR_MNEMONIC="your 25 words here"
node scripts/deploy-contract.js

# Test contract
python complete-lifecycle-test.py

# --- Interactive Tools ---
# Launch bounty wizard
python bounty-wizard.py

# Check bounty status
python check-bounty-state.py <app_id>

# Monitor transaction
python monitor-transaction.py <txn_id>

# --- Sandbox ---
# Start local Algorand node
cd sandbox && docker-compose up -d

# Stop sandbox
docker-compose down

# Check sandbox status
docker ps

# --- Git ---
# Push code to GitHub
git add .
git commit -m "Your message"
git push origin main
```

## 🌟 Features Roadmap

### ✅ Completed
- ✅ Smart contract escrow system
- ✅ Multi-wallet support (Pera & Lute)
- ✅ React frontend with Tailwind CSS
- ✅ MongoDB backend integration
- ✅ Automated payment release
- ✅ Deadline-based refunds

### 🚧 In Progress
- 🚧 Dispute resolution system
- 🚧 Rating and review system
- 🚧 Multiple payment token support

### 📋 Planned
- 📋 Mobile app (React Native)
- 📋 Advanced analytics dashboard
- 📋 Multi-signature approval
- 📋 Escrow for partial payments
- 📋 Integration with other DeFi protocols

## 📞 Support & Community

- **📚 Documentation:** Check the [docs/](docs/) folder for detailed guides
- **🐛 Report Issues:** [Open an issue](https://github.com/ZincChloride-cyber/AlgoEase/issues) on GitHub
- **💬 Discussions:** Use [GitHub Discussions](https://github.com/ZincChloride-cyber/AlgoEase/discussions) for questions
- **📧 Email:** Contact the maintainers for support
- **🌐 Algorand Community:** Join the [Algorand Discord](https://discord.gg/algorand)

## ⚠️ Disclaimer

This project is currently in **beta/development**. Use at your own risk:
- Smart contracts are **not audited** yet
- Test thoroughly on TestNet before MainNet deployment
- Do not use with large amounts of ALGO without proper security audit
- Keep your mnemonics and private keys secure

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Ready to revolutionize freelance work?** 🚀 

Start by deploying your smart contract and connecting your wallet!

Made with ❤️ using [Algorand](https://algorand.org/)

⭐ Star this repo if you find it helpful!

</div>

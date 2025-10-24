# AlgoEase 
**Decentralized Freelance Platform on Algorand**

A trustless escrow system that automatically releases payments using smart contracts. No middlemen, just secure payments between clients and freelancers on the Algorand blockchain.

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
- Node.js (v14 or higher)
- Python 3.7+
- Git
- Algorand wallet (Pera Wallet or Lute Wallet)

### 1. Clone the Repository
```bash
git clone https://github.com/ZincChloride-cyber/AlgoEase.git
cd AlgoEase
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install contract dependencies
cd ../contracts
pip install -r requirements.txt
```

### 3. Deploy Smart Contract
```bash
# Generate TEAL files
cd contracts
python algoease_contract.py

# Deploy to TestNet
cd ..
$env:CREATOR_MNEMONIC = "your 25 word mnemonic here"
node scripts/deploy-contract.js
```

### 4. Start the Application
```bash
# Start backend (Terminal 1)
cd backend
npm start

# Start frontend (Terminal 2)
cd frontend
npm start
```

### 5. Connect Your Wallet
- Install [Pera Wallet](https://perawallet.app/) or [Lute Wallet](https://lute-wallet.com/)
- Open `http://localhost:3000`
- Click "Connect Wallet" and select your preferred wallet

## 📁 Project Structure

```
AlgoEase/
├── 📂 frontend/              # React application
│   ├── 📂 src/
│   │   ├── 📂 components/    # React components
│   │   ├── 📂 contexts/      # React contexts (WalletContext)
│   │   ├── 📂 pages/         # Page components
│   │   ├── 📂 utils/         # Utility functions
│   │   └── 📂 config/        # Configuration files
│   └── 📄 package.json
├── 📂 backend/               # Node.js API
│   ├── 📂 routes/            # API routes
│   ├── 📂 models/            # Database models
│   ├── 📂 middleware/        # Express middleware
│   └── 📄 server.js
├── 📂 contracts/             # Smart contracts (PyTeal)
│   ├── 📄 algoease_contract.py
│   ├── 📄 algoease_approval.teal
│   └── 📄 algoease_clear.teal
├── 📂 scripts/               # Deployment and utility scripts
│   ├── 📄 deploy-contract.js
│   └── 📄 test-contract.js
├── 📂 docs/                  # Documentation
└── 📄 .gitignore
```

## 🛠️ Tech Stack

- **Frontend:** React 18 + Tailwind CSS + Webpack
- **Backend:** Node.js + Express + MongoDB
- **Smart Contracts:** PyTeal on Algorand
- **Wallets:** Pera Wallet & Lute Wallet
- **Blockchain:** Algorand TestNet/MainNet
- **Deployment:** Custom deployment scripts

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

### Test Smart Contract
```bash
# Run contract tests
node scripts/test-contract.js
```

### Test Frontend
```bash
cd frontend
npm test
```

### Test Backend
```bash
cd backend
npm test
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

## 📞 Support

- **Documentation:** Check the [docs/](docs/) folder
- **Issues:** Open an issue on GitHub
- **Discussions:** Use GitHub Discussions for questions

---

**Ready to build the future of freelance work?** 🚀 Start by deploying your smart contract and connecting your wallet!

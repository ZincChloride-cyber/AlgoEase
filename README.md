# AlgoEase 🚀
**Decentralized Freelance Platform on Algorand**

A trustless escrow system that automatically releases payments using smart contracts. No middlemen, just secure payments between clients and freelancers.

## ✨ Features

- 🔒 **Smart Contract Escrow** - Funds held securely until work is approved
- 💰 **Automatic Payments** - No manual intervention needed
- 🎯 **Bounty System** - Create tasks, freelancers apply, get paid
- 🔗 **Lute Wallet Integration** - Easy wallet connection
- 📱 **Modern UI** - Clean, responsive design

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install
```

### 2. Start the Application
```bash
cd frontend
npm start
```

### 3. Connect Your Wallet
- Install [Lute Wallet](https://chrome.google.com/webstore/detail/lute-wallet/)
- Open `http://localhost:3000`
- Click "Connect Wallet"

### 4. Deploy Smart Contract (Optional)
```bash
# Compile the contract
cd contracts
python algoease_contract.py

# Deploy the contract
cd ..
python deploy.py
```

## 📁 Project Structure

```
AlgoEase/
├── 📂 frontend/          # React application
├── 📂 contracts/         # Smart contracts (PyTeal)
├── 📂 backend/           # Node.js API
├── 📂 docs/             # Documentation
└── 📄 deploy.py         # Contract deployment script
```

## 🛠️ Tech Stack

- **Frontend:** React + Tailwind CSS
- **Smart Contracts:** PyTeal on Algorand
- **Wallet:** Lute Wallet
- **Blockchain:** Algorand TestNet

## 📋 How It Works

1. **Client creates a bounty** with payment amount and deadline
2. **Freelancer accepts** the bounty and starts working
3. **Verifier approves** the completed work
4. **Payment is automatically released** to the freelancer
5. **If work isn't approved** by deadline, funds are refunded

## 🔧 Configuration

### Environment Variables
Create `frontend/.env`:
```env
REACT_APP_CONTRACT_APP_ID=your_app_id_here
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_CREATOR_MNEMONIC="your_mnemonic_here"
```

## 🎯 Usage

### For Clients
1. Connect your Lute wallet
2. Create a new bounty with task details
3. Set payment amount and deadline
4. Wait for freelancer to accept
5. Approve work when completed

### For Freelancers
1. Connect your Lute wallet
2. Browse available bounties
3. Accept a bounty you want to work on
4. Complete the task
5. Wait for approval to get paid

### For Verifiers
1. Connect your Lute wallet
2. Review completed work
3. Approve or reject the submission
4. Payment is automatically processed

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Wallet not detected | Install Lute Wallet extension |
| Connection failed | Check wallet permissions |
| Contract errors | Make sure contract is deployed |
| Transaction fails | Check wallet has enough ALGO |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [Algorand](https://algorand.org/) blockchain
- Uses [Lute Wallet](https://lute-wallet.com/) for secure transactions
- Powered by [PyTeal](https://pyteal.readthedocs.io/) smart contracts

---

**Need help?** Check out our [documentation](docs/) or open an issue! 🆘
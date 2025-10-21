# AlgoEase — Freelance & Bounty Payment Platform on Algorand

A trustless, decentralized escrow system built on Algorand that automatically releases payments based on predefined conditions. By replacing human middlemen with smart contracts, AlgoEase enables fast, secure, transparent, and low‑cost payments between clients and freelancers.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Python 3.10+** - [Download here](https://python.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Algorand Wallet** - [Pera Wallet](https://perawallet.app/) or [AlgoSigner](https://www.purestake.com/technology/algosigner/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/algoease.git
   cd algoease
   ```

2. **Run the setup script:**
   
   **Windows (PowerShell):**
   ```powershell
   .\scripts\setup.ps1
   ```
   
   **macOS/Linux:**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

This will start both the frontend (http://localhost:3000) and backend (http://localhost:5000) servers.

## 📁 Project Structure

```
algoease/
├── contracts/              # PyTeal smart contracts
│   ├── algoease_contract.py # Main escrow contract
│   ├── test_contract.py    # Contract tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/                # Node.js API (optional)
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Express middleware
│   └── package.json
├── scripts/               # Deployment and utility scripts
│   ├── deploy.py          # Contract deployment
│   ├── test_contract.py   # Contract testing
│   └── setup.ps1/setup.sh # Development setup
├── docs/                  # Documentation
└── README.md
```

## 🏗️ Architecture

### Smart Contract (PyTeal)

The core escrow contract handles:

- **Bounty Creation**: Clients create and fund bounties
- **Work Acceptance**: Freelancers commit to tasks
- **Work Approval**: Verifiers approve completed work
- **Automatic Payouts**: Funds released upon approval
- **Automatic Refunds**: Funds returned if conditions not met

**Key Features:**
- Trustless escrow via smart contracts
- Inner transactions for secure fund management
- Deadline-based automatic refunds
- Multi-bounty support per contract

### Frontend (React + Tailwind)

**Features:**
- Modern, responsive UI with Tailwind CSS
- Wallet integration (Pera, WalletConnect, AlgoSigner)
- Real-time bounty browsing and management
- Intuitive workflow for clients and freelancers

**Pages:**
- **Home**: Landing page with features and how-it-works
- **Browse Bounties**: List of available bounties
- **Create Bounty**: Form for creating new bounties
- **My Bounties**: User's created and accepted bounties
- **Bounty Detail**: Detailed view of individual bounties

### Backend (Node.js - Optional)

**API Endpoints:**
- `GET /api/bounties` - List bounties with filtering
- `POST /api/bounties` - Create new bounty
- `GET /api/bounties/:id` - Get bounty details
- `POST /api/bounties/:id/submit` - Submit work
- `GET /api/contracts/:id/state` - Get contract state

**Features:**
- MongoDB for metadata storage
- Input validation with Joi
- Rate limiting and security headers
- Algorand integration for contract state

## 🔧 Development

### Smart Contract Development

1. **Compile contracts:**
   ```bash
   cd contracts
   python algoease_contract.py
   ```

2. **Run tests:**
   ```bash
   python test_contract.py
   ```

3. **Deploy to testnet:**
   ```bash
   python ../scripts/deploy.py testnet
   ```

### Frontend Development

1. **Start development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

### Backend Development

1. **Start development server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

## 🌐 Deployment

### Smart Contract Deployment

1. **Testnet Deployment:**
   ```bash
   python scripts/deploy.py testnet
   ```

2. **Mainnet Deployment:**
   ```bash
   python scripts/deploy.py mainnet
   ```

### Frontend Deployment

1. **Build the application:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to your hosting service:**
   - Vercel: `vercel --prod`
   - Netlify: `netlify deploy --prod`
   - AWS S3: Upload `build/` folder

### Backend Deployment

1. **Set up environment variables**
2. **Deploy to your cloud provider:**
   - Heroku: `git push heroku main`
   - AWS: Use Elastic Beanstalk or ECS
   - DigitalOcean: Use App Platform

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
python test_contract.py
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

## 📚 API Documentation

### Bounty Endpoints

#### GET /api/bounties
List all bounties with optional filtering.

**Query Parameters:**
- `status` - Filter by status (open, accepted, approved, claimed, refunded)
- `client` - Filter by client address
- `freelancer` - Filter by freelancer address
- `minAmount` - Minimum bounty amount
- `maxAmount` - Maximum bounty amount
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "bounties": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /api/bounties
Create a new bounty.

**Request Body:**
```json
{
  "title": "Build a React component",
  "description": "Create a responsive dashboard component...",
  "amount": 15.5,
  "deadline": "2024-02-15T23:59:59Z",
  "verifierAddress": "ALGORAND_ADDRESS",
  "requirements": ["React 18+", "TypeScript"],
  "tags": ["frontend", "react"]
}
```

### Contract Endpoints

#### GET /api/contracts/:contractId/state
Get the current state of a smart contract.

**Response:**
```json
{
  "bountyCount": 1,
  "clientAddress": "ALGORAND_ADDRESS",
  "freelancerAddress": "ALGORAND_ADDRESS",
  "amount": 1000000,
  "deadline": 1704067200,
  "status": 2,
  "taskDescription": "Task description",
  "verifierAddress": "ALGORAND_ADDRESS"
}
```

## 🔐 Security

### Smart Contract Security

- **Input Validation**: All inputs are validated before processing
- **Access Control**: Only authorized addresses can perform actions
- **Deadline Enforcement**: Automatic refunds if deadlines are missed
- **State Management**: Proper state transitions prevent invalid operations

### Backend Security

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Joi schemas validate all inputs
- **CORS Protection**: Configured for specific origins
- **Security Headers**: Helmet.js provides security headers

### Frontend Security

- **Wallet Integration**: Secure wallet connection protocols
- **Input Sanitization**: All user inputs are sanitized
- **HTTPS Only**: Production deployments use HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Use meaningful commit messages
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Algorand Foundation](https://algorand.foundation/) for the blockchain platform
- [AlgoKit](https://github.com/algorandfoundation/algokit) for development tools
- [PyTeal](https://github.com/algorand/pyteal) for smart contract development
- [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/) for the frontend

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/algoease/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/algoease/discussions)
- **Discord**: [Algorand Discord](https://discord.gg/algorand)

---

**Built with ❤️ on Algorand**

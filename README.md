# AlgoEase — Decentralized Freelance Platform on Algorand

A trustless escrow system that automatically releases payments using smart contracts. No middlemen, just secure payments between clients and freelancers.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start the app:**
   ```bash
   cd frontend && npm start
   ```

3. **Connect wallet:**
   - Install Pera Wallet or AlgoSigner
   - Open `http://localhost:3000`
   - Click "Connect Wallet"

4. **Deploy smart contract (for testing):**
   ```bash
   cd contracts
   python algoease_contract.py
   # Deploy using AlgoKit or goal CLI
   # Set REACT_APP_CONTRACT_APP_ID in frontend/.env
   ```

## Project Structure

```
algoease/
├── contracts/          # PyTeal smart contracts
├── frontend/           # React + Tailwind CSS
├── backend/            # Node.js API (optional)
├── scripts/            # Deployment and utility scripts
└── docs/              # Documentation
```


## Features

- ✅ **Smart Contract Integration** - Direct blockchain interaction
- ✅ **Real Wallet Support** - Pera Wallet and AlgoSigner
- ✅ **Bounty Management** - Create, accept, approve, claim
- ✅ **Automatic Payments** - No middlemen needed
- ✅ **Secure Escrow** - Funds held in smart contract
- ✅ **Easy Setup** - Wallet detection and installation guide

## Run Scripts

From the repo root:

```bash
# Install everything (root + frontend + backend)
npm run install:all

# Start both frontend and backend (in parallel)
npm run dev

# Frontend only
cd frontend && npm start

# Backend only
cd backend && npm run dev

# Build frontend for production
cd frontend && npm run build
```

## Tech Stack

- **Smart Contracts:** PyTeal on Algorand
- **Frontend:** React + Tailwind CSS
- **Wallets:** Pera Wallet, AlgoSigner
- **Development:** AlgoKit, Webpack

## Frontend Notes (Algorand SDK + Webpack)

To ensure the React app works in the browser without Node polyfills:

- Use the browser build of Algorand SDK (already applied):

```javascript
// frontend/src/contexts/WalletContext.js
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
```

- Webpack fallbacks (already configured in `frontend/webpack.config.js`) avoid bundling Node-only modules:

```js
// frontend/webpack.config.js
resolve: {
  fallback: {
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    util: require.resolve('util'),
    os: require.resolve('os-browserify/browser'),
    http: false,
    https: false,
    fs: false,
    path: false,
    crypto: false,
    buffer: require.resolve('buffer'),
    process: require.resolve('process/browser'),
  },
}
```

Installed dev polyfills: `process`, `buffer`, `stream-browserify`, `assert`, `util`, `os-browserify`.

If you upgrade dependencies, keep these notes in mind to avoid Webpack 5 polyfill errors.

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Algorand Sandbox or TestNet access
- Wallet: Pera, WalletConnect, or AlgoSigner

### Installation

1. Clone the repository
2. Run `npm run install:all` to install all dependencies
3. Set up AlgoKit: `npm run setup:algo`
4. Start development: `npm run dev`

### Environment files

- Backend: copy `backend/env.example` to `backend/.env` and adjust values.
- Frontend: optionally set `REACT_APP_*` vars for API hosts and contract IDs.

## Smart Contract

The escrow contract handles:
- Create bounties with ALGO payments
- Accept bounties as freelancers
- Approve completed work
- Claim payments automatically
- Handle refunds

### Deploy Contract

```bash
cd contracts
python algoease_contract.py
# Deploy using AlgoKit or goal CLI
```

## Frontend Features

- **Wallet Connection** - Automatic detection of Pera Wallet and AlgoSigner
- **Bounty Management** - Create, browse, accept, approve, claim
- **Real-time Updates** - Live contract state monitoring
- **Responsive Design** - Works on mobile and desktop

## Troubleshooting

- **No wallets detected**: Install Pera Wallet or AlgoSigner
- **Connection failed**: Check wallet permissions and network
- **Contract not deployed**: Set `REACT_APP_CONTRACT_APP_ID` in `.env`
- **Webpack errors**: Install polyfills: `npm i -D process buffer stream-browserify assert util os-browserify`

## Testing

1. **Deploy contract** and set `REACT_APP_CONTRACT_APP_ID` in `.env`
2. **Connect wallet** (Pera Wallet or AlgoSigner)
3. **Test bounty flow**: Create → Accept → Approve → Claim

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Commit style

Use conventional commits, e.g.:

```text
feat(contracts): add refund path for deadline expiry
fix(frontend): correct WalletContext algosdk import
docs(readme): add Git workflow and troubleshooting
```

## Documentation

- `SMART_CONTRACT_INTEGRATION.md` - Complete integration guide
- `docs/` - API and component documentation

## License

MIT License - see LICENSE file for details

# AlgoEase — Freelance & Bounty Payment Platform on Algorand

A trustless, decentralized escrow system built on Algorand that automatically releases payments based on predefined conditions. By replacing human middlemen with smart contracts, AlgoEase enables fast, secure, transparent, and low‑cost payments between clients and freelancers.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up AlgoKit:**
   ```bash
   npm run setup:algo
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   - Frontend: `http://localhost:3000`
   - Backend (optional): `http://localhost:5000/health`

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

- ✅ Trustless escrow via Algorand smart contracts
- ✅ Condition-based automatic payouts
- ✅ Low fees and instant settlement
- ✅ Global and permissionless access
- ✅ Optional arbitration and milestone payouts

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
- **Wallets:** WalletConnect, Pera, AlgoSigner
- **Backend:** Node.js (optional)
- **Development:** AlgoKit

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

## Smart Contract Architecture

The core escrow contract handles:
- Bounty creation and funding
- Work approval by verifiers
- Automatic payouts and refunds
- Multi-bounty support

### Build/compile contracts

```bash
cd contracts
python algoease_contract.py
```

### Deploy to TestNet

```bash
python scripts/deploy.py testnet
```

## Frontend Features

- Wallet connection and management
- Bounty creation and browsing
- Task acceptance and submission
- Approval and claim workflows

## Troubleshooting

- Webpack complains about missing Node modules like `stream`, `http`, `assert`:
  - Confirm the fallbacks exist in `frontend/webpack.config.js` (see above).
  - Ensure polyfill packages are installed:
    ```bash
    cd frontend
    npm i -D process buffer stream-browserify assert util os-browserify
    ```

- Algorand SDK import error:
  - Use the browser build import shown above or update to the latest `algosdk`.

- PowerShell `&&` error when chaining commands:
  - Run commands separately: `cd frontend` then `npm start`.

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

## License

MIT License - see LICENSE file for details

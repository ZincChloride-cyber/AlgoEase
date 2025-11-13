# AlgoEase Projects

This directory contains the main projects for AlgoEase:

## Projects

### `algoease-contracts`
Smart contracts written in PyTeal for the AlgoEase escrow platform.

**Features:**
- Bounty creation and management
- Escrow functionality
- Automatic payment release
- Deadline-based refunds

**Setup:**
```bash
cd algoease-contracts
pip install -r requirements.txt
```

**Deploy:**
```bash
algokit project deploy localnet  # or testnet/mainnet
```

### `algoease-frontend`
React frontend application for interacting with AlgoEase contracts.

**Features:**
- Wallet integration (Pera, Lute)
- Bounty browsing and creation
- Real-time transaction status
- Modern UI with Tailwind CSS

**Setup:**
```bash
cd algoease-frontend
npm install
cp .env.example .env
# Edit .env with your contract App ID
npm run dev
```

## Development Workflow

1. **Start LocalNet:**
   ```bash
   algokit localnet start
   ```

2. **Deploy Contracts:**
   ```bash
   cd algoease-contracts
   algokit project deploy localnet
   ```

3. **Start Frontend:**
   ```bash
   cd algoease-frontend
   npm run dev
   ```

4. **Open in Browser:**
   Navigate to `http://localhost:3000`


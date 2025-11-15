# AxelarX Development Guide

## 🚀 Quick Start

### Prerequisites

1. **Rust & Cargo** (latest stable)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Linera CLI**
   ```bash
   # Follow the official installation guide
   # https://linera.dev/getting_started/installation.html
   ```

3. **Node.js** (v18+)
   ```bash
   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

4. **Docker** (for local development)

### Local Development Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd axelarx
   cp env.example .env.local
   ```

2. **Start Local Linera Network**
   ```bash
   ./scripts/deploy-local.sh
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - GraphQL: http://localhost:8080
   - Faucet: http://localhost:8080

## 🏗️ Architecture

### Smart Contracts

#### Order Book Contract (`contracts/orderbook/`)
- **Purpose**: Manages limit order books for each trading pair
- **Key Features**:
  - Price-time priority matching
  - Real-time order management
  - Cross-chain settlement integration
  - Gas-free operations on Linera

#### Settlement Engine (`contracts/settlement/`)
- **Purpose**: Handles cross-chain trade settlement
- **Key Features**:
  - Atomic swaps
  - Multi-signature escrow
  - Timeout-based refunds
  - Bridge integration

#### Bridge Contracts (`contracts/bridge/`)
- **Purpose**: Connects Linera with external blockchains
- **Key Features**:
  - Light client proofs
  - Multi-sig validation
  - Cross-chain messaging
  - Asset wrapping/unwrapping

### Frontend Architecture

#### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Framer Motion
- **State Management**: Zustand + React Query
- **Web3**: Wagmi + Viem
- **Charts**: Custom Canvas + TradingView

#### Key Components
- **TradingChart**: Real-time price charts with WebSocket updates
- **OrderBook**: Live order book with depth visualization
- **TradeForm**: Advanced order placement with multiple order types
- **WalletPanel**: Multi-chain wallet integration

## 🔧 Development Workflow

### Smart Contract Development

1. **Create New Contract**
   ```bash
   mkdir contracts/new-contract
   cd contracts/new-contract
   cargo init --lib
   ```

2. **Add to Workspace**
   ```toml
   # In root Cargo.toml
   [workspace]
   members = [
       # ... existing contracts
       "contracts/new-contract",
   ]
   ```

3. **Build Contract**
   ```bash
   cargo build --release --target wasm32-unknown-unknown
   ```

4. **Deploy to Local Network**
   ```bash
   linera publish-and-create \
       target/wasm32-unknown-unknown/release/contract.wasm \
       target/wasm32-unknown-unknown/release/service.wasm \
       --chain <chain-id>
   ```

### Frontend Development

1. **Component Structure**
   ```
   components/
   ├── trading/           # Trading-specific components
   ├── ui/               # Reusable UI components
   ├── charts/           # Chart components
   └── wallet/           # Wallet components
   ```

2. **Adding New Pages**
   ```bash
   # Create new page
   touch app/new-page/page.tsx
   ```

3. **GraphQL Integration**
   ```typescript
   // hooks/useNewQuery.ts
   export function useNewQuery() {
     return useQuery({
       queryKey: ['newQuery'],
       queryFn: async () => {
         // GraphQL query implementation
       },
     });
   }
   ```

## 🧪 Testing

### Smart Contract Tests

```bash
# Run contract tests
cargo test

# Run specific contract tests
cd contracts/orderbook
cargo test
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

### Integration Tests

```bash
# Start local network
./scripts/deploy-local.sh

# Run integration tests
npm run test:integration
```

## 📊 Monitoring & Debugging

### Linera Network Monitoring

```bash
# Check wallet status
linera wallet show

# Query chain balance
linera query-balance <chain-id>

# View application state
linera query-application <app-id> --chain <chain-id>
```

### Frontend Debugging

1. **React DevTools**: Install browser extension
2. **Redux DevTools**: For state debugging
3. **Network Tab**: Monitor GraphQL queries
4. **Console Logs**: Enable debug mode in .env

### GraphQL Debugging

- **GraphiQL Interface**: http://localhost:8080
- **Query Examples**:
  ```graphql
  query GetOrderBook($market: String!) {
    orderBook(market: $market) {
      bids {
        price
        size
        total
      }
      asks {
        price
        size
        total
      }
    }
  }
  ```

## 🚀 Deployment

### Local Deployment

```bash
./scripts/deploy-local.sh
```

### Testnet Deployment

```bash
# Set testnet environment
export LINERA_NETWORK=testnet
export LINERA_FAUCET_URL=https://faucet.testnet.linera.net

# Deploy contracts
./scripts/deploy-testnet.sh
```

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to mainnet
./scripts/deploy-mainnet.sh
```

## 🔒 Security Considerations

### Smart Contract Security

1. **Input Validation**: All user inputs are validated
2. **Overflow Protection**: Using safe math operations
3. **Access Control**: Role-based permissions
4. **Reentrancy Guards**: Preventing reentrancy attacks

### Frontend Security

1. **XSS Prevention**: Input sanitization
2. **CSRF Protection**: Token-based validation
3. **Secure Storage**: Encrypted local storage
4. **Network Security**: HTTPS enforcement

## 🤝 Contributing

### Code Style

1. **Rust**: Follow official Rust style guide
2. **TypeScript**: ESLint + Prettier configuration
3. **Git**: Conventional commit messages

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit pull request with detailed description

### Issue Reporting

1. Use issue templates
2. Provide detailed reproduction steps
3. Include environment information
4. Add relevant labels

## 📚 Additional Resources

- [Linera Documentation](https://linera.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Query](https://tanstack.com/query/latest)

## 🆘 Troubleshooting

### Common Issues

1. **Linera CLI not found**
   - Ensure Linera CLI is installed and in PATH
   - Check installation guide

2. **Wallet initialization fails**
   - Ensure faucet is running
   - Check network connectivity

3. **Contract deployment fails**
   - Verify contract builds successfully
   - Check chain ID and permissions

4. **Frontend build errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

5. **GraphQL connection issues**
   - Verify Linera service is running
   - Check port availability

### Getting Help

- Discord: [Join our community](https://discord.gg/axelarx)
- GitHub Issues: Report bugs and feature requests
- Documentation: Check our comprehensive docs
- Twitter: [@AxelarX_io](https://twitter.com/AxelarX_io)

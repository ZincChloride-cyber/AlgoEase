# AlgoEase Frontend Documentation

## Overview

The AlgoEase frontend is a React application built with Tailwind CSS that provides an intuitive interface for interacting with the AlgoEase smart contract. It supports multiple wallet integrations and provides a seamless user experience for both clients and freelancers.

## Technology Stack

- **React 18** - Frontend framework
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **AlgoSDK** - Algorand blockchain integration
- **WalletConnect** - Wallet connection protocol
- **Pera Wallet** - Native Algorand wallet
- **AlgoSigner** - Browser extension wallet

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── Header.js
│   ├── pages/
│   │   ├── Home.js
│   │   ├── CreateBounty.js
│   │   ├── BountyList.js
│   │   ├── MyBounties.js
│   │   └── BountyDetail.js
│   ├── contexts/
│   │   └── WalletContext.js
│   ├── utils/
│   ├── hooks/
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
└── tailwind.config.js
```

## Components

### Header

The main navigation component that includes:
- Logo and branding
- Navigation links
- Wallet connection status
- User address display

**Props:** None

**Features:**
- Responsive design
- Wallet connection management
- Address formatting
- Navigation highlighting

### Pages

#### Home
Landing page with:
- Hero section
- Feature highlights
- How-it-works section
- Statistics

#### CreateBounty
Form for creating new bounties:
- Task details input
- Amount and deadline setting
- Verifier selection
- Form validation

#### BountyList
Browse available bounties:
- Filtering by status
- Pagination
- Search functionality
- Bounty cards

#### MyBounties
User's bounty management:
- Created bounties
- Accepted bounties
- Action buttons
- Status tracking

#### BountyDetail
Detailed bounty view:
- Complete bounty information
- Submission history
- Action buttons
- Timeline

## Contexts

### WalletContext

Manages wallet connection and blockchain interactions.

**State:**
- `account` - Connected wallet address
- `isConnected` - Connection status
- `isConnecting` - Connection in progress
- `connector` - Wallet connector instance

**Methods:**
- `connectWallet()` - Connect to wallet
- `disconnectWallet()` - Disconnect wallet
- `signTransaction(txn)` - Sign transaction
- `getAccountInfo()` - Get account information

**Usage:**
```jsx
import { useWallet } from '../contexts/WalletContext';

function MyComponent() {
  const { account, isConnected, connectWallet } = useWallet();
  
  return (
    <div>
      {isConnected ? (
        <p>Connected: {account}</p>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Styling

### Tailwind Configuration

The project uses a custom Tailwind configuration with:

**Colors:**
- Primary: Blue palette
- Secondary: Green palette
- Custom grays

**Fonts:**
- Inter font family
- System font fallbacks

**Components:**
- Custom button classes
- Card components
- Input field styles

### Custom CSS Classes

```css
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
}

.btn-secondary {
  @apply bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
}

.btn-outline {
  @apply border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
}

.card {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.input-field {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}
```

## Wallet Integration

### Supported Wallets

1. **Pera Wallet**
   - Native mobile wallet
   - Deep linking support
   - QR code connection

2. **WalletConnect**
   - Multi-wallet support
   - QR code connection
   - Session management

3. **AlgoSigner**
   - Browser extension
   - Direct connection
   - Transaction signing

### Connection Flow

1. User clicks "Connect Wallet"
2. Wallet selection modal appears
3. User selects preferred wallet
4. Connection process begins
5. Wallet prompts for approval
6. Connection established
7. User address displayed

### Transaction Signing

```jsx
const signTransaction = async (txn) => {
  try {
    if (connector) {
      // WalletConnect signing
      return await connector.request({
        method: 'algo_signTxn',
        params: [txn]
      });
    } else if (window.algorand && window.algorand.pera) {
      // Pera Wallet signing
      return await window.algorand.pera.signTransaction(txn);
    } else if (window.AlgoSigner) {
      // AlgoSigner signing
      return await window.AlgoSigner.signTxn(txn);
    }
  } catch (error) {
    console.error('Failed to sign transaction:', error);
    throw error;
  }
};
```

## State Management

### Local State

Each component manages its own local state using React hooks:

```jsx
const [bounties, setBounties] = useState([]);
const [loading, setLoading] = useState(true);
const [filter, setFilter] = useState('all');
```

### Global State

Global state is managed through React Context:

- Wallet connection state
- User authentication
- Application settings

## API Integration

### Backend Communication

The frontend communicates with the backend API for:
- Bounty metadata
- User information
- Contract state
- Transaction parameters

### Error Handling

```jsx
try {
  const response = await fetch('/api/bounties');
  const data = await response.json();
  setBounties(data.bounties);
} catch (error) {
  console.error('Failed to fetch bounties:', error);
  setError('Failed to load bounties');
}
```

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimization

- Touch-friendly buttons
- Swipe gestures
- Optimized layouts
- Fast loading

## Performance

### Optimization Techniques

1. **Code Splitting**
   - Route-based splitting
   - Lazy loading

2. **Memoization**
   - React.memo for components
   - useMemo for expensive calculations
   - useCallback for event handlers

3. **Image Optimization**
   - WebP format
   - Lazy loading
   - Responsive images

4. **Bundle Optimization**
   - Tree shaking
   - Minification
   - Compression

## Testing

### Unit Tests

```jsx
import { render, screen } from '@testing-library/react';
import { WalletProvider } from '../contexts/WalletContext';
import Header from '../components/Header';

test('renders header with logo', () => {
  render(
    <WalletProvider>
      <Header />
    </WalletProvider>
  );
  
  expect(screen.getByText('AlgoEase')).toBeInTheDocument();
});
```

### Integration Tests

- Wallet connection flow
- Transaction signing
- API communication
- User interactions

## Deployment

### Build Process

```bash
npm run build
```

### Environment Variables

```env
REACT_APP_ALGOD_SERVER=https://testnet-api.algonode.cloud
REACT_APP_ALGOD_TOKEN=
REACT_APP_INDEXER_SERVER=https://testnet-idx.algonode.cloud
REACT_APP_INDEXER_TOKEN=
REACT_APP_CONTRACT_APP_ID=
```

### Hosting Options

1. **Vercel**
   - Automatic deployments
   - Edge functions
   - Analytics

2. **Netlify**
   - Continuous deployment
   - Form handling
   - Edge functions

3. **AWS S3 + CloudFront**
   - Static hosting
   - CDN distribution
   - Custom domains

## Security

### Best Practices

1. **Input Validation**
   - Client-side validation
   - Server-side validation
   - Sanitization

2. **HTTPS Only**
   - Force HTTPS in production
   - Secure cookies
   - HSTS headers

3. **Content Security Policy**
   - Restrict resource loading
   - Prevent XSS attacks
   - Secure headers

4. **Wallet Security**
   - Never store private keys
   - Use secure connection protocols
   - Validate transactions

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Check wallet installation
   - Verify network connection
   - Clear browser cache

2. **Transaction Failed**
   - Check account balance
   - Verify transaction parameters
   - Check network status

3. **API Errors**
   - Check backend status
   - Verify API endpoints
   - Check network connectivity

### Debug Mode

Enable debug mode by setting:
```env
REACT_APP_DEBUG=true
```

This will:
- Show detailed error messages
- Log all API calls
- Display transaction details
- Show wallet connection status

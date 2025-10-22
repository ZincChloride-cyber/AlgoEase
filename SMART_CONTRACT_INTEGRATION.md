# Smart Contract Integration Guide

This guide explains how to connect the AlgoEase smart contract to the frontend for bounty transactions and verification.

## Overview

The integration includes:
- Smart contract utility functions for all bounty operations
- Updated WalletContext with contract interaction methods
- Modified frontend components to use smart contract transactions
- Contract deployment utilities
- Configuration management

## Setup Instructions

### 1. Deploy the Smart Contract

First, compile and deploy the smart contract:

```bash
# Navigate to contracts directory
cd contracts

# Install Python dependencies
pip install -r requirements.txt

# Compile the contract
python algoease_contract.py

# This will create:
# - contracts/algoease_approval.teal
# - contracts/algoease_clear.teal
```

### 2. Set Environment Variables

Create a `.env` file in the frontend directory:

```env
# Contract Configuration
REACT_APP_CONTRACT_APP_ID=your_deployed_app_id_here

# Algorand Network
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud

# Deployment (for initial setup)
REACT_APP_CREATOR_MNEMONIC=your_creator_mnemonic_here
```

### 3. Deploy Contract (First Time Setup)

```javascript
import contractDeployer from './utils/deployContract';

// Deploy the contract
const appId = await contractDeployer.deployContract();
console.log('Contract deployed with App ID:', appId);

// Set the app ID in your environment or contract utils
contractUtils.setAppId(appId);
```

### 4. Initialize Contract

After deployment, initialize the contract:

```javascript
// Initialize the contract (creates first bounty)
await contractDeployer.initializeContract();
```

## Usage

### Creating a Bounty

```javascript
import { useWallet } from './contexts/WalletContext';

const { createBounty, isConnected } = useWallet();

// Create a bounty
const txId = await createBounty(
  amount,           // Amount in ALGO
  deadline,         // ISO date string
  description,       // Task description
  verifierAddress   // Verifier address (optional)
);
```

### Accepting a Bounty

```javascript
const { acceptBounty, canPerformAction } = useWallet();

if (canPerformAction('accept')) {
  const txId = await acceptBounty();
}
```

### Approving Work

```javascript
const { approveBounty, canPerformAction } = useWallet();

if (canPerformAction('approve')) {
  const txId = await approveBounty();
}
```

### Claiming Payment

```javascript
const { claimBounty, canPerformAction } = useWallet();

if (canPerformAction('claim')) {
  const txId = await claimBounty();
}
```

### Refunding Bounty

```javascript
const { refundBounty, canPerformAction } = useWallet();

if (canPerformAction('refund')) {
  const txId = await refundBounty();
}
```

## Smart Contract Methods

The smart contract supports the following methods:

1. **create_bounty** - Create a new bounty
2. **accept_bounty** - Accept an open bounty
3. **approve_bounty** - Approve completed work (verifier only)
4. **claim** - Claim approved payment
5. **refund** - Refund bounty to client

## Contract State

The contract maintains the following global state:
- `bounty_count` - Number of bounties created
- `client_addr` - Client address
- `freelancer_addr` - Freelancer address
- `amount` - Bounty amount in microALGO
- `deadline` - Deadline timestamp
- `status` - Current bounty status
- `task_desc` - Task description
- `verifier_addr` - Verifier address

## Status Flow

1. **OPEN (0)** - Bounty is open for acceptance
2. **ACCEPTED (1)** - Freelancer has accepted the bounty
3. **APPROVED (2)** - Verifier has approved the work
4. **CLAIMED (3)** - Payment has been claimed
5. **REFUNDED (4)** - Bounty has been refunded

## Error Handling

All contract interactions include proper error handling:

```javascript
try {
  const txId = await createBounty(amount, deadline, description, verifier);
  console.log('Transaction successful:', txId);
} catch (error) {
  console.error('Transaction failed:', error.message);
  // Handle error appropriately
}
```

## Testing

To test the integration:

1. Deploy the contract to TestNet
2. Set up test accounts with ALGO
3. Test each contract method
4. Verify state changes
5. Test error conditions

## Security Considerations

- Always validate user permissions before contract calls
- Use proper error handling for failed transactions
- Implement proper wallet connection checks
- Validate contract state before operations
- Use environment variables for sensitive data

## Troubleshooting

### Common Issues:

1. **Contract not deployed**: Set the correct APP_ID in environment variables
2. **Transaction fails**: Check wallet connection and permissions
3. **State not updating**: Ensure proper contract state loading
4. **Permission denied**: Verify user roles and contract state

### Debug Tips:

- Check browser console for error messages
- Verify contract state with `loadContractState()`
- Use AlgoExplorer to check transaction status
- Test with small amounts first

## Next Steps

1. Implement proper wallet integration (Pera Wallet, AlgoSigner)
2. Add transaction history tracking
3. Implement proper error UI components
4. Add contract state monitoring
5. Implement multi-bounty support
6. Add advanced verification features

# Contract Connection Guide

## Frontend Connected to Deployed Smart Contract

The frontend has been successfully connected to the deployed smart contract on Algorand TestNet.

### Contract Details
- **Contract App ID**: `749570296`
- **Contract Address**: `LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U`
- **Network**: Algorand TestNet
- **Deployment Transaction**: `BN25OXQUI3LWM6VVL47QII4CLGJQQTZAAOG5OBW62XYZ6P3FXEAA`

### Frontend Configuration

#### 1. Contract Utils (`frontend/src/utils/contractUtils.js`)
- **Default App ID**: `749570296` (fallback if env var not set)
- **Environment Variable**: `REACT_APP_CONTRACT_APP_ID`
- **Algod URL**: `https://testnet-api.algonode.cloud` (TestNet)
- **Indexer URL**: `https://testnet-idx.algonode.cloud` (TestNet)

#### 2. Contract Config (`frontend/src/config/contract.js`)
- **Default App ID**: `749570296` (fallback if env var not set)
- **Environment Variable**: `REACT_APP_CONTRACT_APP_ID`
- **Status Constants**: Includes `REJECTED: 5`
- **Method Names**: Includes `REJECT_BOUNTY: 'reject_bounty'`

#### 3. Home Page (`frontend/src/pages/Home.js`)
- **Default App ID**: `749570296` (fallback if env var not set)
- **Displays**: Contract App ID on the homepage

### Environment Variables

#### Frontend (`frontend/.env`)
```env
REACT_APP_CONTRACT_APP_ID=749570296
REACT_APP_CONTRACT_ADDRESS=LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_CREATOR_MNEMONIC=your_mnemonic_here
REACT_APP_CREATOR_ADDRESS=your_creator_address_here
```

#### Backend (`backend/.env`)
```env
CONTRACT_APP_ID=749570296
CONTRACT_ADDRESS=LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U
ALGOD_URL=https://testnet-api.algonode.cloud
INDEXER_URL=https://testnet-idx.algonode.cloud
```

#### Contract (`contract.env`)
```env
REACT_APP_CONTRACT_APP_ID=749570296
REACT_APP_CONTRACT_ADDRESS=LCASIZ7SCXLREO5VQDLFPHCHBZXSIENOIVVRMIDLOE3HQZYNV5SBFRS46U
REACT_APP_CREATOR_MNEMONIC=your_mnemonic_here
REACT_APP_CREATOR_ADDRESS=your_creator_address_here
```

### Contract Features

#### Status Constants
- `OPEN: 0` - Bounty is open for acceptance
- `ACCEPTED: 1` - Bounty has been accepted by a freelancer
- `APPROVED: 2` - Bounty work has been approved by verifier
- `CLAIMED: 3` - Bounty payment has been claimed by freelancer
- `REFUNDED: 4` - Bounty has been refunded to client
- `REJECTED: 5` - Bounty work has been rejected by verifier

#### Method Names
- `CREATE_BOUNTY: 'create_bounty'` - Create a new bounty
- `ACCEPT_BOUNTY: 'accept_bounty'` - Accept a bounty as freelancer
- `APPROVE_BOUNTY: 'approve_bounty'` - Approve bounty work (verifier)
- `REJECT_BOUNTY: 'reject_bounty'` - Reject bounty work (verifier)
- `CLAIM_BOUNTY: 'claim'` - Claim bounty payment (freelancer)
- `REFUND_BOUNTY: 'refund'` - Refund bounty to client
- `AUTO_REFUND: 'auto_refund'` - Auto-refund expired bounties

### Box Storage

The contract uses Algorand Box Storage to store bounty data:
- **Box Name Format**: `bounty_` + `Itob(bounty_id)`
- **Box Reference**: Required for all bounty operations
- **Box Creation**: Automatic when creating a bounty
- **Box Access**: Required for accept, approve, reject, claim, refund operations

### Frontend Integration

#### 1. Contract State Loading
- `WalletContext` loads contract state on mount
- Contract state includes `bounty_count` from global state
- Box data is read on-demand for specific bounties

#### 2. Bounty Creation
- Frontend creates payment transaction to contract address
- Frontend creates app call transaction with box reference
- Transactions are grouped and signed together
- After confirmation, frontend fetches updated `bounty_count`

#### 3. Bounty Actions
- All actions (accept, approve, reject, claim, refund) include box references
- Box references are calculated using `createBoxReference(bountyId)`
- Transactions are signed and submitted through Pera Wallet

### Backend Integration

#### 1. Contract Address Usage
- Backend uses `CONTRACT_ADDRESS` for payment transactions
- Backend uses `CONTRACT_APP_ID` for app calls (if needed)
- Contract address is derived from app ID: `algosdk.getApplicationAddress(appId)`

#### 2. Database Sync
- Backend stores bounty data in Supabase
- `contract_id` is nullable (can be set after on-chain creation)
- Status syncs with on-chain state
- Backend updates database after on-chain operations

### Testing

#### 1. Verify Contract Connection
```javascript
// In browser console
const contractUtils = require('./src/utils/contractUtils').default;
const state = await contractUtils.getContractState();
console.log('Contract State:', state);
```

#### 2. Verify Contract App ID
- Check homepage displays correct App ID (749570296)
- Check browser console for contract interactions
- Check network tab for contract calls

#### 3. Verify Box Storage
- Create a bounty and check for box creation
- Verify box references are included in transactions
- Check contract state for `bounty_count` updates

### Troubleshooting

#### Issue: Contract not found
**Solution**: Verify `REACT_APP_CONTRACT_APP_ID` is set correctly in `frontend/.env`

#### Issue: Box reference error
**Solution**: 
1. Verify app account has sufficient ALGO for box storage
2. Run `node scripts/fund_app_account.js` to fund app account
3. Verify box references are included in transactions

#### Issue: Transaction fails
**Solution**:
1. Check Pera Wallet is connected
2. Verify wallet has sufficient ALGO balance
3. Check for pending transactions in Pera Wallet
4. Clear pending state and retry

### Next Steps

1. **Verify Environment Variables**: Ensure all env vars are set correctly
2. **Test Contract Connection**: Create a test bounty to verify connection
3. **Verify Box Storage**: Check that boxes are created correctly
4. **Test All Actions**: Test accept, approve, reject, claim, refund operations
5. **Monitor Contract State**: Check contract state updates correctly

### Resources

- **Contract Info**: `contract-info.json`
- **Contract Deployment**: `scripts/deploy_contract.py`
- **Contract Address Calculator**: `algosdk.getApplicationAddress(appId)`
- **Algorand Explorer**: https://testnet.algoexplorer.io/application/749570296
- **TestNet Faucet**: https://bank.testnet.algorand.network/



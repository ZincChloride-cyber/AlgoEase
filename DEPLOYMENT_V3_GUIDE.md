# AlgoEase Smart Contract V3 - Deployment Guide

## Overview

This guide covers the deployment of the redesigned AlgoEase smart contract V3, which fixes authorization issues and provides a cleaner, more robust escrow system.

## What Changed

### Smart Contract Improvements

1. **Fixed Authorization Rules**
   - Manual refund: Only client or verifier can refund BEFORE deadline
   - Auto refund: Anyone can call AFTER deadline passes
   - Clear separation between manual and automatic refunds

2. **Simplified Architecture**
   - Uses global state instead of box storage (simpler, more reliable)
   - One active bounty at a time (can create new after previous completes)
   - Cleaner state management

3. **Better Error Handling**
   - Clear validation for all operations
   - Proper status checks before operations

### Frontend Updates

1. **Removed bounty_id Parameters**
   - All methods now work with the current active bounty
   - No need to pass bounty_id for accept, approve, claim, refund operations

2. **Updated Contract Utilities**
   - `getCurrentBounty()` now reads from global state
   - Removed box storage related code

## Deployment Steps

### 1. Compile the New Contract

```bash
cd contracts
python algoease_contract_v3_simple.py
```

This will create:
- `algoease_approval_v3.teal`
- `algoease_clear_v3.teal`

### 2. Deploy to TestNet

Set your creator mnemonic as an environment variable:

```bash
# Windows PowerShell
$env:CREATOR_MNEMONIC="your 25-word mnemonic here"

# Linux/Mac
export CREATOR_MNEMONIC="your 25-word mnemonic here"
```

Then deploy:

```bash
node scripts/deploy-v3-contract.js
```

The script will:
- Compile the TEAL programs
- Deploy the contract to TestNet
- Save contract info to `contract-info-v3.json`
- Update frontend `.env` file with new App ID

### 3. Update Frontend Configuration

The deployment script should automatically update `frontend/.env`, but verify it contains:

```env
REACT_APP_CONTRACT_APP_ID=<new_app_id>
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
```

### 4. Restart Frontend

```bash
cd frontend
npm start
```

### 5. Test the Contract

1. Create a new bounty
2. Accept the bounty (as a different user)
3. Approve the bounty (as verifier)
4. Claim the bounty (as freelancer)
5. Test refund functionality

## Contract Methods

### create_bounty
- **Args**: [method, amount, deadline, task_desc]
- **Accounts**: [verifier_addr]
- **Group**: Payment (to contract) + App Call

### accept_bounty
- **Args**: [method]
- **Who**: Any user (except client)
- **Requires**: Status = OPEN, deadline not passed

### approve_bounty
- **Args**: [method]
- **Who**: Verifier only
- **Requires**: Status = ACCEPTED

### claim
- **Args**: [method]
- **Who**: Freelancer only
- **Requires**: Status = APPROVED

### refund
- **Args**: [method]
- **Who**: Client or Verifier
- **Requires**: Status not CLAIMED/REFUNDED, deadline NOT passed

### auto_refund
- **Args**: [method]
- **Who**: Anyone
- **Requires**: Status not CLAIMED/REFUNDED, deadline HAS passed

## Authorization Rules Summary

| Action | Who Can Do It | When |
|--------|---------------|------|
| Create | Anyone | When no active bounty or previous completed |
| Accept | Anyone (except client) | When status = OPEN, before deadline |
| Approve | Verifier only | When status = ACCEPTED |
| Claim | Freelancer only | When status = APPROVED |
| Refund (manual) | Client or Verifier | Before deadline, status not CLAIMED/REFUNDED |
| Auto Refund | Anyone | After deadline, status not CLAIMED/REFUNDED |

## Troubleshooting

### Contract Deployment Fails

- Check that you have enough ALGO in your creator account
- Verify the mnemonic is correct
- Ensure TestNet is accessible

### Frontend Can't Connect to Contract

- Verify `REACT_APP_CONTRACT_APP_ID` is set correctly
- Check that the contract was deployed successfully
- Ensure you're on TestNet (not MainNet)

### Authorization Errors

- Verify the user is the correct role (client/verifier/freelancer)
- Check that the deadline hasn't passed (for manual refund)
- Ensure the bounty status allows the operation

## Migration Notes

### From Old Contract

If you have an old contract deployed:

1. **Don't delete it yet** - users may have active bounties
2. Deploy the new contract alongside it
3. Update frontend to use new contract App ID
4. Old contract will remain functional for existing bounties
5. New bounties will use the new contract

### Database

The backend database doesn't need changes - it stores bounty metadata independently of the contract.

## Files Changed

- `contracts/algoease_contract_v3_simple.py` - New contract source
- `contracts/algoease_approval_v3.teal` - Compiled approval program
- `contracts/algoease_clear_v3.teal` - Compiled clear program
- `scripts/deploy-v3-contract.js` - Deployment script
- `frontend/src/utils/contractUtils.js` - Updated contract utilities
- `frontend/src/contexts/WalletContext.js` - Updated wallet context

## Next Steps

1. Deploy to TestNet and test thoroughly
2. Get community feedback
3. Consider adding multi-bounty support with box storage in future version
4. Deploy to MainNet after testing

## Support

If you encounter issues:
1. Check the contract state using AlgoExplorer
2. Review transaction logs
3. Verify authorization rules match your expectations
4. Check that all parameters are correct


# AlgoEase Contract V4 Deployment Guide

## Overview

Contract V4 implements the escrow flow with explicit address validation:
- **Bounty Creation**: ALGOs go to escrow wallet (contract address)
- **Approve Bounty**: Inner transaction from escrow to freelancer's wallet (requires freelancer address in accounts array)
- **Reject Bounty**: Inner transaction from escrow back to creator's address (requires creator address in accounts array)

## Key Changes from V3

1. **Approve Bounty** now requires freelancer address in `Txn.accounts[0]` and validates it matches the stored freelancer address
2. **Reject Bounty** now requires creator/client address in `Txn.accounts[0]` and validates it matches the stored client address
3. Both functions use inner transactions from the escrow (contract address) to the respective recipients

## Contract Files

- **Source**: `contracts/algoease_contract_v4.py`
- **Compiled Approval**: `contracts/algoease_approval_v4.teal`
- **Compiled Clear**: `contracts/algoease_clear_v4.teal`

## Deployment Steps

### 1. Compile the Contract

```bash
cd contracts
python algoease_contract_v4.py
```

This will generate:
- `algoease_approval_v4.teal`
- `algoease_clear_v4.teal`

### 2. Deploy the Contract

```bash
python deploy_v4.py
```

The deployment script will:
- Deploy the contract to Algorand TestNet
- Get the new App ID and App Address (escrow)
- Update `frontend/.env` with new contract ID and address
- Update `contract.env` with new contract ID and address
- Update `contract-info.json` and `contract-info-v3.json`

### 3. Restart Services

After deployment, restart your frontend and backend servers:

```bash
# Frontend
cd frontend
npm start

# Backend
cd backend
npm start
```

## Frontend Integration

The frontend (`frontend/src/utils/contractUtils.js`) already has the correct implementation:

- **approveBounty()**: Reads freelancer address from bounty box and includes it in accounts array
- **rejectBounty()**: Reads client/creator address from bounty box and includes it in accounts array

Both functions validate the addresses before creating transactions.

## Contract Methods

### create_bounty
- **Group Transaction**: Payment to contract address (escrow) + App call
- **Args**: `[method, amount, deadline, task_desc]`
- **Accounts**: `[verifier_addr]`

### accept_bounty
- **Args**: `[method, bounty_id]`
- **Accounts**: None required

### approve_bounty
- **Args**: `[method, bounty_id]`
- **Accounts**: `[freelancer_addr]` - **REQUIRED** and validated against stored freelancer
- **Inner Transaction**: Escrow → Freelancer

### reject_bounty
- **Args**: `[method, bounty_id]`
- **Accounts**: `[creator_addr]` - **REQUIRED** and validated against stored client
- **Inner Transaction**: Escrow → Creator

### claim_bounty
- **Args**: `[method, bounty_id]`
- **Accounts**: None required

### refund_bounty
- **Args**: `[method, bounty_id]`
- **Accounts**: None required

### auto_refund
- **Args**: `[method, bounty_id]`
- **Accounts**: None required

## Testing

After deployment, test the flow:

1. **Create Bounty**: Verify funds go to escrow (contract address)
2. **Accept Bounty**: Freelancer accepts the bounty
3. **Approve Bounty**: Verifier approves, funds should transfer to freelancer via inner transaction
4. **Reject Bounty**: Verifier rejects, funds should return to creator via inner transaction

## Environment Variables

The deployment script updates:
- `REACT_APP_CONTRACT_APP_ID` - The new contract App ID
- `REACT_APP_CONTRACT_ADDRESS` - The escrow address (contract address)

## Troubleshooting

### Contract ID Mismatch
If you see errors about contract ID mismatch:
1. Check `frontend/.env` has the correct `REACT_APP_CONTRACT_APP_ID`
2. Restart the frontend server
3. Clear browser cache

### Address Validation Errors
If approve/reject fails with address validation:
- Ensure the freelancer/creator address is correctly passed in the accounts array
- Verify the bounty has been accepted (for approve) or exists (for reject)
- Check the bounty box data matches the addresses being passed

## Notes

- The escrow wallet is the contract address itself (`getApplicationAddress(appId)`)
- All funds are held in the contract address until approved or rejected
- Inner transactions are used for all fund transfers from escrow
- Address validation ensures security and prevents incorrect transfers


# Contract Update Summary

## New Contract Deployment

**Date:** November 14, 2025  
**Network:** Algorand TestNet

### New Contract Information
- **App ID:** `749646001`
- **Contract Address:** `L5GY7SCGVI6M7XB4F4HGCBSSKCGQFR33NEBHHP35JKBYDQFP2DX4LQ7A4U`
- **Transaction ID:** `YWDIU3IRMAW6MVZXOIADUZXYKJ6SO3JFIBXJREBMZZHP2D5TAY7A`
- **Deployed At Round:** `57512916`

### Old Contract (Deprecated)
- **Old App ID:** `749599170`
- **Old Contract Address:** `K2M726DQVI23K2N53MCWC7CSTMP7KFD26UP5SVT4255VJK5QAEZXBXDJ6Q`

## Files Updated

### Configuration Files
✅ `contract-info.json` - Updated with new app ID and address  
✅ `contract.env` - Updated with new app ID and address  
✅ `backend/env.example` - Updated with new app ID and address  

### Frontend Files
✅ `frontend/src/config/contract.js` - Updated default app ID  
✅ `frontend/src/utils/contractUtils.js` - Updated default app ID  
✅ `frontend/src/pages/Home.js` - Updated default app ID  

### Backend Files
✅ `backend/routes/bounties.js` - Uses CONTRACT_ADDRESS from env  
✅ `backend/scripts/test-real-bounty.js` - Updated default app ID  

### Scripts
✅ `bounty-cli.py` - Updated default app ID  
✅ `scripts/fund_app_account.js` - Updated default app ID  
✅ `scripts/verify_contract.py` - Updated default app ID  

## Environment Variables

### Frontend (.env)
Create or update `frontend/.env` with:
```env
REACT_APP_CONTRACT_APP_ID=749646001
REACT_APP_CONTRACT_ADDRESS=L5GY7SCGVI6M7XB4F4HGCBSSKCGQFR33NEBHHP35JKBYDQFP2DX4LQ7A4U
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet
REACT_APP_API_URL=http://localhost:5000/api
```

### Backend (.env)
Create or update `backend/.env` with:
```env
CONTRACT_APP_ID=749646001
CONTRACT_ADDRESS=L5GY7SCGVI6M7XB4F4HGCBSSKCGQFR33NEBHHP35JKBYDQFP2DX4LQ7A4U
CONTRACT_CREATOR_ADDRESS=3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI
ALGOD_SERVER=https://testnet-api.algonode.cloud
```

## Next Steps

1. **Restart Services:**
   - Restart your frontend server to pick up new environment variables
   - Restart your backend server to pick up new environment variables

2. **Verify Deployment:**
   - Check contract on AlgoExplorer: https://testnet.algoexplorer.io/application/749646001
   - Verify contract address balance

3. **Test the Contract:**
   - Create a new bounty
   - Accept a bounty as freelancer
   - Approve/reject work as creator

## Contract Features

The new contract includes fixes for:
- ✅ Box size consistency (all status updates use 1-byte representation)
- ✅ Proper payment flow:
  - Create → ALGOs go to escrow
  - Accept → No payment, status update only
  - Approve → ALGOs transfer to freelancer
  - Reject → ALGOs refund to creator

## Notes

- All old contract references have been updated
- The contract is deployed and ready to use
- Make sure to update your `.env` files in both frontend and backend directories


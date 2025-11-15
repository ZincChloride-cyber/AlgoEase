# Refund Stuck Bounty from Transaction

## Transaction Details
- **Transaction ID**: `OB5WS4RU6RAEYGECMTSEMFU74GU5UDEL4F42Q2DKP2ESYXOM74LA`
- **Group ID**: `stH99MvfVKFjNi1lb89FOrLzmu8x7PcQp6LGYBoFga0=`
- **Network**: TESTNET
- **Transaction Type**: Payment

## Quick Refund Solution

### Method 1: Simple Refund Script (Recommended)

This script will check the contract state and refund the stuck bounty:

```powershell
cd "C:\Users\Aditya singh\AlgoEase"
node scripts/refund-stuck-bounty-simple.js
```

The script will:
1. Use the default App ID (749335380) or you can provide one
2. Prompt you for your 25-word mnemonic phrase
3. Check the contract state
4. Verify you are authorized (client or verifier)
5. Refund the bounty if possible

**If you know the App ID:**
```powershell
node scripts/refund-stuck-bounty-simple.js <APP_ID>
```

**With mnemonic as argument:**
```powershell
node scripts/refund-stuck-bounty-simple.js <APP_ID> "your 25 word mnemonic phrase here"
```

### Method 2: Using Transaction ID

If you want to extract the App ID from the transaction:

```powershell
node scripts/refund-from-transaction.js OB5WS4RU6RAEYGECMTSEMFU74GU5UDEL4F42Q2DKP2ESYXOM74LA
```

This script will:
1. Look up the transaction
2. Extract the App ID from the transaction
3. Check the contract state
4. Refund the bounty

### Method 3: Manual Refund (Using Existing Script)

If you already know the App ID is 749335380:

```powershell
node scripts/refund-bounty.js "your 25 word mnemonic phrase here" 749335380
```

## Finding the App ID

If you're not sure about the App ID:

1. **Check the transaction on Pera Explorer:**
   - Go to: https://testnet.explorer.perawallet.app/tx/OB5WS4RU6RAEYGECMTSEMFU74GU5UDEL4F42Q2DKP2ESYXOM74LA
   - Look for the "Application Call" transaction in the group
   - The App ID will be shown there

2. **Check your contract configuration:**
   - Look in `frontend/src/config/contract.js` or environment variables
   - Check `REACT_APP_CONTRACT_APP_ID` environment variable

3. **Use the default:**
   - The default App ID used in scripts is `749335380`

## What Happens During Refund

1. ✅ Script checks contract state
2. ✅ Verifies you are authorized (client or verifier)
3. ✅ Creates a refund transaction
4. ✅ Signs and submits to blockchain
5. ✅ Waits for confirmation
6. ✅ Shows refunded amount and transaction link

## Authorization Requirements

- **Manual Refund**: Only the **client** or **verifier** can refund before deadline
- **Auto Refund**: Anyone can trigger if deadline has passed

## Troubleshooting

### "You are not authorized"
- Make sure you're using the mnemonic for the wallet that created the bounty
- Check that you are the client or verifier address

### "Contract not found"
- Verify the App ID is correct
- Make sure you're on the TESTNET network

### "Bounty already refunded/claimed"
- The bounty has already been resolved
- You can create a new bounty now

### "No active bounty found"
- The contract has no funds locked
- You can create a new bounty

## After Refund

Once the refund is successful:
- ✅ Funds will be returned to the client address
- ✅ Contract state will be reset
- ✅ You can create new bounties

## View Transaction

After refund, view the transaction on:
- **Pera Explorer**: https://testnet.explorer.perawallet.app/tx/{TX_ID}
- **AlgoExplorer**: https://testnet.algoexplorer.io/tx/{TX_ID}


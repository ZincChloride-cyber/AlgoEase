# Complete Fix Guide - Transaction Issues

## Problem 1: Stuck Bounty Blocking New Bounties

### Current State:
- **Status**: OPEN (0)
- **Amount**: 2 ALGO locked
- **Solution**: Must refund this bounty first

### Quick Fix (Option 1): Use Command Line

1. Open `scripts/quick-refund.js`
2. Replace `once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place` with your actual 25-word mnemonic
3. Run:
```powershell
cd "c:\Users\Aditya singh\AlgoEase"
node scripts\quick-refund.js
```

### Quick Fix (Option 2): Use Frontend

The frontend has a "Refund stuck bounty" button on the Create Bounty page. However, if Pera Wallet isn't showing transactions, use Option 1 or Option 3.

### Quick Fix (Option 3): Use goal CLI (if you have Algorand node)

```bash
goal app call --app-id 749335380 --app-arg "str:refund" --from YOUR_ADDRESS
```

## Problem 2: Pera Wallet Not Showing Transactions

This is caused by several possible issues:

### Issue 1: Transaction Format
Pera Wallet expects transactions in a specific format. The current code might not be formatting them correctly.

### Issue 2: Deep Link Not Opening
If you're on desktop, Pera Wallet deep links don't always work. Solutions:
1. Use Pera Wallet Web (https://web.perawallet.app)
2. Use WalletConnect QR code
3. Use Pera Wallet browser extension

### Issue 3: Pending Transaction State
If a previous transaction failed, the app thinks there's still a pending transaction.

## Solution: Fix the Wallet Integration

I'll create fixes for:
1. Transaction formatting for Pera Wallet
2. Better error handling
3. Clear pending state properly

## Problem 3: Contract Only Allows One Bounty

The current smart contract is designed to only handle ONE bounty at a time. This is by design, not a bug.

### To Allow Multiple Bounties:

You need to redeploy a NEW contract with a different architecture:

**Option A: Local State (Simple)**
- Each user can have their own bounty
- Uses local storage per account
- Requires users to opt-in to the contract

**Option B: Box Storage (Advanced)**  
- Store multiple bounties in boxes
- Each bounty gets a unique ID
- More complex but more flexible
- Requires Algorand AVM 8+

**Option C: Multiple Contract Instances**
- Deploy a new contract for each bounty
- Simplest approach
- Each bounty is completely independent

## Recommended Immediate Actions:

1. **Refund the stuck bounty** using Option 1 (quickrefund.js)
2. **Test with new bounty** - should work after refund
3. **If transactions still don't show**: Check browser console for errors
4. **Long-term**: Decide if you want multiple bounties and redeploy contract

## Testing the Fix:

After running quick-refund.js, you should see:
```
✅ SUCCESS! Transaction confirmed
💰 Refunded 2 ALGO to your wallet
🎉 You can now create new bounties!
```

Then try creating a new bounty. It should work!

## If Pera Wallet Still Doesn't Show Transactions:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try creating a bounty
4. Look for errors
5. Share the errors for further debugging

The most common issues are:
- WalletConnect session expired
- Browser blocking popups/redirects  
- Pera Wallet app not installed/updated
- Network issues

# Bounty Creation Fix - Issue Resolved ✅

## Problem Summary
When creating a bounty, the transaction was failing with error:
```
logic eval error: assert failed pc=475
Details: app=749335380, pc=475, opcodes=intc_0 // 1; >=; assert
```

## Root Cause
The smart contract requires **at least 1 account** to be passed in the `accounts` array (to specify the verifier), but the frontend was sending an **empty accounts array** when the sender was also the verifier.

### Technical Details

**Smart Contract Code (TEAL):**
```teal
txn NumAccounts
int 1
>=
assert
```

This assertion at PC ~360 checks that `NumAccounts >= 1` and **fails** if the accounts array is empty.

**Frontend Code (Before Fix):**
```javascript
// ❌ OLD CODE - Would send empty array if sender === verifier
const foreignAccounts = finalVerifier !== sender ? [finalVerifier] : [];
```

**Result:** When creating a bounty where you are also the verifier (common case), `foreignAccounts` would be `[]`, causing the smart contract to reject the transaction.

## Solution Applied

**Updated Frontend Code:**
```javascript
// ✅ NEW CODE - Always pass verifier, even if it's the sender
const foreignAccounts = [finalVerifier];
```

### Why This Works
1. The smart contract **requires** `NumAccounts >= 1`
2. The contract uses `Txn.accounts[0]` as the verifier address
3. Even if the sender is the verifier, we must pass it in the accounts array
4. This satisfies the smart contract's requirements

## Files Modified
- ✅ `frontend/src/utils/contractUtils.js` - Line 237

## Testing Instructions

### Test Case 1: Create Bounty (Self as Verifier)
```javascript
1. Connect wallet
2. Navigate to "Create Bounty"
3. Fill in bounty details
4. Leave verifier blank or enter your own address
5. Click "Create Bounty"
6. Approve transaction in Pera Wallet

Expected: ✅ Transaction succeeds
Previous: ❌ Failed with "assert failed pc=475"
```

### Test Case 2: Create Bounty (Different Verifier)
```javascript
1. Connect wallet
2. Navigate to "Create Bounty"
3. Fill in bounty details
4. Enter a different address as verifier
5. Click "Create Bounty"
6. Approve transaction in Pera Wallet

Expected: ✅ Transaction succeeds
Previous: ✅ Already worked
```

## Verification

Run the following to verify the fix:
```bash
# Navigate to frontend
cd frontend

# Build the project
npm run build

# Start dev server
npm start
```

Then test bounty creation in the UI.

## Additional Notes

### Why Was This Happening?
The original code assumed that if `sender === verifier`, the smart contract would use `Txn.sender()` as the verifier. However, the TEAL code checks `NumAccounts >= 1` **before** that logic, making an empty accounts array invalid.

### Smart Contract Logic
```python
# PyTeal code from the contract
verifier.store(
    If(Txn.accounts.length() > Int(0), Txn.accounts[0], Txn.sender())
)
```

This means:
- If accounts array has items: Use `accounts[0]`
- If accounts array is empty: Use sender

**BUT** the TEAL code has an assertion that requires at least 1 account **before** this logic runs!

### The Fix
Always pass the verifier in the accounts array. This:
1. ✅ Satisfies the `NumAccounts >= 1` assertion
2. ✅ Works when sender === verifier
3. ✅ Works when sender !== verifier
4. ✅ Is clearer and more explicit

## Status
🟢 **FIXED** - Ready for testing

## Date
November 11, 2025

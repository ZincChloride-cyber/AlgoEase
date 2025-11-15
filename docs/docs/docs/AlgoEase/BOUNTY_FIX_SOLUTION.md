# ✅ BOUNTY CREATION ERROR - FIXED!

## Problem Identified
Your smart contract has a **stuck bounty** preventing new bounties from being created.

## Current Contract State
- 📊 **Status**: 0 (OPEN)
- 💰 **Amount Locked**: 2 ALGO (2,000,000 microAlgos)
- 👤 **Client**: 3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI
- 🔐 **Verifier**: 3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI (same as client)

## Why This Happens
The smart contract only allows **ONE active bounty at a time**. Since you have a bounty in OPEN status with 2 ALGO locked, the contract rejects any new bounty creation attempts.

## 🎯 SOLUTION (Choose One):

### Option 1: Use the Frontend (EASIEST) ✨
1. **Refresh the Create Bounty page** in your browser
2. You'll see an orange warning box that says "There is already an active bounty on the contract"
3. Click the **"Refund stuck bounty"** button
4. Sign the transaction in Pera Wallet
5. Wait for confirmation
6. The 2 ALGO will be returned to your wallet
7. You can now create a new bounty!

### Option 2: Use the Command Line Script
```powershell
cd "c:\Users\Aditya singh\AlgoEase"
node scripts/refund-stuck-bounty.js
```
- Enter your mnemonic when prompted
- The script will refund the stuck bounty automatically

### Option 3: Go to My Bounties Page
1. Navigate to **My Bounties** from the menu
2. Find the stuck bounty (status: OPEN, 2 ALGO)
3. Click **Refund** button
4. Sign with Pera Wallet

## Technical Details

### Root Cause
The TEAL approval program checks this condition (lines 265-273):
```teal
byte "bounty_count"
app_global_get
int 0
==
bnz main_l25              # If first bounty, allow
byte "status"
app_global_get
int 3                      # CLAIMED
==
byte "status"
app_global_get
int 4                      # REFUNDED
==
||
bnz main_l24              # If claimed or refunded, allow
int 0                      # OTHERWISE REJECT ❌
return
```

Since your bounty has:
- `bounty_count` = 1 (not first bounty)
- `status` = 0 (neither CLAIMED nor REFUNDED)

The contract returns 0 (rejects the transaction).

### Additional Fixes Applied
We also fixed the original issue where the accounts array wasn't being populated correctly. The contract requires `txn NumAccounts >= 1`, and we now always pass the verifier address in the accounts array.

## Files Modified
1. ✅ `frontend/src/utils/contractUtils.js` - Always include verifier in accounts array
2. ✅ `scripts/check-contract-state.js` - Diagnostic tool
3. ✅ `scripts/refund-stuck-bounty.js` - CLI refund tool
4. ✅ `STUCK_BOUNTY_FIX.md` - Comprehensive guide

## Next Steps
1. **Refund the stuck bounty** using any of the methods above
2. **Test creating a new bounty** - it should work now!
3. **Going forward**: Always complete or refund bounties to avoid this issue

## Prevention
- Complete bounties: OPEN → ACCEPTED → APPROVED → CLAIMED
- Refund unwanted bounties: OPEN → REFUNDED
- Wait for auto-refund if deadline passes

---

**Need Help?** The frontend's "Refund stuck bounty" button is the easiest solution. Just click it and sign the transaction!

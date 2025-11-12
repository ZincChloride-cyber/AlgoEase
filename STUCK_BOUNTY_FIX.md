# Stuck Bounty Resolution Guide

## Problem
The contract has a stuck bounty that prevents creating new bounties.

## Current State
- **Status**: 0 (OPEN)
- **Amount**: 2,000,000 microAlgos (2 ALGO)
- **Bounty Count**: 1
- **Client Address**: `3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI`
- **Verifier Address**: `3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI`
- **Deadline**: 1763052840 (Unix timestamp)

## Solution Options

### Option 1: Refund the Stuck Bounty (Recommended)
Since you are the client AND verifier, you can refund the bounty:

1. Run the refund script:
   ```powershell
   cd "c:\Users\Aditya singh\AlgoEase"
   node scripts/refund-stuck-bounty.js
   ```

2. Enter your mnemonic phrase when prompted

3. The script will refund the 2 ALGO to your account

### Option 2: Use the Frontend to Refund
1. Go to "My Bounties" page
2. Find the stuck bounty
3. Click "Refund" button
4. Sign the transaction with Pera Wallet

### Option 3: Wait for Auto-Refund
If the deadline has passed, anyone can trigger an auto-refund:
- Current deadline: Unix timestamp 1763052840
- This translates to a future date, so auto-refund is not yet available

### Option 4: Accept and Complete the Bounty
If this is a real bounty you want to complete:
1. Have a freelancer accept it
2. Complete the work
3. Approve it as verifier
4. Claim the funds as freelancer

## Why This Happened
The smart contract only allows ONE active bounty at a time. The current bounty is in OPEN status with funds locked, which prevents creating new bounties.

The contract's `ensure_no_active_bounty()` function checks:
- If amount is 0, OR
- If status is CLAIMED (3), OR
- If status is REFUNDED (4)

If none of these conditions are met, new bounty creation is rejected.

## Prevention
After this is fixed, always make sure to either:
1. Complete bounties (accept → approve → claim), OR
2. Refund bounties if no longer needed, OR
3. Wait for auto-refund after deadline

## Technical Details
The error occurs at PC 269-273 in the TEAL code:
```teal
byte "status"
app_global_get
int 3           // CLAIMED
==
byte "status"
app_global_get
int 4           // REFUNDED
==
||
bnz main_l24    // If claimed or refunded, allow new bounty
int 0           // Otherwise, reject (this is what's happening)
return
```

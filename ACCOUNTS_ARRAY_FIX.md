# Accounts Array Fix for Inner Transactions

## Problem
When approving a bounty, the transaction was failing with the error:
```
TransactionPool.Remember: transaction 2ROMFU7YXXIC2BPVDVVJDAXKQH5CJAGJBLY2YA6E4TTMSRUGRYYQ: 
logic eval error: unavailable Account SOCQWOJTR5R3PDRVKGQZHSTC33SBK6NKMWIU6INGD3GRNIOEH7Q63IAURM. 
Details: app=749648617, pc=944, opcodes=itxn_field Sender; load 13; itxn_field Receiver
```

## Root Cause
The Algorand smart contract uses **inner transactions** to transfer funds. When the contract executes an inner transaction to send ALGOs to an address, that address must be included in the **accounts array** of the outer transaction.

In the TEAL code at `main_l19` (approve_bounty):
```teal
load 11
extract 32 32
store 13   # Load freelancer address from bounty box (bytes 32-64)
...
itxn_begin
int pay
itxn_field TypeEnum
global CurrentApplicationAddress
itxn_field Sender
load 13   # Freelancer address
itxn_field Receiver  # ERROR: This address must be in the accounts array!
```

The contract tries to send payment to the freelancer (loaded from box storage), but the freelancer's address wasn't being passed in the transaction's accounts array.

## Solution
Updated all transaction functions to properly include the required addresses in the accounts array:

### 1. `approveBounty()` - Fixed ✅
- Reads freelancer address from bounty box storage
- Validates the address exists and is valid
- Includes freelancer address as the first element in accounts array
- Transaction now succeeds when transferring funds from escrow to freelancer

### 2. `rejectBounty()` - Fixed ✅
- Reads client address from bounty box storage
- Validates the address exists and is valid
- Includes client address in accounts array
- Transaction can now refund ALGOs to the client

### 3. `claimBounty()` - Fixed ✅
- Reads freelancer address from bounty box storage
- Validates the address exists and is valid
- Includes freelancer address in accounts array
- Freelancer can now claim their approved payment

### 4. `refundBounty()` - Fixed ✅
- Reads client address from bounty box storage
- Validates the address exists and is valid
- Includes client address in accounts array
- Client can now receive refund properly

## Key Changes

### Before (Broken)
```javascript
const accounts = [];
if (freelancerAddress) {
  accounts.push(freelancerAddress);
} else {
  console.warn('WARNING: No freelancer address found. Transaction may fail.');
}
```

### After (Fixed)
```javascript
// CRITICAL: Get freelancer address from bounty box
let freelancerAddress = null;
try {
  const bountyData = await this.getBountyFromBox(bountyId);
  if (bountyData && bountyData.freelancerAddress) {
    freelancerAddress = bountyData.freelancerAddress;
  } else {
    throw new Error('Bounty has not been accepted yet. The freelancer address is required.');
  }
} catch (boxError) {
  throw new Error(`Failed to read bounty data: ${boxError.message}`);
}

// CRITICAL: Validate freelancer address
if (!freelancerAddress || !algosdk.isValidAddress(freelancerAddress)) {
  throw new Error('Invalid or missing freelancer address.');
}

// Create accounts array - MUST include freelancer address for inner transaction
const accounts = [freelancerAddress];
```

## Why This Works

In Algorand smart contracts:
1. **Outer transaction**: The application call transaction sent by the user
2. **Inner transaction**: A transaction created and executed by the smart contract itself

When a smart contract creates an inner transaction:
- The inner transaction can send funds **FROM** the contract's escrow account
- The inner transaction can send funds **TO** any address in the outer transaction's accounts array
- If the recipient address is not in the accounts array, the transaction fails with "unavailable Account"

## Testing
To test the fix:
1. Create a bounty (client sends funds to escrow)
2. Accept the bounty (freelancer becomes assigned)
3. Approve the work (client/verifier triggers payment)
4. The smart contract should now successfully transfer funds from escrow to freelancer's account

## Important Notes
- The accounts array in Algorand transactions is 0-indexed
- The contract accesses accounts via `txna Accounts 0`, `txna Accounts 1`, etc.
- The sender is implicitly at index -1, so the first account in the array is at index 0
- All addresses used in inner transactions MUST be in the accounts array of the outer transaction

## Files Modified
- `frontend/src/utils/contractUtils.js`
  - `approveBounty()` - Added freelancer to accounts array
  - `rejectBounty()` - Added client to accounts array
  - `claimBounty()` - Added freelancer to accounts array
  - `refundBounty()` - Added client to accounts array

## Status
✅ **FIXED** - All transaction functions now properly include required addresses in the accounts array.

# Fix for "Invalid Box Reference" Error

## Problem
When creating a bounty, you get the error:
```
invalid Box reference 0x626f756e74795f0000000000000000
```

This error occurs because:
1. The contract uses box storage to store bounty data
2. Box storage requires the app account to have sufficient balance
3. Box references must be correctly specified in the transaction

## Solution

### 1. Fund the Application Account

The application account needs ALGO to pay for box storage. Box storage costs:
- Base: 2,500 microALGO per box
- Additional: 400 microALGO per 128 bytes of box data

For a typical bounty box (~150 bytes), you need approximately **3,000 microALGO (0.003 ALGO)** per box.

**To fund the app account:**
1. Get the application address from `contract.env` or `contract-info.json`
2. Send at least 0.01 ALGO to the application address
3. This will cover multiple box creations

### 2. Box Reference Format

The box reference format is correct in the code:
```javascript
{
  appIndex: this.appId,
  name: boxNameBytes  // Uint8Array of "bounty_" + Itob(bounty_id)
}
```

### 3. Updated Code

The code has been updated to:
- Get the current `bounty_count` from the contract state
- Calculate the box name for the new bounty
- Include the box reference in the transaction

## Testing

After funding the app account:
1. Try creating a bounty again
2. The transaction should succeed
3. Verify the box was created by checking the contract state

## Verification

To verify the app account has funds:
```javascript
const appAddress = algosdk.getApplicationAddress(APP_ID);
const accountInfo = await algodClient.accountInformation(appAddress).do();
console.log('App account balance:', accountInfo.amount / 1000000, 'ALGO');
```

## Next Steps

1. Fund the application account with at least 0.01 ALGO
2. Try creating a bounty again
3. If it still fails, check the browser console for detailed error messages


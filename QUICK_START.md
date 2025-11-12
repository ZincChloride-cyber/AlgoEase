# 🚀 Quick Start - Fix Everything Now

Run these commands in order:

## 1. First, refund the stuck bounty

```powershell
# IMPORTANT: First edit scripts/quick-refund.js and add your 25-word mnemonic!
# Then run:
cd "c:\Users\Aditya singh\AlgoEase"
node scripts\quick-refund.js
```

Expected output:
```
✅ SUCCESS! Transaction confirmed
💰 Refunded 2 ALGO to your wallet
```

## 2. Rebuild the frontend with fixes

```powershell
cd frontend
npm run build
```

## 3. Start the development server

```powershell
npm start
```

The app will open at http://localhost:3000 (or another port if 3000 is busy)

## 4. Test the fixes

1. Go to **Create Bounty** page
2. Look for the new **"Wallet Diagnostics"** panel in the sidebar
3. Click **"Run Tests"** - you should see all green checkmarks ✅
4. Fill in the bounty form:
   - Title: "Test Bounty"
   - Description: "Testing the fix"  
   - Amount: 1 ALGO
   - Deadline: Tomorrow's date
   - Verifier: Leave blank (will use your address)
5. Click **"Create Bounty"**
6. **Pera Wallet should open** asking you to sign 2 transactions

## 5. If Pera Wallet doesn't open

### Desktop Users:
Pera Wallet deep links don't work well on desktop. Try:
- Use **Pera Wallet Web**: https://web.perawallet.app
- OR scan QR code with mobile app (if using WalletConnect)
- OR use mobile browser

### Mobile Users:
- Make sure Pera Wallet app is installed
- Allow the browser to open external apps
- If prompted, choose "Always open with Pera Wallet"

## 6. Check the browser console

Press **F12** and go to **Console** tab. You should see:
```
Creating bounty with verifier: YOUR_ADDRESS
Creating bounty transaction with: {...}
Signing transaction group with 2 transactions
Prepared transaction group for signing: {...}
```

If you see errors, copy them and share for debugging.

## 7. Still not working?

Click the **"Clear Wallet Session & Reconnect"** button in the Wallet Diagnostics panel, then try again.

---

## What Was Fixed

### Issue #1: Stuck Bounty ✅
- Contract had an OPEN bounty with 2 ALGO locked
- This blocked creating new bounties  
- Solution: Refund script to return the funds

### Issue #2: Pera Wallet Not Opening ✅
- Transaction format wasn't compatible with Pera Wallet v1.3+
- Fixed transaction object formatting in WalletContext.js
- Added proper error handling and logging
- Created diagnostic tool to troubleshoot issues

### Issue #3: Multiple Bounties ℹ️
- Contract is designed for ONE bounty at a time (by design)
- To support multiple bounties, need to redeploy new contract
- For now: Complete or refund each bounty before creating a new one

---

## Need Help?

If something doesn't work:
1. Run the diagnostics (click "Run Tests" button)
2. Check browser console (F12) for errors
3. Try clearing wallet session
4. Share the error messages

The refund script is the most critical step - once that's done, everything else should work!

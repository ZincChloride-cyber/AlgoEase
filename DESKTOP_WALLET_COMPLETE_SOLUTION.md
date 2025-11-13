# 🚨 DESKTOP PERA WALLET ISSUE - COMPLETE SOLUTION

## ❌ Current Problem

**You're stuck at "Waiting for wallet signature" with no transaction appearing in Pera Wallet.**

### Why This Happens:
1. You're on a **desktop browser** (Windows/Mac/Linux)
2. Pera Wallet Connect SDK tries to use **mobile deep links** (`algorand://`)
3. Desktop browsers **cannot handle** these deep links
4. The transaction request goes nowhere - it's waiting for a mobile app that will never open
5. You see "Plugged In" modal asking to launch on iOS/Android (which you don't have)

## ✅ THE SOLUTION: Use Pera Wallet Web

### Step 1: Open Pera Wallet Web
1. Open a **new browser tab**
2. Go to: **https://web.perawallet.app**
3. Click "Connect Wallet"
4. Choose your account and connect

### Step 2: Keep It Open
- **DO NOT CLOSE** the Pera Wallet Web tab
- Keep it in the background
- Transactions will appear there

### Step 3: Create Your Bounty
1. Return to your AlgoEase tab (localhost:3002)
2. Fill out the bounty form
3. Click "Deploy Bounty"
4. The desktop helper modal will appear - click **"Try Deep Link Anyway"**
   - (I know it says "try anyway" but actually we need the web wallet open)

### Step 4: Sign in Pera Wallet Web
1. When "Waiting for wallet signature" appears in AlgoEase
2. **Switch to your Pera Wallet Web tab**
3. You should see a transaction request notification
4. Review and **approve** the transaction
5. Switch back to AlgoEase - it will detect the signature!

---

## 🔧 Alternative Solutions

### Solution 2: Use Mobile Device
If you have a smartphone/tablet:
1. Open AlgoEase on your **mobile browser**
2. Make sure **Pera Wallet app** is installed on that device
3. Create your bounty on mobile
4. The app will open automatically (deep links work on mobile!)
5. Sign the transaction in the app

### Solution 3: QR Code (May Not Always Work)
Sometimes Pera Wallet shows a QR code:
1. If you see "Plugged In" modal with a QR code
2. Open Pera Wallet app on your phone
3. Go to Settings → WalletConnect → Scan QR
4. Scan the QR code on your desktop screen
5. Approve the transaction on mobile

---

## 🤔 Why Can't We Fix This in Code?

### Technical Limitations:
1. **Pera Wallet Connect SDK architecture**
   - The SDK uses WalletConnect v1 protocol
   - On desktop, it defaults to deep links (not QR codes)
   - There's no API to force QR code mode

2. **Browser Security**
   - Browsers block `algorand://` protocol handlers for security
   - Only mobile apps can register these handlers
   - No way to detect if Pera desktop app is installed

3. **SDK Design Philosophy**
   - Pera Wallet Connect assumes mobile-first usage
   - Desktop support is secondary
   - They expect users to use Pera Wallet Web

### What We've Done:
- ✅ Added detection for desktop users
- ✅ Show warning modal before signing
- ✅ Provide clear instructions to use Web Wallet
- ✅ Added "Open Pera Wallet Web" buttons
- ✅ Improved error messages and logging

---

## 📊 Troubleshooting Guide

### Problem: Pera Wallet Web doesn't show transaction
**Solution:**
1. Make sure you're connected to the **same account** in both:
   - AlgoEase (click your address to see)
   - Pera Wallet Web
2. Refresh the Pera Wallet Web tab
3. Check the notifications icon in Pera Wallet Web
4. Try disconnecting and reconnecting in Pera Wallet Web

### Problem: "Transaction signing was cancelled"
**Solution:**
1. You clicked "Cancel" in the transaction modal
2. Just try creating the bounty again
3. This time approve it in Pera Wallet Web

### Problem: Transaction hangs forever
**Solution:**
1. **Close the "Creating Bounty" modal** in AlgoEase
2. Refresh the AlgoEase page (Ctrl + Shift + R)
3. Make sure Pera Wallet Web is open and connected
4. Try again

### Problem: "Pending transaction" error
**Solution:**
1. Look for the yellow warning box on Create Bounty page
2. Click **"Clear Pending State"** button
3. Try creating bounty again

---

## 🎯 Step-by-Step Video Tutorial Flow

### Setup Phase:
1. **Open two browser tabs:**
   - Tab 1: `localhost:3002` (AlgoEase)
   - Tab 2: `https://web.perawallet.app` (Pera Wallet Web)

2. **Connect in Pera Wallet Web:**
   - Click "Connect Wallet"
   - Select your account
   - Keep this tab open!

3. **Connect in AlgoEase:**
   - Click "Connect Wallet" button (top right)
   - Choose "Pera Wallet"
   - If it asks, approve the connection

### Create Bounty Phase:
1. **In AlgoEase tab:**
   - Go to "Create Bounty" page
   - Fill out the form:
     - Title: "Test Bounty"
     - Description: "Testing the desktop wallet fix"
     - Amount: 1 ALGO
     - Deadline: Tomorrow's date
     - Verifier: (leave empty to use your address)
   - Click **"Deploy Bounty"**

2. **Desktop Helper Modal appears:**
   - Read the options
   - Click **"Try Deep Link Anyway"** (we have web wallet ready!)

3. **Creating Bounty Modal appears:**
   - ✅ Preparing transaction
   - ⏳ Waiting for wallet signature <- **YOU ARE HERE**

4. **Switch to Pera Wallet Web tab:**
   - Look for notification bell icon (top right)
   - OR look for transaction approval popup
   - You should see:
     - "Transaction Request"
     - Amount: 1 ALGO payment + app call
     - From: Your address
     - To: Contract address

5. **Review and Approve:**
   - Check transaction details
   - Click **"Approve"** button
   - Wait for confirmation (~4 seconds)

6. **Switch back to AlgoEase:**
   - Modal should update automatically:
   - ✅ Preparing transaction
   - ✅ Waiting for wallet signature
   - ⏳ Submitting to blockchain
   - ⏳ Confirming transaction
   - ⏳ Saving to database
   - ✅ **Bounty created successfully!**

---

## 📝 Quick Reference Card

| Situation | Action |
|-----------|--------|
| On desktop computer | Use Pera Wallet Web (web.perawallet.app) |
| On mobile phone/tablet | Use Pera Wallet mobile app |
| Stuck at "Waiting for signature" | Check Pera Wallet Web tab |
| "Plugged In" modal appears | Ignore it - use Pera Wallet Web instead |
| Transaction doesn't appear | Refresh Pera Wallet Web |
| "Pending transaction" error | Click "Clear Pending State" button |
| Want to test if working | Use "Test Pera Wallet Signing" button |

---

## 🆘 Still Not Working?

### Final Checklist:
- [ ] Pera Wallet Web tab is open
- [ ] Connected to same account in both tabs
- [ ] Account has enough ALGO (>1.2 ALGO for 1 ALGO bounty)
- [ ] Not behind corporate firewall blocking WalletConnect
- [ ] Browser allows pop-ups from localhost
- [ ] No browser extensions blocking requests

### Get Help:
1. Open browser console (F12 → Console)
2. Look for errors (red text)
3. Take a screenshot
4. Share in support channel with:
   - Browser name and version
   - Operating system
   - Console errors
   - Steps you tried

---

**Last Updated:** November 11, 2025  
**Status:** Active Issue - Workaround Available  
**Fix:** Use Pera Wallet Web for desktop users

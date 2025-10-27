# 🎯 AlgoEase Smart Contract Explained

## Overview
Your smart contract implements a **trustless escrow system** for bounties on Algorand blockchain.

## How It Works

### 1️⃣ **Create Bounty** (Client)
```
Client → Send ALGO → Smart Contract (Escrow)
```
- You create a bounty with a reward amount
- Your ALGO is sent to the smart contract address (escrow)
- Contract stores: amount, deadline, task description, verifier
- Status: **OPEN**

**Key Point:** Your money is now locked in the contract, safe and transparent!

### 2️⃣ **Accept Bounty** (Freelancer/Winner)
```
Freelancer → Accept → Contract records freelancer address
```
- Someone sees your bounty and accepts it
- Contract stores their address as the freelancer
- Status: **ACCEPTED**

### 3️⃣ **Approve Work** (Verifier - You or designated person)
```
Verifier → Approve → Contract marks work as approved
```
- You (or verifier) check the completed work
- If satisfied, approve it in the contract
- Status: **APPROVED**

### 4️⃣ **Claim Payment** (Freelancer/Winner)
```
Contract → Send ALGO → Freelancer
```
- Freelancer can now claim the reward
- Contract automatically sends the ALGO to freelancer
- Status: **CLAIMED** ✅

### 5️⃣ **Refund Scenario** (No Winner)
```
Contract → Send ALGO back → Client (You)
```
Two ways to get refund:
- **Manual Refund:** You or verifier can refund at any time
- **Auto Refund:** After deadline passes, anyone can trigger refund

Status: **REFUNDED** 🔄

---

## Smart Contract State

The contract stores:
- `bounty_count`: Total bounties created
- `client_addr`: Who created the bounty (you)
- `freelancer_addr`: Who accepted it
- `amount`: Reward in microALGOs
- `deadline`: Unix timestamp
- `status`: Current state (0-4)
- `task_desc`: What needs to be done
- `verifier_addr`: Who approves the work

---

## Security Features ✅

1. **Trustless:** No middleman needed, code executes automatically
2. **Transparent:** Anyone can verify the contract on blockchain
3. **Escrow Protection:** Funds locked until conditions met
4. **Deadline Protection:** Auto-refund if time runs out
5. **Verifier Control:** Only authorized person can approve

---

## Example Lifecycle

```
Day 1: Alice creates $100 bounty for "Build a website"
       → $100 locked in escrow

Day 2: Bob accepts the bounty
       → Bob's address recorded

Day 5: Bob submits completed website
       → Alice reviews it

Day 6: Alice approves the work
       → Bob can now claim payment

Day 7: Bob claims the reward
       → $100 sent to Bob automatically
```

### Alternative: No Winner Scenario

```
Day 1: Alice creates $100 bounty, deadline = Day 10
Day 10: No one completed it, deadline passed
Day 11: Alice (or anyone) triggers auto-refund
        → $100 returned to Alice
```

---

## Testing Your Contract

### On TestNet (Current Deployment)
- **App ID:** 748433709
- **Network:** Algorand TestNet
- **Explorer:** https://testnet.algoexplorer.io/application/748433709

### Locally (Sandbox)
- Network: http://localhost:4001
- Requires: Docker Desktop running
- Fast testing without real funds

---

## Frontend Integration

Your frontend (`http://localhost:3000`) connects to the contract and provides:
- ✅ Wallet connection (Pera, Lute)
- ✅ Create bounty form
- ✅ View bounties
- ✅ Accept bounties
- ✅ Approve work
- ✅ Claim payments
- ✅ Request refunds

---

## Code Location

- **Smart Contract:** `contracts/algoease_contract.py`
- **Compiled TEAL:** `contracts/algoease_approval.teal` & `algoease_clear.teal`
- **Frontend Utils:** `frontend/src/utils/contractUtils.js`
- **Wallet Context:** `frontend/src/contexts/WalletContext.js`

---

## The Fix We Just Made

**Problem:** Transaction rejected with "transaction rejected by ApprovalProgram"

**Root Cause:** Contract checked for 1 account but tried to access the 2nd account (index 1)

```python
# Before (BUG):
Assert(Txn.accounts.length() >= Int(1))
App.globalPut(VERIFIER_ADDR, Txn.accounts[1])  # ❌ Out of bounds!

# After (FIXED):
Assert(Txn.accounts.length() >= Int(2))  # ✅ Now checks for 2 accounts
App.globalPut(VERIFIER_ADDR, Txn.accounts[1])  # ✅ Safe access
```

This is why your bounty creation now works!

---

## Next Steps

1. **Test on TestNet:** Create a bounty at http://localhost:3000
2. **Or Setup Local:** Wait for Docker, then deploy to sandbox
3. **Full Test:** Create → Accept → Approve → Claim cycle

**Your contract is ready to use! 🚀**


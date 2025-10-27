#!/usr/bin/env python3
"""
🚀 COMPLETE TESTNET DEPLOYMENT - AlgoEase Smart Contract
This script deploys your contract to Algorand TestNet
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import base64
import time
import algosdk

print("\n" + "=" * 80)
print("🚀 DEPLOYING ALGOEASE SMART CONTRACT TO ALGORAND TESTNET")
print("=" * 80)

# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Initialize client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

print("\n📝 STEP 1: CREATE DEPLOYMENT ACCOUNT")
print("-" * 80)

# Generate new account for deployment
private_key, address = account.generate_account()
mnemonic_phrase = mnemonic.from_private_key(private_key)

print(f"✅ Account created!")
print(f"   Address: {address}")
print(f"   Mnemonic: {mnemonic_phrase}")

# Check balance
def get_balance(addr):
    try:
        info = algod_client.account_info(addr)
        return info['amount'] / 1_000_000
    except:
        return 0

balance = get_balance(address)
print(f"\n💳 Current balance: {balance} ALGO")

if balance < 2:
    print("\n" + "=" * 80)
    print("💰 STEP 2: FUND YOUR ACCOUNT")
    print("=" * 80)
    print(f"\n⚠️  Your account needs ALGO to deploy the contract!")
    print(f"\n📍 Your Address: {address}")
    print(f"\n🌐 Go to the TestNet dispenser:")
    print(f"   https://testnet.algoexplorer.io/dispenser")
    print(f"\n📋 Instructions:")
    print(f"   1. Copy your address: {address}")
    print(f"   2. Paste it into the dispenser")
    print(f"   3. Click 'Dispense'")
    print(f"   4. Wait ~5 seconds for confirmation")
    print(f"\n💡 You'll receive 10 free TestNet ALGO (fake money for testing)")
    
    input("\n⏸️  Press ENTER after you've funded the account...")
    
    # Check balance again
    print("\n🔄 Checking balance...")
    for i in range(10):
        balance = get_balance(address)
        if balance >= 2:
            print(f"✅ Account funded! Balance: {balance} ALGO")
            break
        print(f"   Attempt {i+1}/10... Current balance: {balance} ALGO")
        time.sleep(2)
    
    if balance < 2:
        print("\n❌ Account not funded. Please fund it and run this script again.")
        print(f"   Address: {address}")
        exit(1)

print("\n" + "=" * 80)
print("🔧 STEP 3: COMPILE SMART CONTRACT")
print("=" * 80)

# Read and compile TEAL files
def compile_program(source_file):
    """Compile TEAL file to bytes"""
    print(f"   Compiling {source_file}...")
    with open(source_file, "r") as f:
        source_code = f.read()
    compile_response = algod_client.compile(source_code)
    return base64.b64decode(compile_response["result"])

try:
    approval_program = compile_program("contracts/algoease_approval.teal")
    clear_program = compile_program("contracts/algoease_clear.teal")
    print("✅ Contract compiled successfully!")
except Exception as e:
    print(f"❌ Error compiling contract: {e}")
    print("\n💡 Make sure TEAL files exist. Run: python contracts/algoease_contract.py")
    exit(1)

print("\n" + "=" * 80)
print("🚀 STEP 4: DEPLOY TO TESTNET")
print("=" * 80)

# Global schema (storage requirements)
# 5 uints: bounty_count, amount, deadline, status, (1 extra)
# 3 byte slices: client_addr, freelancer_addr, task_desc, verifier_addr
global_schema = transaction.StateSchema(num_uints=5, num_byte_slices=4)
local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)

# Get suggested parameters
sp = algod_client.suggested_params()

print("📤 Sending deployment transaction...")

# Create application transaction
txn = transaction.ApplicationCreateTxn(
    sender=address,
    sp=sp,
    on_complete=transaction.OnComplete.NoOpOC,
    approval_program=approval_program,
    clear_program=clear_program,
    global_schema=global_schema,
    local_schema=local_schema,
)

# Sign transaction
signed_txn = txn.sign(private_key)

try:
    # Send transaction
    txid = algod_client.send_transaction(signed_txn)
    print(f"✅ Transaction sent! ID: {txid}")
    
    print("⏳ Waiting for confirmation (this takes ~5 seconds)...")
    
    # Wait for confirmation
    confirmed_txn = wait_for_confirmation(algod_client, txid, 10)
    app_id = confirmed_txn["application-index"]
    app_address = algosdk.logic.get_application_address(app_id)
    
    print("\n" + "=" * 80)
    print("🎉 DEPLOYMENT SUCCESSFUL!")
    print("=" * 80)
    print(f"\n📱 Application ID: {app_id}")
    print(f"🏦 Escrow Address: {app_address}")
    print(f"📍 Deployer Address: {address}")
    print(f"🔗 Transaction ID: {txid}")
    
    # Fund the contract for inner transactions
    print("\n" + "=" * 80)
    print("💰 STEP 5: FUND ESCROW FOR INNER TRANSACTIONS")
    print("=" * 80)
    
    sp = algod_client.suggested_params()
    fund_txn = transaction.PaymentTxn(
        sender=address,
        sp=sp,
        receiver=app_address,
        amt=200_000  # 0.2 ALGO for transaction fees
    )
    signed_fund = fund_txn.sign(private_key)
    fund_txid = algod_client.send_transaction(signed_fund)
    wait_for_confirmation(algod_client, fund_txid, 10)
    
    print(f"✅ Escrow funded with 0.2 ALGO for transaction fees")
    print(f"🔗 Transaction ID: {fund_txid}")
    
    # Get final balances
    deployer_balance = get_balance(address)
    escrow_balance = get_balance(app_address)
    
    print("\n" + "=" * 80)
    print("📊 FINAL BALANCES")
    print("=" * 80)
    print(f"💳 Your Account: {deployer_balance:.4f} ALGO")
    print(f"🏦 Escrow: {escrow_balance:.4f} ALGO")
    
    # Save deployment info
    print("\n" + "=" * 80)
    print("💾 SAVING DEPLOYMENT INFO")
    print("=" * 80)
    
    deployment_info = f"""# AlgoEase Deployment Info

## Deployed on Algorand TestNet

**Deployment Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}

### Contract Details
- **Application ID:** {app_id}
- **Escrow Address:** {app_address}
- **Deployer Address:** {address}
- **Network:** TestNet

### Transaction Links
- **Deployment TX:** https://testnet.algoexplorer.io/tx/{txid}
- **Funding TX:** https://testnet.algoexplorer.io/tx/{fund_txid}
- **View Contract:** https://testnet.algoexplorer.io/application/{app_id}

### Account Credentials (SAVE THESE!)
**Deployer Address:** {address}
**Mnemonic Phrase:** {mnemonic_phrase}

⚠️ IMPORTANT: Keep your mnemonic phrase safe! It controls your account.

### How to Use Your Contract

1. **Create a Bounty:**
   ```python
   # Send payment + app call (grouped)
   # app_args: ["create_bounty", amount, deadline, task_description]
   ```

2. **Accept Bounty:**
   ```python
   # app_args: ["accept_bounty"]
   ```

3. **Approve Work:**
   ```python
   # app_args: ["approve_bounty"]
   ```

4. **Claim Payment:**
   ```python
   # app_args: ["claim"]
   ```

5. **Request Refund:**
   ```python
   # app_args: ["refund"]
   ```

### Balances
- Deployer: {deployer_balance:.4f} ALGO
- Escrow: {escrow_balance:.4f} ALGO

### Next Steps
1. Use the CLI: `python bounty-cli.py`
2. Update frontend/.env with:
   - REACT_APP_CONTRACT_APP_ID={app_id}
   - REACT_APP_CREATOR_MNEMONIC={mnemonic_phrase}
3. Test the contract!
"""
    
    with open("DEPLOYMENT-INFO.md", "w") as f:
        f.write(deployment_info)
    
    print("✅ Saved to DEPLOYMENT-INFO.md")
    
    # Also save as env format
    env_content = f"""# AlgoEase Contract Configuration
REACT_APP_CONTRACT_APP_ID={app_id}
REACT_APP_CONTRACT_ADDRESS={app_address}
REACT_APP_CREATOR_MNEMONIC={mnemonic_phrase}
REACT_APP_CREATOR_ADDRESS={address}
"""
    
    with open("contract.env", "w") as f:
        f.write(env_content)
    
    print("✅ Saved to contract.env (for frontend)")
    
    print("\n" + "=" * 80)
    print("🎉 YOUR SMART CONTRACT IS LIVE ON TESTNET!")
    print("=" * 80)
    
    print(f"\n🌐 View your contract:")
    print(f"   https://testnet.algoexplorer.io/application/{app_id}")
    
    print(f"\n📝 Quick Test Commands:")
    print(f"   python bounty-cli.py")
    print(f"   python complete-lifecycle-test.py")
    
    print(f"\n💡 Your contract can now:")
    print(f"   ✅ Accept bounty creations")
    print(f"   ✅ Lock funds in escrow")
    print(f"   ✅ Pay winners automatically")
    print(f"   ✅ Process refunds")
    print(f"   ✅ Handle deadline expiration")
    
    print(f"\n⚠️ SAVE THESE CREDENTIALS:")
    print(f"   Address: {address}")
    print(f"   Mnemonic: {mnemonic_phrase}")
    print(f"   (Saved in DEPLOYMENT-INFO.md)")
    
    print("\n" + "=" * 80)
    print("✅ DEPLOYMENT COMPLETE!")
    print("=" * 80 + "\n")
    
except Exception as e:
    print(f"\n❌ Deployment failed: {e}")
    print("\n💡 Common issues:")
    print("   - Not enough ALGO (need at least 2 ALGO)")
    print("   - Network connection issues")
    print("   - TEAL files not found")
    exit(1)


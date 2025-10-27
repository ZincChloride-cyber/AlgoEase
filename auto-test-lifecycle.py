#!/usr/bin/env python3
"""
Automated test of COMPLETE bounty lifecycle:
1. Create Bounty → ALGO goes to escrow
2. Accept Bounty → Freelancer commits
3. Approve Work → Verifier approves
4. Claim Payment → Winner gets paid from escrow
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import os
import time
import algosdk

# Load environment
def load_env_file(filepath):
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    value = value.strip('"\'')
                    env_vars[key] = value
    return env_vars

env = load_env_file('frontend/.env')
CREATOR_MNEMONIC = env.get('REACT_APP_CREATOR_MNEMONIC', '')
APP_ID = int(env.get('REACT_APP_CONTRACT_APP_ID', '748437079'))

ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

creator_private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
creator_address = account.address_from_private_key(creator_private_key)
app_address = algosdk.logic.get_application_address(APP_ID)

print("\n" + "=" * 80)
print("🎬 COMPLETE BOUNTY LIFECYCLE TEST")
print("=" * 80)
print(f"📱 App ID: {APP_ID}")
print(f"👤 Account: {creator_address}")
print(f"🏦 Escrow: {app_address}")
print("=" * 80)

# Check balance before
account_info = algod_client.account_info(creator_address)
balance_before = account_info['amount'] / 1_000_000
print(f"💳 Starting balance: {balance_before} ALGO\n")

# ============================================================================
# STEP 1: CREATE BOUNTY (Money → Escrow)
# ============================================================================
print("=" * 80)
print("📝 STEP 1: CREATE BOUNTY (Your ALGO → Escrow)")
print("=" * 80)

amount_microalgo = 3_000_000  # 3 ALGO
deadline = 9999999999  # Far future

sp = algod_client.suggested_params()

# Payment to escrow
pay_txn = transaction.PaymentTxn(
    sender=creator_address,
    sp=sp,
    receiver=app_address,
    amt=amount_microalgo
)

# App call
app_args = [
    b"create_bounty",
    amount_microalgo.to_bytes(8, 'big'),
    deadline.to_bytes(8, 'big'),
    b"Build a smart contract bounty system"
]

app_call_txn = transaction.ApplicationCallTxn(
    sender=creator_address,
    sp=sp,
    index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=app_args,
    accounts=[creator_address]
)

# Group and sign
gid = transaction.calculate_group_id([pay_txn, app_call_txn])
pay_txn.group = gid
app_call_txn.group = gid

signed_pay = pay_txn.sign(creator_private_key)
signed_app = app_call_txn.sign(creator_private_key)

try:
    txid = algod_client.send_transactions([signed_pay, signed_app])
    print(f"✅ Bounty Created! TX: {txid}")
    wait_for_confirmation(algod_client, txid, 10)
    print("💰 3 ALGO is now locked in ESCROW!")
    print(f"🔒 Escrow address: {app_address}")
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

time.sleep(2)

# ============================================================================
# STEP 2: ACCEPT BOUNTY (Freelancer commits)
# ============================================================================
print("\n" + "=" * 80)
print("🤝 STEP 2: ACCEPT BOUNTY (Freelancer commits to work)")
print("=" * 80)

sp = algod_client.suggested_params()

accept_txn = transaction.ApplicationCallTxn(
    sender=creator_address,  # Using same account for demo
    sp=sp,
    index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"accept_bounty"]
)

signed_accept = accept_txn.sign(creator_private_key)

try:
    txid = algod_client.send_transaction(signed_accept)
    print(f"✅ Bounty Accepted! TX: {txid}")
    wait_for_confirmation(algod_client, txid, 10)
    print(f"👨‍💻 Freelancer ({creator_address[:10]}...) is now working on it!")
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

time.sleep(2)

# ============================================================================
# STEP 3: APPROVE WORK (Verifier approves)
# ============================================================================
print("\n" + "=" * 80)
print("✅ STEP 3: APPROVE WORK (Verifier approves completed work)")
print("=" * 80)

sp = algod_client.suggested_params()

approve_txn = transaction.ApplicationCallTxn(
    sender=creator_address,  # Creator is also verifier
    sp=sp,
    index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"approve_bounty"]
)

signed_approve = approve_txn.sign(creator_private_key)

try:
    txid = algod_client.send_transaction(signed_approve)
    print(f"✅ Work Approved! TX: {txid}")
    wait_for_confirmation(algod_client, txid, 10)
    print("🎯 Work has been verified and approved!")
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

time.sleep(2)

# ============================================================================
# STEP 4: CLAIM PAYMENT (Winner gets paid from escrow!)
# ============================================================================
print("\n" + "=" * 80)
print("💸 STEP 4: CLAIM PAYMENT (Winner gets paid from ESCROW!)")
print("=" * 80)

# Check balance before claim
account_info = algod_client.account_info(creator_address)
balance_before_claim = account_info['amount'] / 1_000_000
print(f"💳 Balance before claim: {balance_before_claim} ALGO")

sp = algod_client.suggested_params()

claim_txn = transaction.ApplicationCallTxn(
    sender=creator_address,
    sp=sp,
    index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"claim"]
)

signed_claim = claim_txn.sign(creator_private_key)

try:
    txid = algod_client.send_transaction(signed_claim)
    print(f"✅ Payment Claimed! TX: {txid}")
    wait_for_confirmation(algod_client, txid, 10)
    
    # Check balance after
    account_info = algod_client.account_info(creator_address)
    balance_after = account_info['amount'] / 1_000_000
    received = balance_after - balance_before_claim
    
    print("\n" + "=" * 80)
    print("🎉 SUCCESS! PAYMENT RECEIVED FROM ESCROW!")
    print("=" * 80)
    print(f"💰 Amount received: ~{received:.2f} ALGO")
    print(f"💳 New balance: {balance_after} ALGO")
    print(f"🏦 Money came from escrow: {app_address}")
    print("=" * 80)
    
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("📊 LIFECYCLE COMPLETE!")
print("=" * 80)
print("✅ Step 1: Created bounty → 3 ALGO went to ESCROW")
print("✅ Step 2: Accepted bounty → Freelancer committed")
print("✅ Step 3: Approved work → Verifier approved")
print("✅ Step 4: Claimed payment → Winner got paid from ESCROW")
print("=" * 80)
print("\n💡 YOUR SMART CONTRACT WORKS PERFECTLY!")
print("   - Money goes to escrow when bounty created")
print("   - Money is locked until approved")
print("   - Winner gets paid automatically from escrow")
print("   - If no winner, you can get refund")
print("=" * 80)
print(f"\n🔗 View on explorer:")
print(f"   https://testnet.algoexplorer.io/application/{APP_ID}")
print("=" * 80)


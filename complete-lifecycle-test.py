#!/usr/bin/env python3
"""
Complete lifecycle test - handles existing bounty
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import os
import time
import algosdk
import base64

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
print("🎬 COMPLETE BOUNTY LIFECYCLE - FROM TERMINAL!")
print("=" * 80)
print(f"📱 App ID: {APP_ID}")
print(f"👤 Account: {creator_address}")
print(f"🏦 Escrow: {app_address}")
print("=" * 80 + "\n")

def get_status():
    """Get current bounty status"""
    try:
        app_info = algod_client.application_info(APP_ID)
        state = app_info.get('params', {}).get('global-state', [])
        for item in state:
            key = base64.b64decode(item['key']).decode('utf-8')
            if key == 'status' and item['value']['type'] == 1:
                return item['value']['uint']
        return None
    except:
        return None

# Check current status
current_status = get_status()
print(f"📊 Current bounty status: {current_status}")

if current_status == 0:  # OPEN
    print("Status: 🟢 OPEN - Need to accept, approve, and claim first\n")
    step_start = 2
elif current_status == 1:  # ACCEPTED
    print("Status: 🔵 ACCEPTED - Need to approve and claim first\n")
    step_start = 3
elif current_status == 2:  # APPROVED
    print("Status: 🟣 APPROVED - Need to claim first\n")
    step_start = 4
elif current_status in [3, 4] or current_status is None:  # CLAIMED/REFUNDED/None
    print("Status: Ready for new bounty!\n")
    step_start = 1
else:
    step_start = 1

# ============================================================================
# Complete the existing bounty if needed
# ============================================================================
if step_start == 2:
    print("=" * 80)
    print("🤝 ACCEPTING EXISTING BOUNTY...")
    print("=" * 80)
    sp = algod_client.suggested_params()
    accept_txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"accept_bounty"]
    )
    signed = accept_txn.sign(creator_private_key)
    txid = algod_client.send_transaction(signed)
    wait_for_confirmation(algod_client, txid, 10)
    print(f"✅ Accepted! TX: {txid}\n")
    time.sleep(2)
    step_start = 3

if step_start == 3:
    print("=" * 80)
    print("✅ APPROVING EXISTING BOUNTY...")
    print("=" * 80)
    sp = algod_client.suggested_params()
    approve_txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"approve_bounty"]
    )
    signed = approve_txn.sign(creator_private_key)
    txid = algod_client.send_transaction(signed)
    wait_for_confirmation(algod_client, txid, 10)
    print(f"✅ Approved! TX: {txid}\n")
    time.sleep(2)
    step_start = 4

if step_start == 4:
    print("=" * 80)
    print("💸 CLAIMING EXISTING BOUNTY FROM ESCROW...")
    print("=" * 80)
    account_info = algod_client.account_info(creator_address)
    balance_before = account_info['amount'] / 1_000_000
    print(f"💳 Balance before: {balance_before} ALGO")
    
    sp = algod_client.suggested_params()
    claim_txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"claim"]
    )
    signed = claim_txn.sign(creator_private_key)
    txid = algod_client.send_transaction(signed)
    wait_for_confirmation(algod_client, txid, 10)
    
    account_info = algod_client.account_info(creator_address)
    balance_after = account_info['amount'] / 1_000_000
    received = balance_after - balance_before
    
    print(f"✅ Claimed! TX: {txid}")
    print(f"💰 Received from escrow: ~{received:.2f} ALGO")
    print(f"💳 New balance: {balance_after} ALGO\n")
    time.sleep(2)

# ============================================================================
# Now create a NEW bounty and run complete lifecycle
# ============================================================================
print("\n" + "=" * 80)
print("🆕 NOW TESTING COMPLETE NEW BOUNTY LIFECYCLE")
print("=" * 80 + "\n")

# STEP 1: CREATE
print("=" * 80)
print("📝 STEP 1: CREATE BOUNTY (3 ALGO → Escrow)")
print("=" * 80)

amount = 3_000_000
deadline = 9999999999

sp = algod_client.suggested_params()
pay_txn = transaction.PaymentTxn(sender=creator_address, sp=sp, receiver=app_address, amt=amount)
app_call_txn = transaction.ApplicationCallTxn(
    sender=creator_address,
    sp=sp,
    index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"create_bounty", amount.to_bytes(8, 'big'), deadline.to_bytes(8, 'big'), b"Test bounty from CLI"],
    accounts=[creator_address]
)

gid = transaction.calculate_group_id([pay_txn, app_call_txn])
pay_txn.group = gid
app_call_txn.group = gid

txid = algod_client.send_transactions([pay_txn.sign(creator_private_key), app_call_txn.sign(creator_private_key)])
wait_for_confirmation(algod_client, txid, 10)
print(f"✅ Created! 3 ALGO locked in escrow: {app_address}")
print(f"TX: {txid}\n")
time.sleep(2)

# STEP 2: ACCEPT
print("=" * 80)
print("🤝 STEP 2: ACCEPT BOUNTY")
print("=" * 80)
sp = algod_client.suggested_params()
accept_txn = transaction.ApplicationCallTxn(sender=creator_address, sp=sp, index=APP_ID, on_complete=transaction.OnComplete.NoOpOC, app_args=[b"accept_bounty"])
txid = algod_client.send_transaction(accept_txn.sign(creator_private_key))
wait_for_confirmation(algod_client, txid, 10)
print(f"✅ Accepted! Freelancer is working on it")
print(f"TX: {txid}\n")
time.sleep(2)

# STEP 3: APPROVE
print("=" * 80)
print("✅ STEP 3: APPROVE WORK")
print("=" * 80)
sp = algod_client.suggested_params()
approve_txn = transaction.ApplicationCallTxn(sender=creator_address, sp=sp, index=APP_ID, on_complete=transaction.OnComplete.NoOpOC, app_args=[b"approve_bounty"])
txid = algod_client.send_transaction(approve_txn.sign(creator_private_key))
wait_for_confirmation(algod_client, txid, 10)
print(f"✅ Approved! Work verified")
print(f"TX: {txid}\n")
time.sleep(2)

# STEP 4: CLAIM
print("=" * 80)
print("💸 STEP 4: CLAIM PAYMENT FROM ESCROW")
print("=" * 80)
account_info = algod_client.account_info(creator_address)
balance_before = account_info['amount'] / 1_000_000
print(f"💳 Balance before: {balance_before} ALGO")

sp = algod_client.suggested_params()
claim_txn = transaction.ApplicationCallTxn(sender=creator_address, sp=sp, index=APP_ID, on_complete=transaction.OnComplete.NoOpOC, app_args=[b"claim"])
txid = algod_client.send_transaction(claim_txn.sign(creator_private_key))
wait_for_confirmation(algod_client, txid, 10)

account_info = algod_client.account_info(creator_address)
balance_after = account_info['amount'] / 1_000_000
received = balance_after - balance_before

print(f"✅ Claimed! TX: {txid}")
print(f"💰 Received from escrow: ~{received:.2f} ALGO")
print(f"💳 Final balance: {balance_after} ALGO")

# FINAL SUMMARY
print("\n" + "=" * 80)
print("🎉 LIFECYCLE COMPLETE! YOUR SMART CONTRACT WORKS!")
print("=" * 80)
print("✅ Create Bounty → Your ALGO went to ESCROW")
print("✅ Accept Bounty → Freelancer committed")
print("✅ Approve Work → Verifier approved")
print("✅ Claim Payment → Winner got paid from ESCROW")
print("=" * 80)
print("\n💡 HOW IT WORKS:")
print("   1. Money goes to escrow when bounty created")
print("   2. Money is locked until verifier approves")
print("   3. Winner gets paid automatically from escrow")
print("   4. If no winner, creator can request refund")
print("=" * 80)
print(f"\n🔗 View on TestNet Explorer:")
print(f"   https://testnet.algoexplorer.io/application/{APP_ID}")
print("=" * 80 + "\n")


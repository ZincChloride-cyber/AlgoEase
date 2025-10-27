#!/usr/bin/env python3
"""
Simple automated test of the entire bounty lifecycle
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import os

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
APP_ID = int(env.get('REACT_APP_CONTRACT_APP_ID', '748433709'))

ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Get accounts
creator_private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
creator_address = account.address_from_private_key(creator_private_key)

print("=" * 80)
print("🧪 TESTING SMART CONTRACT")
print("=" * 80)
print(f"App ID: {APP_ID}")
print(f"Creator: {creator_address}")
print()

# Test creating a bounty with debugging
print("📝 Creating test transaction...")

sp = algod_client.suggested_params()
import algosdk

app_address = algosdk.logic.get_application_address(APP_ID)
amount_microalgo = 2_000_000  # 2 ALGO
deadline = 9999999999  # Far future

# Payment transaction
pay_txn = transaction.PaymentTxn(
    sender=creator_address,
    sp=sp,
    receiver=app_address,
    amt=amount_microalgo
)

# App call with detailed logging
print(f"Creator address: {creator_address}")
print(f"Passing accounts array: [{creator_address}]")
print()

app_args = [
    b"create_bounty",
    amount_microalgo.to_bytes(8, 'big'),
    deadline.to_bytes(8, 'big'),
    b"Test bounty"
]

# Try with accounts array
app_call_txn = transaction.ApplicationCallTxn(
    sender=creator_address,
    sp=sp,
    index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=app_args,
    accounts=[creator_address]  # This should make accounts.length() = 2
)

print("Transaction created successfully")
print(f"Sender in txn: {app_call_txn.sender}")
print(f"Accounts in txn: {app_call_txn.accounts}")
print()

# Group them
gid = transaction.calculate_group_id([pay_txn, app_call_txn])
pay_txn.group = gid
app_call_txn.group = gid

# Sign
signed_pay = pay_txn.sign(creator_private_key)
signed_app = app_call_txn.sign(creator_private_key)

print("📤 Sending to blockchain...")
try:
    txid = algod_client.send_transactions([signed_pay, signed_app])
    print(f"✅ Sent! TX ID: {txid}")
    print("⏳ Waiting for confirmation...")
    wait_for_confirmation(algod_client, txid, 10)
    print()
    print("=" * 80)
    print("🎉 SUCCESS! BOUNTY CREATED!")
    print("=" * 80)
    print(f"💰 2 ALGO is now in escrow at: {app_address}")
    print("=" * 80)
except Exception as e:
    print(f"❌ ERROR: {e}")
    print()
    print("🔍 DEBUGGING INFO:")
    print(f"The error message indicates the accounts array issue")
    print(f"Expected: Txn.accounts.length() >= 2")
    print(f"We passed: accounts=[{creator_address}]")
    print(f"Txn.accounts[0] = sender (automatic)")
    print(f"Txn.accounts[1] = what we passed")
    print()
    print("💡 The issue might be that sender == accounts[0],")
    print("   so Algorand might be deduplicating them!")


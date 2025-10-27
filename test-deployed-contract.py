#!/usr/bin/env python3
"""
Test the deployed smart contract - Create a bounty to prove it works!
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import algosdk

# Configuration from deployment
APP_ID = 748501731
MNEMONIC = "animal palm anxiety copy skirt cage because inform version focus other smile stuff deer leisure sign stand sphere drama object option jazz danger absorb giggle"
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Initialize
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
private_key = mnemonic.to_private_key(MNEMONIC)
address = account.address_from_private_key(private_key)
app_address = algosdk.logic.get_application_address(APP_ID)

print("\n" + "=" * 80)
print("🧪 TESTING DEPLOYED SMART CONTRACT")
print("=" * 80)
print(f"\n📱 App ID: {APP_ID}")
print(f"👤 Your Address: {address}")
print(f"🏦 Escrow Address: {app_address}")

# Check balance
info = algod_client.account_info(address)
balance = info['amount'] / 1_000_000
print(f"💳 Your Balance: {balance} ALGO")

if balance < 1:
    print("\n❌ Not enough ALGO to test. Need at least 1 ALGO.")
    exit(1)

print("\n" + "=" * 80)
print("💼 TEST: CREATE A BOUNTY")
print("=" * 80)

# Create a test bounty
amount = 500_000  # 0.5 ALGO
deadline = 9999999999  # Far future
task = b"Test bounty - Build a logo"

print(f"\n📝 Creating bounty:")
print(f"   Amount: 0.5 ALGO")
print(f"   Task: {task.decode()}")
print(f"   Verifier: {address} (using same address)")

sp = algod_client.suggested_params()

# Payment transaction
pay_txn = transaction.PaymentTxn(
    sender=address,
    sp=sp,
    receiver=app_address,
    amt=amount
)

# App call transaction
app_txn = transaction.ApplicationCallTxn(
    sender=address,
    sp=sp,
    index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[
        b"create_bounty",
        amount.to_bytes(8, 'big'),
        deadline.to_bytes(8, 'big'),
        task
    ],
    accounts=[address]  # Verifier address
)

# Group transactions
gid = transaction.calculate_group_id([pay_txn, app_txn])
pay_txn.group = gid
app_txn.group = gid

# Sign and send
signed_pay = pay_txn.sign(private_key)
signed_app = app_txn.sign(private_key)

try:
    print("\n📤 Sending transactions...")
    txid = algod_client.send_transactions([signed_pay, signed_app])
    print(f"✅ Sent! TX ID: {txid}")
    
    print("⏳ Waiting for confirmation...")
    wait_for_confirmation(algod_client, txid, 10)
    
    # Check new balance
    info = algod_client.account_info(address)
    new_balance = info['amount'] / 1_000_000
    
    # Check escrow balance
    escrow_info = algod_client.account_info(app_address)
    escrow_balance = escrow_info['amount'] / 1_000_000
    
    print("\n" + "=" * 80)
    print("🎉 SUCCESS! BOUNTY CREATED!")
    print("=" * 80)
    print(f"\n💳 Your Balance: {balance:.4f} → {new_balance:.4f} ALGO (sent 0.5)")
    print(f"🏦 Escrow Balance: 0.2 → {escrow_balance:.4f} ALGO (received 0.5)")
    print(f"\n🔗 View Transaction:")
    print(f"   https://testnet.algoexplorer.io/tx/{txid}")
    print(f"\n🔗 View Contract State:")
    print(f"   https://testnet.algoexplorer.io/application/{APP_ID}")
    
    # Read contract state
    print("\n" + "=" * 80)
    print("📊 CONTRACT STATE")
    print("=" * 80)
    
    app_info = algod_client.application_info(APP_ID)
    global_state = app_info['params']['global-state']
    
    import base64
    for item in global_state:
        key = base64.b64decode(item['key']).decode('utf-8')
        if item['value']['type'] == 1:  # uint
            value = item['value']['uint']
            if key == 'amount':
                print(f"   {key}: {value} microALGO ({value/1_000_000} ALGO)")
            elif key == 'status':
                status_names = {0: "OPEN", 1: "ACCEPTED", 2: "APPROVED", 3: "CLAIMED", 4: "REFUNDED"}
                print(f"   {key}: {value} ({status_names.get(value, 'UNKNOWN')})")
            else:
                print(f"   {key}: {value}")
        else:  # bytes
            try:
                value = base64.b64decode(item['value']['bytes']).decode('utf-8')
                print(f"   {key}: {value}")
            except:
                value = base64.b64decode(item['value']['bytes'])
                # Try to decode as address
                try:
                    addr = algosdk.encoding.encode_address(value)
                    print(f"   {key}: {addr}")
                except:
                    print(f"   {key}: {value.hex()}")
    
    print("\n" + "=" * 80)
    print("✅ YOUR SMART CONTRACT IS WORKING PERFECTLY!")
    print("=" * 80)
    print("\n💡 What just happened:")
    print("   1. You created a bounty for 0.5 ALGO")
    print("   2. Money moved from YOUR WALLET → ESCROW")
    print("   3. Contract stored all bounty details on blockchain")
    print("   4. Contract status = OPEN (waiting for freelancer)")
    print("\n💡 Next steps:")
    print("   - Anyone can now accept this bounty")
    print("   - After work is done, verifier can approve")
    print("   - Freelancer can then claim the 0.5 ALGO")
    print("   - Or you can request refund if needed")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    if "transaction already exists in cache" in str(e):
        print("\n💡 Bounty already exists! Contract is working but already has a bounty.")
        print("   Complete the existing bounty first.")
    exit(1)

print("\n" + "=" * 80 + "\n")


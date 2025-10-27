#!/usr/bin/env python3
"""
🎯 COMPLETE SMART CONTRACT DEMONSTRATION
Shows the full lifecycle with money tracking:
1. Wallet → Escrow (Create Bounty)
2. Escrow → Winner (Approved & Claimed)
3. Escrow → Wallet (Refund if no winner)
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation, ApplicationCreateTxn, StateSchema
import algosdk
import time
import base64

# TestNet Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

print("\n" + "=" * 80)
print("🎯 ALGORAND ESCROW SMART CONTRACT - COMPLETE DEMONSTRATION")
print("=" * 80)
print("\n📋 WHAT YOU'LL SEE:")
print("   1️⃣  Create Bounty → YOUR WALLET → ESCROW")
print("   2️⃣  Winner Scenario → ESCROW → WINNER")
print("   3️⃣  Refund Scenario → ESCROW → YOUR WALLET")
print("=" * 80)

# Create test accounts
print("\n🔧 Setting up test environment...")
print("\n📝 Creating THREE test accounts:")
print("   1. CLIENT (you) - Creates bounty")
print("   2. FREELANCER - Does the work")
print("   3. VERIFIER - Approves the work")
print()

# Generate accounts
client_private_key, client_address = account.generate_account()
freelancer_private_key, freelancer_address = account.generate_account()
verifier_private_key, verifier_address = account.generate_account()

print(f"👤 CLIENT:     {client_address}")
print(f"👤 FREELANCER: {freelancer_address}")
print(f"👤 VERIFIER:   {verifier_address}")

# Initialize client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Fund accounts from dispenser
print("\n" + "=" * 80)
print("💰 FUNDING TEST ACCOUNTS FROM TESTNET DISPENSER")
print("=" * 80)
print("\n⏳ This will take ~30 seconds...")
print("\n💡 TIP: Get free TestNet ALGO from: https://testnet.algoexplorer.io/dispenser")
print("\nFor this demo, we need to fund these accounts:")
print(f"\n1. Fund CLIENT: {client_address}")
print(f"2. Fund FREELANCER: {freelancer_address}")
print(f"3. Fund VERIFIER: {verifier_address}")

input("\n⚠️  Please fund these accounts from the dispenser, then press ENTER to continue...")

# Check balances
def get_balance(addr):
    try:
        info = algod_client.account_info(addr)
        return info['amount'] / 1_000_000
    except:
        return 0

client_balance = get_balance(client_address)
freelancer_balance = get_balance(freelancer_address)
verifier_balance = get_balance(verifier_address)

print("\n" + "=" * 80)
print("💳 ACCOUNT BALANCES")
print("=" * 80)
print(f"CLIENT:     {client_balance:.2f} ALGO")
print(f"FREELANCER: {freelancer_balance:.2f} ALGO")
print(f"VERIFIER:   {verifier_balance:.2f} ALGO")
print("=" * 80)

if client_balance < 5:
    print("\n❌ CLIENT needs at least 5 ALGO to run this demo")
    print("   Please fund the account and run again")
    exit(1)

if freelancer_balance < 1 or verifier_balance < 1:
    print("\n❌ FREELANCER and VERIFIER need at least 1 ALGO each")
    print("   Please fund the accounts and run again")
    exit(1)

# Deploy the contract
print("\n" + "=" * 80)
print("🚀 STEP 1: DEPLOYING SMART CONTRACT TO TESTNET")
print("=" * 80)

# Read compiled TEAL
with open('contracts/algoease_approval.teal', 'r') as f:
    approval_program = f.read()

with open('contracts/algoease_clear.teal', 'r') as f:
    clear_program = f.read()

# Compile programs
approval_result = algod_client.compile(approval_program)
approval_binary = base64.b64decode(approval_result['result'])

clear_result = algod_client.compile(clear_program)
clear_binary = base64.b64decode(clear_result['result'])

# Create the app
sp = algod_client.suggested_params()

global_schema = StateSchema(num_uints=5, num_byte_slices=3)
local_schema = StateSchema(num_uints=0, num_byte_slices=0)

txn = ApplicationCreateTxn(
    sender=client_address,
    sp=sp,
    on_complete=transaction.OnComplete.NoOpOC,
    approval_program=approval_binary,
    clear_program=clear_binary,
    global_schema=global_schema,
    local_schema=local_schema
)

signed_txn = txn.sign(client_private_key)
tx_id = algod_client.send_transaction(signed_txn)

print(f"✅ Transaction sent! ID: {tx_id}")
print("⏳ Waiting for confirmation...")

result = wait_for_confirmation(algod_client, tx_id, 10)
app_id = result['application-index']
app_address = algosdk.logic.get_application_address(app_id)

print(f"\n✅ CONTRACT DEPLOYED SUCCESSFULLY!")
print(f"📱 App ID: {app_id}")
print(f"🏦 ESCROW Address: {app_address}")
print(f"🔗 View: https://testnet.algoexplorer.io/application/{app_id}")

# Fund the app account for inner transactions
print("\n💰 Funding escrow account (needed for inner transactions)...")
sp = algod_client.suggested_params()
fund_txn = transaction.PaymentTxn(
    sender=client_address,
    sp=sp,
    receiver=app_address,
    amt=200_000  # 0.2 ALGO for transaction fees
)
signed_fund = fund_txn.sign(client_private_key)
tx_id = algod_client.send_transaction(signed_fund)
wait_for_confirmation(algod_client, tx_id, 10)
print(f"✅ Escrow funded with 0.2 ALGO for transaction fees")

time.sleep(2)

# ============================================================================
# SCENARIO 1: CREATE BOUNTY (Wallet → Escrow)
# ============================================================================
print("\n" + "=" * 80)
print("💼 SCENARIO 1: CREATE BOUNTY (YOUR WALLET → ESCROW)")
print("=" * 80)

bounty_amount = 3_000_000  # 3 ALGO
deadline = int(time.time()) + 86400  # 24 hours from now

client_balance_before = get_balance(client_address)
escrow_balance_before = get_balance(app_address)

print(f"\n📊 BEFORE CREATE:")
print(f"   💳 Your Wallet: {client_balance_before:.4f} ALGO")
print(f"   🏦 Escrow:      {escrow_balance_before:.4f} ALGO")

print(f"\n📝 Creating bounty: 3 ALGO")
print(f"   Task: 'Build a logo for my startup'")
print(f"   Deadline: 24 hours")
print(f"   Verifier: {verifier_address[:10]}...")

sp = algod_client.suggested_params()

# Payment to escrow
pay_txn = transaction.PaymentTxn(
    sender=client_address,
    sp=sp,
    receiver=app_address,
    amt=bounty_amount
)

# App call
app_call_txn = transaction.ApplicationCallTxn(
    sender=client_address,
    sp=sp,
    index=app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[
        b"create_bounty",
        bounty_amount.to_bytes(8, 'big'),
        deadline.to_bytes(8, 'big'),
        b"Build a logo for my startup"
    ],
    accounts=[verifier_address]
)

# Group transactions
gid = transaction.calculate_group_id([pay_txn, app_call_txn])
pay_txn.group = gid
app_call_txn.group = gid

signed_pay = pay_txn.sign(client_private_key)
signed_app = app_call_txn.sign(client_private_key)

tx_id = algod_client.send_transactions([signed_pay, signed_app])
print(f"\n⏳ Sending transaction...")
wait_for_confirmation(algod_client, tx_id, 10)

client_balance_after = get_balance(client_address)
escrow_balance_after = get_balance(app_address)

print(f"\n✅ BOUNTY CREATED!")
print(f"\n📊 AFTER CREATE:")
print(f"   💳 Your Wallet: {client_balance_after:.4f} ALGO  (Decreased by ~3 ALGO)")
print(f"   🏦 Escrow:      {escrow_balance_after:.4f} ALGO  (Increased by 3 ALGO)")
print(f"\n💡 YOUR MONEY IS NOW LOCKED IN ESCROW!")
print(f"   It can only be released to winner OR refunded to you")
print(f"🔗 TX: https://testnet.algoexplorer.io/tx/{tx_id}")

time.sleep(3)

# ============================================================================
# SCENARIO 2: WINNER GETS PAID (Escrow → Winner)
# ============================================================================
print("\n" + "=" * 80)
print("🏆 SCENARIO 2: WINNER SCENARIO (ESCROW → WINNER)")
print("=" * 80)

# Freelancer accepts
print("\n🤝 STEP A: Freelancer accepts the bounty...")
sp = algod_client.suggested_params()
accept_txn = transaction.ApplicationCallTxn(
    sender=freelancer_address,
    sp=sp,
    index=app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"accept_bounty"]
)
signed = accept_txn.sign(freelancer_private_key)
tx_id = algod_client.send_transaction(signed)
wait_for_confirmation(algod_client, tx_id, 10)
print(f"✅ Freelancer accepted! Now working on the task...")

time.sleep(2)

# Verifier approves
print("\n✅ STEP B: Verifier checks and approves the work...")
sp = algod_client.suggested_params()
approve_txn = transaction.ApplicationCallTxn(
    sender=verifier_address,
    sp=sp,
    index=app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"approve_bounty"]
)
signed = approve_txn.sign(verifier_private_key)
tx_id = algod_client.send_transaction(signed)
wait_for_confirmation(algod_client, tx_id, 10)
print(f"✅ Work approved by verifier!")

time.sleep(2)

# Freelancer claims
print("\n💸 STEP C: Freelancer claims payment from escrow...")

freelancer_balance_before = get_balance(freelancer_address)
escrow_balance_before = get_balance(app_address)

print(f"\n📊 BEFORE CLAIM:")
print(f"   👤 Freelancer: {freelancer_balance_before:.4f} ALGO")
print(f"   🏦 Escrow:     {escrow_balance_before:.4f} ALGO")

sp = algod_client.suggested_params()
claim_txn = transaction.ApplicationCallTxn(
    sender=freelancer_address,
    sp=sp,
    index=app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"claim"]
)
signed = claim_txn.sign(freelancer_private_key)
tx_id = algod_client.send_transaction(signed)
wait_for_confirmation(algod_client, tx_id, 10)

freelancer_balance_after = get_balance(freelancer_address)
escrow_balance_after = get_balance(app_address)
payment_received = freelancer_balance_after - freelancer_balance_before

print(f"\n✅ PAYMENT SENT FROM ESCROW!")
print(f"\n📊 AFTER CLAIM:")
print(f"   👤 Freelancer: {freelancer_balance_after:.4f} ALGO  (Received {payment_received:.4f} ALGO)")
print(f"   🏦 Escrow:     {escrow_balance_after:.4f} ALGO  (Released 3 ALGO)")
print(f"\n💰 WINNER GOT PAID AUTOMATICALLY FROM ESCROW!")
print(f"🔗 TX: https://testnet.algoexplorer.io/tx/{tx_id}")

time.sleep(3)

# ============================================================================
# SCENARIO 3: REFUND (Escrow → Your Wallet)
# ============================================================================
print("\n" + "=" * 80)
print("🔙 SCENARIO 3: NO WINNER - REFUND (ESCROW → YOUR WALLET)")
print("=" * 80)

print("\n📝 Creating another bounty to demonstrate refund...")

# Create new bounty
bounty_amount = 2_000_000  # 2 ALGO

client_balance_before_2 = get_balance(client_address)
escrow_balance_before_2 = get_balance(app_address)

sp = algod_client.suggested_params()
pay_txn = transaction.PaymentTxn(sender=client_address, sp=sp, receiver=app_address, amt=bounty_amount)
app_call_txn = transaction.ApplicationCallTxn(
    sender=client_address,
    sp=sp,
    index=app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"create_bounty", bounty_amount.to_bytes(8, 'big'), deadline.to_bytes(8, 'big'), b"Another task"],
    accounts=[verifier_address]
)

gid = transaction.calculate_group_id([pay_txn, app_call_txn])
pay_txn.group = gid
app_call_txn.group = gid

tx_id = algod_client.send_transactions([pay_txn.sign(client_private_key), app_call_txn.sign(client_private_key)])
wait_for_confirmation(algod_client, tx_id, 10)

print(f"✅ Second bounty created: 2 ALGO locked in escrow")

time.sleep(2)

# Request refund
print("\n🔙 Requesting refund (work not satisfactory / no winner)...")

client_balance_before_refund = get_balance(client_address)
escrow_balance_before_refund = get_balance(app_address)

print(f"\n📊 BEFORE REFUND:")
print(f"   💳 Your Wallet: {client_balance_before_refund:.4f} ALGO")
print(f"   🏦 Escrow:      {escrow_balance_before_refund:.4f} ALGO")

sp = algod_client.suggested_params()
refund_txn = transaction.ApplicationCallTxn(
    sender=client_address,
    sp=sp,
    index=app_id,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"refund"]
)
signed = refund_txn.sign(client_private_key)
tx_id = algod_client.send_transaction(signed)
wait_for_confirmation(algod_client, tx_id, 10)

client_balance_after_refund = get_balance(client_address)
escrow_balance_after_refund = get_balance(app_address)
refund_received = client_balance_after_refund - client_balance_before_refund

print(f"\n✅ REFUND PROCESSED!")
print(f"\n📊 AFTER REFUND:")
print(f"   💳 Your Wallet: {client_balance_after_refund:.4f} ALGO  (Received {refund_received:.4f} ALGO back)")
print(f"   🏦 Escrow:      {escrow_balance_after_refund:.4f} ALGO  (Released 2 ALGO)")
print(f"\n💰 YOUR MONEY RETURNED FROM ESCROW!")
print(f"🔗 TX: https://testnet.algoexplorer.io/tx/{tx_id}")

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("🎉 COMPLETE DEMONSTRATION FINISHED!")
print("=" * 80)
print("\n✅ SCENARIO 1: CREATE BOUNTY")
print("   💸 Your wallet → Escrow (3 ALGO locked)")
print()
print("✅ SCENARIO 2: WINNER GETS PAID")
print("   💰 Escrow → Freelancer (3 ALGO paid automatically)")
print()
print("✅ SCENARIO 3: REFUND")
print("   🔙 Escrow → Your wallet (2 ALGO returned)")
print()
print("=" * 80)
print("💡 WHAT YOU LEARNED:")
print("=" * 80)
print("1. Money goes FROM your wallet TO escrow when creating bounty")
print("2. Money is LOCKED in escrow until conditions are met")
print("3. Winner gets paid AUTOMATICALLY from escrow when approved")
print("4. You get REFUNDED automatically if no winner")
print("5. Everything is TRUSTLESS - no human can steal the money")
print("6. All transactions are on the blockchain (transparent)")
print("=" * 80)
print(f"\n🔗 View Your Contract: https://testnet.algoexplorer.io/application/{app_id}")
print("=" * 80 + "\n")

print("\n📚 FILES TO EXPLORE:")
print("   📄 contracts/algoease_contract.py - Smart contract code")
print("   📄 contracts/algoease_approval.teal - Compiled bytecode")
print()
print("💡 Your accounts for testing:")
print(f"   CLIENT:     {client_address}")
print(f"   FREELANCER: {freelancer_address}")
print(f"   VERIFIER:   {verifier_address}")
print("\n🎓 Congratulations! You now understand how escrow smart contracts work!\n")


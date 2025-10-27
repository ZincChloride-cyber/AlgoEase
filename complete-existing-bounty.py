#!/usr/bin/env python3
"""
Complete the existing bounty so you can create new ones
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import algosdk

APP_ID = 748501731
MNEMONIC = "animal palm anxiety copy skirt cage because inform version focus other smile stuff deer leisure sign stand sphere drama object option jazz danger absorb giggle"
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
private_key = mnemonic.to_private_key(MNEMONIC)
address = account.address_from_private_key(private_key)

def get_balance(addr):
    try:
        return algod_client.account_info(addr)['amount'] / 1_000_000
    except:
        return 0

print("\n" + "=" * 80)
print("  🔄 COMPLETING EXISTING BOUNTY")
print("=" * 80)
print("\nThis will: Accept → Approve → Claim")
print("So you can then create new bounties!\n")

balance_before = get_balance(address)

# Accept
print("📤 Step 1/3: Accepting bounty...")
sp = algod_client.suggested_params()
txn = transaction.ApplicationCallTxn(
    sender=address, sp=sp, index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"accept_bounty"]
)

try:
    txid = algod_client.send_transaction(txn.sign(private_key))
    wait_for_confirmation(algod_client, txid, 10)
    print(f"✅ Accepted! TX: {txid[:10]}...")
except Exception as e:
    if "already" not in str(e).lower():
        print(f"❌ Error accepting: {e}")

# Approve
print("\n📤 Step 2/3: Approving work...")
sp = algod_client.suggested_params()
txn = transaction.ApplicationCallTxn(
    sender=address, sp=sp, index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"approve_bounty"]
)

try:
    txid = algod_client.send_transaction(txn.sign(private_key))
    wait_for_confirmation(algod_client, txid, 10)
    print(f"✅ Approved! TX: {txid[:10]}...")
except Exception as e:
    if "already" not in str(e).lower():
        print(f"❌ Error approving: {e}")

# Claim
print("\n📤 Step 3/3: Claiming payment...")
sp = algod_client.suggested_params()
txn = transaction.ApplicationCallTxn(
    sender=address, sp=sp, index=APP_ID,
    on_complete=transaction.OnComplete.NoOpOC,
    app_args=[b"claim"]
)

try:
    txid = algod_client.send_transaction(txn.sign(private_key))
    wait_for_confirmation(algod_client, txid, 10)
    
    balance_after = get_balance(address)
    received = balance_after - balance_before
    
    print(f"✅ Claimed! TX: {txid[:10]}...")
    print(f"\n💰 Received: {received:.4f} ALGO")
    
    print("\n" + "=" * 80)
    print("🎉 EXISTING BOUNTY COMPLETED!")
    print("=" * 80)
    print("\n✅ Now you can create new bounties!")
    print("\nRun: python working-bounty-tool.py")
    print("Choose: 1 (Create Bounty)")
    print("\n🔗 View: https://testnet.explorer.perawallet.app/application/748501731")
    print("=" * 80 + "\n")
    
except Exception as e:
    print(f"❌ Error claiming: {e}")
    print("\n💡 Try refunding instead:")
    print("   python working-bounty-tool.py")
    print("   Choose: 5 (Refund)")


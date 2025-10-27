#!/usr/bin/env python3
"""
🎯 WORKING BOUNTY TOOL - Simplified & Reliable
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import algosdk
import time

# Configuration
APP_ID = 748501731
MNEMONIC = "animal palm anxiety copy skirt cage because inform version focus other smile stuff deer leisure sign stand sphere drama object option jazz danger absorb giggle"
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Initialize
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
private_key = mnemonic.to_private_key(MNEMONIC)
address = account.address_from_private_key(private_key)
app_address = algosdk.logic.get_application_address(APP_ID)

def get_balance(addr):
    try:
        info = algod_client.account_info(addr)
        return info['amount'] / 1_000_000
    except:
        return 0

def confirm(prompt):
    response = input(prompt).strip().lower()
    return response in ['y', 'yes']

print("\n" + "=" * 80)
print("  🎯 WORKING BOUNTY TOOL")
print("=" * 80)
print(f"\n📱 Contract: {APP_ID}")
print(f"👤 Your Address: {address}")
print(f"🏦 Escrow: {app_address}")

your_balance = get_balance(address)
escrow_balance = get_balance(app_address)

print(f"\n💰 Balances:")
print(f"   Your Wallet: {your_balance:.4f} ALGO")
print(f"   Escrow:      {escrow_balance:.4f} ALGO")

print(f"\n🔗 View: https://testnet.explorer.perawallet.app/application/{APP_ID}")

print("\n" + "=" * 80)
print("  📋 AVAILABLE ACTIONS")
print("=" * 80)
print("\n   1️⃣  Create Bounty")
print("   2️⃣  Accept Bounty")
print("   3️⃣  Approve Work")
print("   4️⃣  Claim Payment")
print("   5️⃣  Reject/Refund")
print("   9️⃣  Exit")

choice = input("\n👉 Choose: ").strip()

if choice == '1':
    print("\n" + "=" * 80)
    print("  💼 CREATE BOUNTY")
    print("=" * 80)
    
    amount_str = input("\n💰 Amount in ALGO: ").strip()
    try:
        amount_algo = float(amount_str)
        amount_micro = int(amount_algo * 1_000_000)
    except:
        print("❌ Invalid amount!")
        exit(1)
    
    task = input("📝 Task: ").strip() or "Complete task"
    
    print(f"\n📊 Creating {amount_algo} ALGO bounty...")
    print(f"   Task: {task}")
    
    if not confirm("✅ Create? (y/n): "):
        print("❌ Cancelled")
        exit(0)
    
    sp = algod_client.suggested_params()
    deadline = int(time.time()) + 604800
    
    pay_txn = transaction.PaymentTxn(sender=address, sp=sp, receiver=app_address, amt=amount_micro)
    app_txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID, on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"create_bounty", amount_micro.to_bytes(8, 'big'), deadline.to_bytes(8, 'big'), task.encode()],
        accounts=[address]
    )
    
    gid = transaction.calculate_group_id([pay_txn, app_txn])
    pay_txn.group = gid
    app_txn.group = gid
    
    try:
        print("\n📤 Sending...")
        txid = algod_client.send_transactions([pay_txn.sign(private_key), app_txn.sign(private_key)])
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY CREATED!")
        print("=" * 80)
        print(f"\n✅ {amount_algo} ALGO locked in escrow")
        print(f"🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ Error: {e}")
        
        if "already" in error_msg.lower() or "rejected" in error_msg.lower():
            print("\n💡 THERE'S ALREADY AN ACTIVE BOUNTY!")
            print("\nTo fix this, you need to complete the existing bounty:")
            print("\n🔄 Option 1: Complete it (Accept → Approve → Claim)")
            print("   python working-bounty-tool.py")
            print("   Choose: 2 (Accept) → 3 (Approve) → 4 (Claim)")
            print("\n🔄 Option 2: Refund it")
            print("   python working-bounty-tool.py")
            print("   Choose: 5 (Refund)")
            print("\nThen try creating a new bounty again!")

elif choice == '2':
    print("\n" + "=" * 80)
    print("  🤝 ACCEPT BOUNTY")
    print("=" * 80)
    
    if not confirm("\n✅ Accept? (y/n): "):
        print("❌ Cancelled")
        exit(0)
    
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"accept_bounty"]
    )
    
    try:
        print("\n📤 Sending...")
        txid = algod_client.send_transaction(txn.sign(private_key))
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY ACCEPTED!")
        print("=" * 80)
        print(f"\n🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

elif choice == '3':
    print("\n" + "=" * 80)
    print("  ✅ APPROVE WORK")
    print("=" * 80)
    
    if not confirm("\n✅ Approve? (y/n): "):
        print("❌ Cancelled")
        exit(0)
    
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"approve_bounty"]
    )
    
    try:
        print("\n📤 Sending...")
        txid = algod_client.send_transaction(txn.sign(private_key))
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 WORK APPROVED!")
        print("=" * 80)
        print(f"\n🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

elif choice == '4':
    print("\n" + "=" * 80)
    print("  💰 CLAIM PAYMENT")
    print("=" * 80)
    
    balance_before = get_balance(address)
    
    if not confirm("\n✅ Claim? (y/n): "):
        print("❌ Cancelled")
        exit(0)
    
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"claim"]
    )
    
    try:
        print("\n📤 Sending...")
        txid = algod_client.send_transaction(txn.sign(private_key))
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        balance_after = get_balance(address)
        received = balance_after - balance_before
        
        print("\n" + "=" * 80)
        print("🎉 PAYMENT RECEIVED!")
        print("=" * 80)
        print(f"\n✅ Received: {received:.4f} ALGO")
        print(f"🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

elif choice == '5':
    print("\n" + "=" * 80)
    print("  🔙 REJECT/REFUND")
    print("=" * 80)
    
    balance_before = get_balance(address)
    
    if not confirm("\n⚠️  Refund? (y/n): "):
        print("❌ Cancelled")
        exit(0)
    
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"refund"]
    )
    
    try:
        print("\n📤 Sending...")
        txid = algod_client.send_transaction(txn.sign(private_key))
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        balance_after = get_balance(address)
        received = balance_after - balance_before
        
        print("\n" + "=" * 80)
        print("🎉 REFUND COMPLETED!")
        print("=" * 80)
        print(f"\n✅ Received: {received:.4f} ALGO")
        print(f"🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        
        print("\n💡 Now you can create a new bounty!")
        print("   Run: python working-bounty-tool.py")
        print("   Choose: 1 (Create)")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

elif choice == '9':
    print("\n👋 Goodbye!")

else:
    print("\n❌ Invalid choice!")

print()


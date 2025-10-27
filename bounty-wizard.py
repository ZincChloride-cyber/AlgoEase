#!/usr/bin/env python3
"""
🧙 BOUNTY WIZARD - Interactive Smart Contract Guide
Step-by-step: Create → Accept → Approve/Reject → Claim
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import algosdk
import time
import base64

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

def print_header(text):
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)

def get_balance(addr):
    try:
        info = algod_client.account_info(addr)
        return info['amount'] / 1_000_000
    except:
        return 0

def get_contract_status():
    """Get simple contract status"""
    try:
        app_info = algod_client.application_info(APP_ID)
        global_state = app_info['params'].get('global-state', [])
        
        for item in global_state:
            key = base64.b64decode(item['key']).decode('utf-8')
            if key == 'status' and item['value']['type'] == 1:
                return item['value']['uint']
        return None
    except:
        return None

def show_current_state():
    """Show current contract state"""
    print_header("📊 CURRENT STATUS")
    
    status = get_contract_status()
    your_balance = get_balance(address)
    escrow_balance = get_balance(app_address)
    
    print(f"\n💰 Balances:")
    print(f"   Your Wallet: {your_balance:.4f} ALGO")
    print(f"   Escrow:      {escrow_balance:.4f} ALGO")
    
    status_info = {
        None: "⚪ No active bounty",
        0: "🟢 OPEN - Waiting for freelancer",
        1: "🔵 ACCEPTED - Freelancer working",
        2: "🟣 APPROVED - Ready to claim",
        3: "✅ CLAIMED - Completed",
        4: "🔙 REFUNDED - Returned to client"
    }
    
    print(f"\n📊 Bounty Status: {status_info.get(status, 'UNKNOWN')}")
    print(f"\n🔗 View on Pera: https://testnet.explorer.perawallet.app/application/{APP_ID}")
    
    return status

def step_create_bounty():
    """Step 1: Create a bounty"""
    print_header("1️⃣  CREATE BOUNTY (Lock money in escrow)")
    
    print("\n💡 What happens:")
    print("   • You lock ALGO in escrow")
    print("   • Freelancers can see and accept your bounty")
    print("   • Money stays locked until work is approved or refunded")
    
    print("\n" + "-" * 80)
    amount_str = input("💰 Enter bounty amount in ALGO (e.g., 1.0): ").strip()
    try:
        amount_algo = float(amount_str)
        amount_micro = int(amount_algo * 1_000_000)
    except:
        print("❌ Invalid amount!")
        return False
    
    task = input("📝 Enter task description: ").strip()
    if not task:
        task = "Complete the task"
    
    your_balance = get_balance(address)
    print(f"\n📊 Summary:")
    print(f"   Amount: {amount_algo} ALGO")
    print(f"   Task: {task}")
    print(f"   Your balance: {your_balance:.4f} ALGO")
    print(f"   After: ~{your_balance - amount_algo:.4f} ALGO")
    
    if your_balance < amount_algo + 0.1:
        print("\n❌ Not enough ALGO!")
        return False
    
    confirm = input("\n✅ Create bounty? (yes/no): ").lower().strip()
    if confirm != 'yes':
        print("❌ Cancelled")
        return False
    
    # Create transaction
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    deadline = int(time.time()) + 604800  # 7 days
    
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
        txid = algod_client.send_transactions([pay_txn.sign(private_key), app_txn.sign(private_key)])
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY CREATED!")
        print("=" * 80)
        print(f"\n✅ {amount_algo} ALGO locked in escrow")
        print(f"✅ Status: OPEN")
        print(f"\n🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def step_accept_bounty():
    """Step 2: Accept bounty"""
    print_header("2️⃣  ACCEPT BOUNTY (Commit to doing the work)")
    
    print("\n💡 What happens:")
    print("   • You commit to completing this bounty")
    print("   • Status changes to ACCEPTED")
    print("   • You'll get paid after work is approved")
    
    confirm = input("\n✅ Accept this bounty? (yes/no): ").lower().strip()
    if confirm != 'yes':
        print("❌ Cancelled")
        return False
    
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"accept_bounty"]
    )
    
    try:
        txid = algod_client.send_transaction(txn.sign(private_key))
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY ACCEPTED!")
        print("=" * 80)
        print(f"\n✅ You're now committed to this bounty")
        print(f"✅ Status: ACCEPTED")
        print(f"\n🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def step_approve_bounty():
    """Step 3a: Approve work"""
    print_header("3️⃣  APPROVE WORK (Verify quality)")
    
    print("\n💡 What happens:")
    print("   • You verify the work quality")
    print("   • Status changes to APPROVED")
    print("   • Freelancer can then claim payment")
    
    print("\n📋 Quality checklist:")
    print("   ✓ Work meets requirements")
    print("   ✓ All deliverables provided")
    print("   ✓ Quality is acceptable")
    
    confirm = input("\n✅ Approve this work? (yes/no): ").lower().strip()
    if confirm != 'yes':
        print("❌ Cancelled")
        return False
    
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"approve_bounty"]
    )
    
    try:
        txid = algod_client.send_transaction(txn.sign(private_key))
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 WORK APPROVED!")
        print("=" * 80)
        print(f"\n✅ Work quality verified")
        print(f"✅ Status: APPROVED")
        print(f"✅ Freelancer can now claim")
        print(f"\n🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def step_reject_bounty():
    """Step 3b: Reject and refund"""
    print_header("3️⃣  REJECT WORK (Refund to client)")
    
    print("\n💡 What happens:")
    print("   • Money returns from escrow to client")
    print("   • Status changes to REFUNDED")
    print("   • Can create new bounty after this")
    
    print("\n⚠️  Reasons to reject:")
    print("   • Work quality not acceptable")
    print("   • Task not completed")
    print("   • Need to cancel bounty")
    
    balance_before = get_balance(address)
    escrow_before = get_balance(app_address)
    
    print(f"\n📊 After refund:")
    print(f"   Your wallet: ~{balance_before + 0.5:.4f} ALGO (current: {balance_before:.4f})")
    print(f"   Escrow: ~{escrow_before - 0.5:.4f} ALGO (current: {escrow_before:.4f})")
    
    confirm = input("\n⚠️  Reject and refund? (yes/no): ").lower().strip()
    if confirm != 'yes':
        print("❌ Cancelled")
        return False
    
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"refund"]
    )
    
    try:
        txid = algod_client.send_transaction(txn.sign(private_key))
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        balance_after = get_balance(address)
        received = balance_after - balance_before
        
        print("\n" + "=" * 80)
        print("🎉 REFUND COMPLETED!")
        print("=" * 80)
        print(f"\n✅ Money returned from escrow")
        print(f"✅ Received: {received:.4f} ALGO")
        print(f"✅ Status: REFUNDED")
        print(f"\n🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def step_claim_payment():
    """Step 4: Claim payment"""
    print_header("4️⃣  CLAIM PAYMENT (Get paid!)")
    
    print("\n💡 What happens:")
    print("   • Money automatically transfers from escrow to you")
    print("   • Status changes to CLAIMED")
    print("   • Bounty completed successfully!")
    
    balance_before = get_balance(address)
    escrow_before = get_balance(app_address)
    
    print(f"\n📊 After claiming:")
    print(f"   Your wallet: ~{balance_before + 0.5:.4f} ALGO (current: {balance_before:.4f})")
    print(f"   Escrow: ~{escrow_before - 0.5:.4f} ALGO (current: {escrow_before:.4f})")
    
    confirm = input("\n✅ Claim your payment? (yes/no): ").lower().strip()
    if confirm != 'yes':
        print("❌ Cancelled")
        return False
    
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address, sp=sp, index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"claim"]
    )
    
    try:
        txid = algod_client.send_transaction(txn.sign(private_key))
        print("⏳ Confirming...")
        wait_for_confirmation(algod_client, txid, 10)
        
        balance_after = get_balance(address)
        received = balance_after - balance_before
        
        print("\n" + "=" * 80)
        print("🎉 PAYMENT RECEIVED!")
        print("=" * 80)
        print(f"\n✅ Paid from escrow automatically")
        print(f"✅ Received: {received:.4f} ALGO")
        print(f"✅ Status: CLAIMED")
        print(f"\n🔗 TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def main():
    """Main wizard"""
    print("\n" + "=" * 80)
    print("  🧙 BOUNTY WIZARD - Step-by-Step Smart Contract Guide")
    print("=" * 80)
    print("\n🎯 This wizard guides you through the complete bounty lifecycle:")
    print("   1️⃣  Create Bounty (lock money)")
    print("   2️⃣  Accept Bounty (commit to work)")
    print("   3️⃣  Approve/Reject Work (verify quality)")
    print("   4️⃣  Claim Payment (get paid!)")
    
    input("\n⏸️  Press ENTER to start...")
    
    while True:
        status = show_current_state()
        
        print_header("🎯 AVAILABLE ACTIONS")
        
        actions = {}
        
        if status in [None, 3, 4]:
            print("\n   1️⃣  Create New Bounty")
            actions['1'] = step_create_bounty
        
        if status == 0:
            print("\n   2️⃣  Accept Bounty")
            print("   5️⃣  Reject Bounty (Refund)")
            actions['2'] = step_accept_bounty
            actions['5'] = step_reject_bounty
        
        if status == 1:
            print("\n   3️⃣  Approve Work")
            print("   5️⃣  Reject Work (Refund)")
            actions['3'] = step_approve_bounty
            actions['5'] = step_reject_bounty
        
        if status == 2:
            print("\n   4️⃣  Claim Payment")
            actions['4'] = step_claim_payment
        
        print("\n   9️⃣  Exit")
        
        choice = input("\n👉 Choose action: ").strip()
        
        if choice == '9':
            print("\n👋 Goodbye!")
            print(f"🔗 View contract: https://testnet.explorer.perawallet.app/application/{APP_ID}")
            break
        
        if choice in actions:
            actions[choice]()
            input("\n⏸️  Press ENTER to continue...")
        else:
            print("\n❌ Invalid choice!")
            time.sleep(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted. Goodbye!")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")


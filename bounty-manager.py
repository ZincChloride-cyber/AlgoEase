#!/usr/bin/env python3
"""
🎯 BOUNTY MANAGER - Easy Smart Contract Tool
Improved: Accepts y/yes, better error handling, guides you through existing bounties
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

def confirm(prompt):
    """Accept y, yes, Y, Yes, YES"""
    response = input(prompt).strip().lower()
    return response in ['y', 'yes']

def get_contract_state():
    """Get detailed contract state"""
    try:
        app_info = algod_client.application_info(APP_ID)
        global_state = app_info['params'].get('global-state', [])
        
        state = {}
        for item in global_state:
            key = base64.b64decode(item['key']).decode('utf-8')
            if item['value']['type'] == 1:  # uint
                state[key] = item['value']['uint']
            else:  # bytes
                try:
                    value = base64.b64decode(item['value']['bytes'])
                    try:
                        state[key] = algosdk.encoding.encode_address(value)
                    except:
                        try:
                            state[key] = value.decode('utf-8')
                        except:
                            state[key] = value.hex()
                except:
                    state[key] = None
        return state
    except:
        return {}

def show_status():
    """Show current status"""
    print_header("📊 CURRENT STATUS")
    
    state = get_contract_state()
    status = state.get('status', None)
    
    your_balance = get_balance(address)
    escrow_balance = get_balance(app_address)
    
    print(f"\n💰 Balances:")
    print(f"   Your Wallet: {your_balance:.4f} ALGO")
    print(f"   Escrow:      {escrow_balance:.4f} ALGO")
    
    status_names = {
        None: "⚪ No active bounty - Ready to create new one!",
        0: "🟢 OPEN - Waiting for freelancer to accept",
        1: "🔵 ACCEPTED - Freelancer is working",
        2: "🟣 APPROVED - Ready for freelancer to claim",
        3: "✅ CLAIMED - Completed! Can create new bounty",
        4: "🔙 REFUNDED - Money returned! Can create new bounty"
    }
    
    print(f"\n📊 Bounty Status: {status_names.get(status, 'UNKNOWN')}")
    
    if status is not None and status not in [3, 4]:
        print(f"\n💡 Current bounty details:")
        if 'amount' in state and state['amount']:
            amount_algo = state['amount'] / 1_000_000
            print(f"   Amount: {amount_algo} ALGO")
        if 'task_desc' in state and state['task_desc']:
            print(f"   Task: {state['task_desc']}")
        if 'client_addr' in state and state['client_addr']:
            print(f"   Client: {state['client_addr'][:10]}...")
        if 'freelancer_addr' in state and state['freelancer_addr']:
            print(f"   Freelancer: {state['freelancer_addr'][:10]}...")
    
    print(f"\n🔗 Pera Explorer: https://testnet.explorer.perawallet.app/application/{APP_ID}")
    
    return status

def create_bounty():
    """Create a new bounty"""
    print_header("💼 CREATE NEW BOUNTY")
    
    # Check if there's an existing bounty
    state = get_contract_state()
    status = state.get('status', None)
    
    if status is not None and status not in [3, 4]:
        print("\n⚠️  There's already an active bounty!")
        print(f"   Current status: {status}")
        print(f"\n💡 You need to complete the existing bounty first:")
        if status == 0:
            print("   → Accept the bounty (or reject/refund it)")
        elif status == 1:
            print("   → Approve the work (or reject/refund it)")
        elif status == 2:
            print("   → Claim the payment")
        
        if confirm("\n❓ Would you like to see available actions? (y/n): "):
            return False
        else:
            return False
    
    print("\n💡 You're creating a bounty as the CLIENT")
    print("   Your ALGO will be locked in escrow until:")
    print("   • Work is approved and claimed by freelancer")
    print("   • OR you request a refund")
    
    print("\n" + "-" * 80)
    
    # Get amount
    while True:
        amount_str = input("💰 Enter bounty amount in ALGO (e.g., 1.0): ").strip()
        try:
            amount_algo = float(amount_str)
            if amount_algo <= 0:
                print("❌ Amount must be greater than 0!")
                continue
            amount_micro = int(amount_algo * 1_000_000)
            break
        except:
            print("❌ Invalid amount! Please enter a number (e.g., 1.0)")
    
    # Get task
    task = input("📝 Enter task description: ").strip()
    if not task:
        task = "Complete the assigned task"
    
    # Check balance
    your_balance = get_balance(address)
    print(f"\n📊 Summary:")
    print(f"   Amount: {amount_algo} ALGO")
    print(f"   Task: {task}")
    print(f"   Your balance: {your_balance:.4f} ALGO")
    print(f"   After creation: ~{your_balance - amount_algo:.4f} ALGO")
    
    if your_balance < amount_algo + 0.1:
        print(f"\n❌ Not enough ALGO!")
        print(f"   You have: {your_balance:.4f} ALGO")
        print(f"   You need: ~{amount_algo + 0.1:.4f} ALGO (bounty + fees)")
        return False
    
    if not confirm("\n✅ Create this bounty? (y/n): "):
        print("❌ Cancelled")
        return False
    
    # Create transaction
    print("\n📤 Creating bounty...")
    sp = algod_client.suggested_params()
    deadline = int(time.time()) + 604800  # 7 days
    
    pay_txn = transaction.PaymentTxn(
        sender=address,
        sp=sp,
        receiver=app_address,
        amt=amount_micro
    )
    
    app_txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[
            b"create_bounty",
            amount_micro.to_bytes(8, 'big'),
            deadline.to_bytes(8, 'big'),
            task.encode()
        ],
        accounts=[address]  # Using self as verifier
    )
    
    gid = transaction.calculate_group_id([pay_txn, app_txn])
    pay_txn.group = gid
    app_txn.group = gid
    
    try:
        txid = algod_client.send_transactions([
            pay_txn.sign(private_key),
            app_txn.sign(private_key)
        ])
        print("⏳ Confirming (this takes ~5 seconds)...")
        wait_for_confirmation(algod_client, txid, 10)
        
        new_balance = get_balance(address)
        escrow_balance = get_balance(app_address)
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY CREATED SUCCESSFULLY!")
        print("=" * 80)
        print(f"\n✅ {amount_algo} ALGO locked in escrow")
        print(f"✅ Status: OPEN")
        print(f"\n💰 New Balances:")
        print(f"   Your Wallet: {new_balance:.4f} ALGO")
        print(f"   Escrow:      {escrow_balance:.4f} ALGO")
        print(f"\n🔗 View TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if "already exists" in str(e).lower() or "rejected" in str(e).lower():
            print("\n💡 There might be an existing bounty. Complete it first!")
        return False

def accept_bounty():
    """Accept bounty as freelancer"""
    print_header("🤝 ACCEPT BOUNTY")
    
    print("\n💡 You're accepting as the FREELANCER")
    print("   By accepting, you commit to completing this work")
    
    state = get_contract_state()
    if 'amount' in state and state['amount']:
        amount_algo = state['amount'] / 1_000_000
        print(f"\n💰 Bounty: {amount_algo} ALGO")
    if 'task_desc' in state and state['task_desc']:
        print(f"📝 Task: {state['task_desc']}")
    
    if not confirm("\n✅ Accept this bounty? (y/n): "):
        print("❌ Cancelled")
        return False
    
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
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
        print(f"\n🔗 View TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def approve_work():
    """Approve completed work"""
    print_header("✅ APPROVE WORK")
    
    print("\n💡 You're verifying work quality")
    print("   Only approve if the work meets requirements")
    
    print("\n📋 Quality checklist:")
    print("   ✓ Work meets all requirements")
    print("   ✓ All deliverables provided")
    print("   ✓ Quality is acceptable")
    
    if not confirm("\n✅ Approve this work? (y/n): "):
        print("❌ Cancelled")
        return False
    
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
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
        print(f"✅ Freelancer can now claim payment")
        print(f"\n🔗 View TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def reject_work():
    """Reject work and refund"""
    print_header("🔙 REJECT WORK & REFUND")
    
    print("\n⚠️  You're requesting a refund")
    print("   Money will return from escrow to client")
    
    print("\n💡 Reasons to reject:")
    print("   • Work quality not acceptable")
    print("   • Work not completed")
    print("   • Need to cancel bounty")
    
    balance_before = get_balance(address)
    state = get_contract_state()
    amount = state.get('amount', 0) / 1_000_000 if state.get('amount') else 0
    
    print(f"\n📊 After refund:")
    print(f"   Your wallet: ~{balance_before + amount:.4f} ALGO")
    
    if not confirm("\n⚠️  Reject and refund? (y/n): "):
        print("❌ Cancelled")
        return False
    
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
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
        print(f"\n🔗 View TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def claim_payment():
    """Claim payment as freelancer"""
    print_header("💰 CLAIM PAYMENT")
    
    print("\n💡 You're claiming your payment as FREELANCER")
    print("   Money will transfer from escrow to your wallet")
    
    balance_before = get_balance(address)
    state = get_contract_state()
    amount = state.get('amount', 0) / 1_000_000 if state.get('amount') else 0
    
    print(f"\n📊 After claiming:")
    print(f"   Your wallet: ~{balance_before + amount:.4f} ALGO")
    print(f"   Payment: {amount} ALGO")
    
    if not confirm("\n✅ Claim your payment? (y/n): "):
        print("❌ Cancelled")
        return False
    
    print("\n📤 Sending transaction...")
    sp = algod_client.suggested_params()
    txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
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
        print(f"\n✅ Paid automatically from escrow")
        print(f"✅ Received: {received:.4f} ALGO")
        print(f"✅ Status: CLAIMED")
        print(f"\n🔗 View TX: https://testnet.explorer.perawallet.app/tx/{txid}")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def main():
    """Main menu"""
    print("\n" + "=" * 80)
    print("  🎯 BOUNTY MANAGER - Interactive Smart Contract Tool")
    print("=" * 80)
    print("\n🎯 Manage your bounties step-by-step:")
    print("   • Create bounties (lock money in escrow)")
    print("   • Accept work (commit as freelancer)")
    print("   • Approve/Reject work (verify quality)")
    print("   • Claim payment (get paid!)")
    
    print(f"\n📱 Contract: https://testnet.explorer.perawallet.app/application/{APP_ID}")
    
    input("\n⏸️  Press ENTER to start...")
    
    while True:
        status = show_status()
        
        print_header("🎯 WHAT WOULD YOU LIKE TO DO?")
        
        options = {}
        
        # Determine available actions based on status
        if status in [None, 3, 4]:
            print("\n   1️⃣  Create New Bounty")
            options['1'] = create_bounty
        
        if status == 0:
            print("\n   2️⃣  Accept Bounty (as Freelancer)")
            print("   5️⃣  Reject Bounty (Refund)")
            options['2'] = accept_bounty
            options['5'] = reject_work
        
        if status == 1:
            print("\n   3️⃣  Approve Work (as Verifier)")
            print("   5️⃣  Reject Work (Refund)")
            options['3'] = approve_work
            options['5'] = reject_work
        
        if status == 2:
            print("\n   4️⃣  Claim Payment (as Freelancer)")
            options['4'] = claim_payment
        
        print("\n   0️⃣  Refresh Status")
        print("   9️⃣  Exit")
        
        choice = input("\n👉 Choose action: ").strip()
        
        if choice == '9':
            print("\n" + "=" * 80)
            print("👋 Goodbye! Your contract is still running on the blockchain.")
            print(f"🔗 View anytime: https://testnet.explorer.perawallet.app/application/{APP_ID}")
            print("=" * 80 + "\n")
            break
        
        if choice == '0':
            continue
        
        if choice in options:
            options[choice]()
            input("\n⏸️  Press ENTER to continue...")
        else:
            print("\n❌ Invalid choice! Please try again.")
            time.sleep(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted. Goodbye!")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()


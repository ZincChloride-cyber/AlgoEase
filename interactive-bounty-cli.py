#!/usr/bin/env python3
"""
🎯 INTERACTIVE SMART CONTRACT CLI
Step-by-step guide to use your AlgoEase escrow contract
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import algosdk
import time
import base64

# Your deployed contract
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
    """Print a fancy header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)

def get_balance(addr):
    """Get account balance"""
    try:
        info = algod_client.account_info(addr)
        return info['amount'] / 1_000_000
    except:
        return 0

def get_contract_state():
    """Get current contract state"""
    try:
        app_info = algod_client.application_info(APP_ID)
        global_state = app_info['params']['global-state']
        
        state = {}
        for item in global_state:
            key = base64.b64decode(item['key']).decode('utf-8')
            if item['value']['type'] == 1:  # uint
                state[key] = item['value']['uint']
            else:  # bytes
                try:
                    value = base64.b64decode(item['value']['bytes'])
                    # Try to decode as address
                    try:
                        state[key] = algosdk.encoding.encode_address(value)
                    except:
                        try:
                            state[key] = value.decode('utf-8')
                        except:
                            state[key] = value.hex()
                except:
                    state[key] = item['value']['bytes']
        return state
    except Exception as e:
        return {}

def show_status():
    """Show current contract status"""
    print_header("📊 CURRENT CONTRACT STATUS")
    
    state = get_contract_state()
    status = state.get('status', -1)
    
    status_names = {
        0: "🟢 OPEN - Waiting for freelancer to accept",
        1: "🔵 ACCEPTED - Freelancer is working on it",
        2: "🟣 APPROVED - Ready for freelancer to claim payment",
        3: "✅ CLAIMED - Bounty completed and paid",
        4: "🔙 REFUNDED - Money returned to client"
    }
    
    print(f"\n📱 Contract App ID: {APP_ID}")
    print(f"🏦 Escrow Address: {app_address}")
    print(f"\n🔗 View on Pera: https://testnet.explorer.perawallet.app/application/{APP_ID}")
    
    print(f"\n💰 Balances:")
    your_balance = get_balance(address)
    escrow_balance = get_balance(app_address)
    print(f"   Your Wallet: {your_balance:.4f} ALGO")
    print(f"   Escrow:      {escrow_balance:.4f} ALGO")
    
    if status != -1 and status in status_names:
        print(f"\n📊 Bounty Status: {status_names.get(status, 'UNKNOWN')}")
        
        if 'amount' in state:
            try:
                amount = int(state['amount']) if isinstance(state['amount'], int) else 0
                if amount > 0:
                    amount_algo = amount / 1_000_000
                    print(f"💵 Bounty Amount: {amount_algo} ALGO")
            except:
                pass
        
        if 'client_addr' in state and state['client_addr']:
            print(f"👤 Client: {state['client_addr']}")
        
        if 'freelancer_addr' in state and state['freelancer_addr']:
            print(f"💼 Freelancer: {state['freelancer_addr']}")
        
        if 'verifier_addr' in state and state['verifier_addr']:
            print(f"✅ Verifier: {state['verifier_addr']}")
        
        if 'task_desc' in state and state['task_desc']:
            print(f"📝 Task: {state['task_desc']}")
    else:
        print(f"\n📊 Bounty Status: No active bounty")
    
    print()
    return status

def create_bounty():
    """Create a new bounty"""
    print_header("💼 CREATE NEW BOUNTY")
    
    print("\n💡 You are creating a bounty as a CLIENT")
    print("   This will lock your ALGO in escrow until work is completed or refunded.")
    
    # Get bounty details
    print("\n" + "-" * 80)
    amount_str = input("💰 Enter bounty amount in ALGO (e.g., 0.5): ").strip()
    try:
        amount_algo = float(amount_str)
        amount = int(amount_algo * 1_000_000)
    except:
        print("❌ Invalid amount!")
        return
    
    task = input("📝 Enter task description: ").strip()
    if not task:
        task = "Complete the assigned task"
    
    print(f"\n✅ Using yourself as verifier: {address[:10]}...")
    verifier = address
    
    deadline = int(time.time()) + (7 * 24 * 60 * 60)  # 7 days from now
    
    # Confirm
    print("\n" + "-" * 80)
    print("📋 BOUNTY SUMMARY:")
    print(f"   Amount: {amount_algo} ALGO")
    print(f"   Task: {task}")
    print(f"   Deadline: 7 days from now")
    print(f"   Your Balance: {get_balance(address):.4f} ALGO")
    print(f"   After Creation: ~{get_balance(address) - amount_algo:.4f} ALGO")
    print("-" * 80)
    
    confirm = input("\n⚠️  Create this bounty? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Cancelled")
        return
    
    # Create grouped transactions
    print("\n📤 Creating bounty...")
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
            task.encode()
        ],
        accounts=[verifier]
    )
    
    # Group transactions
    gid = transaction.calculate_group_id([pay_txn, app_txn])
    pay_txn.group = gid
    app_txn.group = gid
    
    # Sign and send
    try:
        signed_pay = pay_txn.sign(private_key)
        signed_app = app_txn.sign(private_key)
        
        txid = algod_client.send_transactions([signed_pay, signed_app])
        print(f"✅ Transaction sent! ID: {txid}")
        print("⏳ Waiting for confirmation...")
        
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY CREATED SUCCESSFULLY!")
        print("=" * 80)
        
        new_balance = get_balance(address)
        escrow_balance = get_balance(app_address)
        
        print(f"\n💰 New Balances:")
        print(f"   Your Wallet: {new_balance:.4f} ALGO")
        print(f"   Escrow:      {escrow_balance:.4f} ALGO")
        
        print(f"\n✅ Your {amount_algo} ALGO is now locked in escrow")
        print(f"✅ Status changed to: OPEN")
        print(f"✅ Waiting for freelancer to accept")
        
        print(f"\n🔗 View Transaction:")
        print(f"   https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if "already exists" in str(e) or "transaction rejected" in str(e):
            print("\n💡 There's already an active bounty. Complete it first!")

def accept_bounty():
    """Accept a bounty as freelancer"""
    print_header("🤝 ACCEPT BOUNTY (As Freelancer)")
    
    state = get_contract_state()
    
    if 'amount' in state and state['amount'] > 0:
        amount_algo = state['amount'] / 1_000_000
        print(f"\n💼 Bounty Details:")
        print(f"   Amount: {amount_algo} ALGO")
        if 'task_desc' in state:
            print(f"   Task: {state['task_desc']}")
    
    print("\n💡 By accepting, you commit to completing this bounty")
    print("   You'll be able to claim payment after work is approved")
    
    confirm = input("\n⚠️  Accept this bounty? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Cancelled")
        return
    
    print("\n📤 Accepting bounty...")
    sp = algod_client.suggested_params()
    
    txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"accept_bounty"]
    )
    
    try:
        signed = txn.sign(private_key)
        txid = algod_client.send_transaction(signed)
        print(f"✅ Transaction sent! ID: {txid}")
        print("⏳ Waiting for confirmation...")
        
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY ACCEPTED!")
        print("=" * 80)
        
        print(f"\n✅ You are now committed to this bounty")
        print(f"✅ Status changed to: ACCEPTED")
        print(f"✅ Complete the work and submit for approval")
        
        print(f"\n🔗 View Transaction:")
        print(f"   https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def approve_bounty():
    """Approve completed work"""
    print_header("✅ APPROVE BOUNTY (As Verifier)")
    
    state = get_contract_state()
    
    if 'amount' in state and state['amount'] > 0:
        amount_algo = state['amount'] / 1_000_000
        print(f"\n💼 Bounty Details:")
        print(f"   Amount: {amount_algo} ALGO")
        if 'task_desc' in state:
            print(f"   Task: {state['task_desc']}")
        if 'freelancer_addr' in state:
            print(f"   Freelancer: {state['freelancer_addr']}")
    
    print("\n💡 Imagine the freelancer has submitted their completed work")
    print("   Review the work quality and approve if satisfactory")
    print("\n📋 Checklist:")
    print("   ✓ Work meets requirements")
    print("   ✓ Quality is acceptable")
    print("   ✓ All deliverables provided")
    
    confirm = input("\n⚠️  Approve this work? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Cancelled")
        return
    
    print("\n📤 Approving bounty...")
    sp = algod_client.suggested_params()
    
    txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"approve_bounty"]
    )
    
    try:
        signed = txn.sign(private_key)
        txid = algod_client.send_transaction(signed)
        print(f"✅ Transaction sent! ID: {txid}")
        print("⏳ Waiting for confirmation...")
        
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 WORK APPROVED!")
        print("=" * 80)
        
        print(f"\n✅ Work quality verified")
        print(f"✅ Status changed to: APPROVED")
        print(f"✅ Freelancer can now claim payment")
        
        print(f"\n🔗 View Transaction:")
        print(f"   https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def claim_bounty():
    """Claim payment as freelancer"""
    print_header("💰 CLAIM PAYMENT (As Freelancer)")
    
    state = get_contract_state()
    
    if 'amount' in state and state['amount'] > 0:
        amount_algo = state['amount'] / 1_000_000
        print(f"\n💰 Payment Amount: {amount_algo} ALGO")
    
    balance_before = get_balance(address)
    escrow_before = get_balance(app_address)
    
    print(f"\n📊 Current Balances:")
    print(f"   Your Wallet: {balance_before:.4f} ALGO")
    print(f"   Escrow:      {escrow_before:.4f} ALGO")
    
    print(f"\n💡 After claiming:")
    print(f"   Your Wallet: ~{balance_before + amount_algo:.4f} ALGO")
    print(f"   Escrow:      ~{escrow_before - amount_algo:.4f} ALGO")
    
    confirm = input("\n⚠️  Claim your payment? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Cancelled")
        return
    
    print("\n📤 Claiming payment...")
    sp = algod_client.suggested_params()
    
    txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"claim"]
    )
    
    try:
        signed = txn.sign(private_key)
        txid = algod_client.send_transaction(signed)
        print(f"✅ Transaction sent! ID: {txid}")
        print("⏳ Waiting for confirmation...")
        
        wait_for_confirmation(algod_client, txid, 10)
        
        balance_after = get_balance(address)
        escrow_after = get_balance(app_address)
        received = balance_after - balance_before
        
        print("\n" + "=" * 80)
        print("🎉 PAYMENT RECEIVED!")
        print("=" * 80)
        
        print(f"\n💰 New Balances:")
        print(f"   Your Wallet: {balance_after:.4f} ALGO  (+{received:.4f})")
        print(f"   Escrow:      {escrow_after:.4f} ALGO")
        
        print(f"\n✅ Payment automatically transferred from escrow")
        print(f"✅ Status changed to: CLAIMED")
        print(f"✅ Bounty completed successfully!")
        
        print(f"\n🔗 View Transaction:")
        print(f"   https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def reject_bounty():
    """Reject/refund a bounty"""
    print_header("🔙 REJECT BOUNTY (Refund to Client)")
    
    state = get_contract_state()
    
    if 'amount' in state and state['amount'] > 0:
        amount_algo = state['amount'] / 1_000_000
        print(f"\n💰 Refund Amount: {amount_algo} ALGO")
    
    balance_before = get_balance(address)
    escrow_before = get_balance(app_address)
    
    print(f"\n📊 Current Balances:")
    print(f"   Your Wallet: {balance_before:.4f} ALGO")
    print(f"   Escrow:      {escrow_before:.4f} ALGO")
    
    print(f"\n💡 Reasons to reject/refund:")
    print("   • Work quality is not satisfactory")
    print("   • Freelancer didn't complete the task")
    print("   • Need to cancel the bounty")
    
    print(f"\n💡 After refund:")
    print(f"   Your Wallet: ~{balance_before + amount_algo:.4f} ALGO")
    print(f"   Escrow:      ~{escrow_before - amount_algo:.4f} ALGO")
    
    confirm = input("\n⚠️  Refund this bounty? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Cancelled")
        return
    
    print("\n📤 Processing refund...")
    sp = algod_client.suggested_params()
    
    txn = transaction.ApplicationCallTxn(
        sender=address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"refund"]
    )
    
    try:
        signed = txn.sign(private_key)
        txid = algod_client.send_transaction(signed)
        print(f"✅ Transaction sent! ID: {txid}")
        print("⏳ Waiting for confirmation...")
        
        wait_for_confirmation(algod_client, txid, 10)
        
        balance_after = get_balance(address)
        escrow_after = get_balance(app_address)
        received = balance_after - balance_before
        
        print("\n" + "=" * 80)
        print("🎉 REFUND COMPLETED!")
        print("=" * 80)
        
        print(f"\n💰 New Balances:")
        print(f"   Your Wallet: {balance_after:.4f} ALGO  (+{received:.4f})")
        print(f"   Escrow:      {escrow_after:.4f} ALGO")
        
        print(f"\n✅ Money automatically returned from escrow")
        print(f"✅ Status changed to: REFUNDED")
        print(f"✅ You can now create a new bounty")
        
        print(f"\n🔗 View Transaction:")
        print(f"   https://testnet.explorer.perawallet.app/tx/{txid}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def main_menu():
    """Show main menu"""
    while True:
        status = show_status()
        
        print_header("🎯 WHAT WOULD YOU LIKE TO DO?")
        
        print("\n📋 Available Actions:")
        
        if status == 3 or status == 4 or status == -1:
            # Can create new bounty
            print("   1️⃣  Create New Bounty (as Client)")
            print("   9️⃣  Exit")
            
        elif status == 0:
            # Bounty is open
            print("   2️⃣  Accept Bounty (as Freelancer)")
            print("   5️⃣  Reject/Refund Bounty (as Client)")
            print("   9️⃣  Exit")
            
        elif status == 1:
            # Bounty is accepted
            print("   3️⃣  Approve Work (as Verifier)")
            print("   5️⃣  Reject/Refund Bounty (as Client/Verifier)")
            print("   9️⃣  Exit")
            
        elif status == 2:
            # Bounty is approved
            print("   4️⃣  Claim Payment (as Freelancer)")
            print("   9️⃣  Exit")
        
        print()
        choice = input("👉 Enter your choice: ").strip()
        
        if choice == '1':
            create_bounty()
        elif choice == '2' and status == 0:
            accept_bounty()
        elif choice == '3' and status == 1:
            approve_bounty()
        elif choice == '4' and status == 2:
            claim_bounty()
        elif choice == '5' and status in [0, 1]:
            reject_bounty()
        elif choice == '9':
            print("\n👋 Goodbye! Your contract is still running on the blockchain.")
            print(f"🔗 View anytime: https://testnet.explorer.perawallet.app/application/{APP_ID}")
            break
        else:
            print("\n❌ Invalid choice! Please try again.")
        
        input("\n⏸️  Press ENTER to continue...")

# Main program
if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("  🎯 ALGOEASE INTERACTIVE SMART CONTRACT CLI")
    print("=" * 80)
    print("\n💡 This tool guides you step-by-step through:")
    print("   • Creating bounties (lock money in escrow)")
    print("   • Accepting work (freelancer commits)")
    print("   • Approving work (verifier confirms quality)")
    print("   • Claiming payment (winner gets paid)")
    print("   • Rejecting/Refunding (return money to client)")
    
    print(f"\n📱 Your Contract: https://testnet.explorer.perawallet.app/application/{APP_ID}")
    print(f"👤 Your Address: {address}")
    
    input("\n⏸️  Press ENTER to start...")
    
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted. Goodbye!")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")


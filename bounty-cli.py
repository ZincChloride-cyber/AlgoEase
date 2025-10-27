#!/usr/bin/env python3
"""
AlgoEase Bounty CLI - Test your smart contract from terminal!

Features:
- Create bounty (your ALGO → escrow)
- Accept bounty (freelancer commits)
- Approve work (verifier approves)
- Claim payment (winner gets paid from escrow)
- Refund (get your money back if no winner)
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.transaction import wait_for_confirmation
import base64
import os
import sys
from datetime import datetime, timedelta

# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

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

# Initialize client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def get_application_address(app_id):
    """Get the escrow address of the smart contract"""
    import algosdk
    return algosdk.logic.get_application_address(app_id)

def decode_state(state_array):
    """Decode the global state"""
    state = {}
    for item in state_array:
        key = base64.b64decode(item['key']).decode('utf-8')
        value = item['value']
        
        if value['type'] == 1:  # uint
            state[key] = value['uint']
        elif value['type'] == 2:  # bytes
            try:
                state[key] = base64.b64decode(value['bytes']).decode('utf-8')
            except:
                state[key] = base64.b64decode(value['bytes']).hex()
    
    return state

def get_contract_state():
    """Get current bounty state"""
    try:
        app_info = algod_client.application_info(APP_ID)
        if 'params' in app_info and 'global-state' in app_info['params']:
            return decode_state(app_info['params']['global-state'])
        return {}
    except Exception as e:
        print(f"Error getting state: {e}")
        return {}

def print_state():
    """Display current bounty state"""
    state = get_contract_state()
    
    status_map = {
        0: "🟢 OPEN",
        1: "🔵 ACCEPTED", 
        2: "🟣 APPROVED",
        3: "✅ CLAIMED",
        4: "🔴 REFUNDED"
    }
    
    print("\n" + "=" * 80)
    print("📊 CURRENT BOUNTY STATE")
    print("=" * 80)
    
    if not state or 'bounty_count' not in state:
        print("❌ No bounty created yet")
        print("=" * 80)
        return
    
    bounty_count = state.get('bounty_count', 0)
    if isinstance(bounty_count, str):
        bounty_count = int(bounty_count) if bounty_count.isdigit() else 0
    
    if bounty_count == 0:
        print("❌ No bounty created yet")
        print("=" * 80)
        return
    
    print(f"Total Bounties:     {bounty_count}")
    
    status = state.get('status', -1)
    if isinstance(status, str):
        status = int(status) if status.isdigit() else -1
    print(f"Status:             {status_map.get(status, 'Unknown')}")
    
    # Convert amount safely
    amount = state.get('amount', 0)
    if isinstance(amount, str):
        amount = int(amount) if amount.isdigit() else 0
    print(f"💰 Escrow Amount:    {amount / 1_000_000} ALGO")
    
    print(f"👤 Client:           {state.get('client_addr', 'N/A')}")
    print(f"✓ Verifier:          {state.get('verifier_addr', 'N/A')}")
    
    if state.get('freelancer_addr'):
        print(f"👨‍💻 Freelancer:       {state.get('freelancer_addr')}")
    
    if state.get('deadline'):
        from datetime import datetime
        deadline_val = state['deadline']
        if isinstance(deadline_val, str):
            deadline_val = int(deadline_val) if deadline_val.isdigit() else 0
        if deadline_val > 0:
            deadline = datetime.fromtimestamp(deadline_val)
            print(f"⏰ Deadline:         {deadline.strftime('%Y-%m-%d %H:%M:%S')}")
    
    if state.get('task_desc'):
        print(f"📝 Task:             {state.get('task_desc')}")
    
    print("=" * 80 + "\n")

def create_bounty(creator_mnemonic, amount_algo, task_description):
    """Create a new bounty - Money goes to escrow!"""
    print("\n🎯 CREATING BOUNTY...")
    print("=" * 80)
    
    # Get account from mnemonic
    private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(private_key)
    
    print(f"👤 Creator: {creator_address}")
    print(f"💰 Amount: {amount_algo} ALGO")
    print(f"📝 Task: {task_description}")
    
    # Check balance
    account_info = algod_client.account_info(creator_address)
    balance = account_info['amount'] / 1_000_000
    print(f"💳 Your balance: {balance} ALGO")
    
    if balance < amount_algo + 0.1:  # Need extra for fees
        print(f"❌ Insufficient funds! Need at least {amount_algo + 0.1} ALGO")
        return False
    
    # Get suggested params
    sp = algod_client.suggested_params()
    
    # Calculate values
    amount_microalgo = int(amount_algo * 1_000_000)
    deadline = int((datetime.now() + timedelta(days=7)).timestamp())
    app_address = get_application_address(APP_ID)
    
    print(f"🏦 Escrow Address: {app_address}")
    print(f"⏰ Deadline: 7 days from now")
    
    # Transaction 1: Payment to contract (escrow)
    pay_txn = transaction.PaymentTxn(
        sender=creator_address,
        sp=sp,
        receiver=app_address,
        amt=amount_microalgo
    )
    
    # Transaction 2: App call to create bounty
    app_args = [
        b"create_bounty",
        amount_microalgo.to_bytes(8, 'big'),
        deadline.to_bytes(8, 'big'),
        task_description.encode()
    ]
    
    app_call_txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=app_args,
        accounts=[creator_address]  # Verifier = creator
    )
    
    # Group transactions
    gid = transaction.calculate_group_id([pay_txn, app_call_txn])
    pay_txn.group = gid
    app_call_txn.group = gid
    
    # Sign both
    signed_pay = pay_txn.sign(private_key)
    signed_app = app_call_txn.sign(private_key)
    
    print("\n📤 Sending transactions...")
    
    try:
        # Send group
        txid = algod_client.send_transactions([signed_pay, signed_app])
        print(f"✅ Transaction ID: {txid}")
        
        # Wait for confirmation
        print("⏳ Waiting for confirmation...")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY CREATED SUCCESSFULLY!")
        print("=" * 80)
        print(f"💰 {amount_algo} ALGO is now in ESCROW")
        print(f"🔒 Funds are locked in contract address: {app_address}")
        print("=" * 80)
        
        print_state()
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

def accept_bounty(freelancer_mnemonic):
    """Accept a bounty (freelancer commits to work)"""
    print("\n🤝 ACCEPTING BOUNTY...")
    print("=" * 80)
    
    private_key = mnemonic.to_private_key(freelancer_mnemonic)
    freelancer_address = account.address_from_private_key(private_key)
    
    print(f"👨‍💻 Freelancer: {freelancer_address}")
    
    sp = algod_client.suggested_params()
    
    app_call_txn = transaction.ApplicationCallTxn(
        sender=freelancer_address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"accept_bounty"]
    )
    
    signed_txn = app_call_txn.sign(private_key)
    
    try:
        txid = algod_client.send_transaction(signed_txn)
        print(f"✅ Transaction ID: {txid}")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n🎉 BOUNTY ACCEPTED!")
        print_state()
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def approve_bounty(verifier_mnemonic):
    """Approve completed work"""
    print("\n✅ APPROVING WORK...")
    print("=" * 80)
    
    private_key = mnemonic.to_private_key(verifier_mnemonic)
    verifier_address = account.address_from_private_key(private_key)
    
    print(f"✓ Verifier: {verifier_address}")
    
    sp = algod_client.suggested_params()
    
    app_call_txn = transaction.ApplicationCallTxn(
        sender=verifier_address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"approve_bounty"]
    )
    
    signed_txn = app_call_txn.sign(private_key)
    
    try:
        txid = algod_client.send_transaction(signed_txn)
        print(f"✅ Transaction ID: {txid}")
        wait_for_confirmation(algod_client, txid, 10)
        
        print("\n🎉 WORK APPROVED!")
        print_state()
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def claim_bounty(freelancer_mnemonic):
    """Claim payment from escrow"""
    print("\n💸 CLAIMING PAYMENT...")
    print("=" * 80)
    
    private_key = mnemonic.to_private_key(freelancer_mnemonic)
    freelancer_address = account.address_from_private_key(private_key)
    
    print(f"👨‍💻 Freelancer: {freelancer_address}")
    
    # Check balance before
    account_info = algod_client.account_info(freelancer_address)
    balance_before = account_info['amount'] / 1_000_000
    print(f"💳 Balance before: {balance_before} ALGO")
    
    sp = algod_client.suggested_params()
    
    app_call_txn = transaction.ApplicationCallTxn(
        sender=freelancer_address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"claim"]
    )
    
    signed_txn = app_call_txn.sign(private_key)
    
    try:
        txid = algod_client.send_transaction(signed_txn)
        print(f"✅ Transaction ID: {txid}")
        wait_for_confirmation(algod_client, txid, 10)
        
        # Check balance after
        account_info = algod_client.account_info(freelancer_address)
        balance_after = account_info['amount'] / 1_000_000
        received = balance_after - balance_before
        
        print("\n" + "=" * 80)
        print("🎉 PAYMENT CLAIMED FROM ESCROW!")
        print("=" * 80)
        print(f"💰 Received: ~{received:.2f} ALGO")
        print(f"💳 New balance: {balance_after} ALGO")
        print("=" * 80)
        
        print_state()
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def refund_bounty(creator_mnemonic):
    """Refund bounty to creator"""
    print("\n🔄 REFUNDING BOUNTY...")
    print("=" * 80)
    
    private_key = mnemonic.to_private_key(creator_mnemonic)
    creator_address = account.address_from_private_key(private_key)
    
    print(f"👤 Creator: {creator_address}")
    
    # Check balance before
    account_info = algod_client.account_info(creator_address)
    balance_before = account_info['amount'] / 1_000_000
    print(f"💳 Balance before: {balance_before} ALGO")
    
    sp = algod_client.suggested_params()
    
    app_call_txn = transaction.ApplicationCallTxn(
        sender=creator_address,
        sp=sp,
        index=APP_ID,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"refund"]
    )
    
    signed_txn = app_call_txn.sign(private_key)
    
    try:
        txid = algod_client.send_transaction(signed_txn)
        print(f"✅ Transaction ID: {txid}")
        wait_for_confirmation(algod_client, txid, 10)
        
        # Check balance after
        account_info = algod_client.account_info(creator_address)
        balance_after = account_info['amount'] / 1_000_000
        refunded = balance_after - balance_before
        
        print("\n" + "=" * 80)
        print("🎉 BOUNTY REFUNDED FROM ESCROW!")
        print("=" * 80)
        print(f"💰 Refunded: ~{refunded:.2f} ALGO")
        print(f"💳 New balance: {balance_after} ALGO")
        print("=" * 80)
        
        print_state()
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main_menu():
    """Interactive CLI menu"""
    print("\n" + "=" * 80)
    print("🎯 ALGOEASE BOUNTY CLI - ESCROW SMART CONTRACT")
    print("=" * 80)
    print(f"📱 App ID: {APP_ID}")
    print(f"🏦 Escrow Address: {get_application_address(APP_ID)}")
    print(f"🌐 Network: Algorand TestNet")
    print("=" * 80)
    
    print_state()
    
    print("\n📋 AVAILABLE ACTIONS:")
    print("=" * 80)
    print("1. 💰 Create Bounty (Your ALGO → Escrow)")
    print("2. 🤝 Accept Bounty (Commit to work)")
    print("3. ✅ Approve Work (Verifier approves)")
    print("4. 💸 Claim Payment (Winner gets paid from escrow)")
    print("5. 🔄 Refund (Get your money back)")
    print("6. 📊 Check Status")
    print("0. Exit")
    print("=" * 80)
    
    choice = input("\nChoose an action (0-6): ").strip()
    
    if choice == "1":
        amount = float(input("💰 Enter bounty amount in ALGO (e.g., 2.5): "))
        task = input("📝 Enter task description: ")
        create_bounty(CREATOR_MNEMONIC, amount, task)
    
    elif choice == "2":
        print("\n💡 Using creator account as freelancer for testing")
        accept_bounty(CREATOR_MNEMONIC)
    
    elif choice == "3":
        approve_bounty(CREATOR_MNEMONIC)
    
    elif choice == "4":
        claim_bounty(CREATOR_MNEMONIC)
    
    elif choice == "5":
        refund_bounty(CREATOR_MNEMONIC)
    
    elif choice == "6":
        print_state()
    
    elif choice == "0":
        print("\n👋 Goodbye!")
        sys.exit(0)
    
    else:
        print("❌ Invalid choice")
    
    input("\nPress Enter to continue...")
    main_menu()

if __name__ == "__main__":
    if not CREATOR_MNEMONIC:
        print("❌ No mnemonic found in frontend/.env")
        print("Please make sure frontend/.env exists with REACT_APP_CREATOR_MNEMONIC")
        sys.exit(1)
    
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")


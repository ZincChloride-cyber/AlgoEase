"""
Direct bounty creation test - bypassing frontend
This will attempt to create a minimal bounty to test if the contract allows it
"""
from algosdk import account, mnemonic, transaction, encoding
from algosdk.v2client import algod
from algosdk.logic import get_application_address
import time

# Configuration
APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Your credentials
MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def main():
    print("\n" + "="*70)
    print("🧪 DIRECT BOUNTY CREATION TEST")
    print("="*70 + "\n")
    print("This will attempt to create a 0.5 ALGO test bounty directly")
    print("to see if the contract allows new bounties.\n")
    
    try:
        # Initialize
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        private_key = mnemonic.to_private_key(MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        print(f"✅ Your address: {address}")
        
        # Check balance
        account_info = algod_client.account_info(address)
        balance = account_info['amount'] / 1_000_000
        print(f"💰 Your balance: {balance} ALGO\n")
        
        if balance < 1.0:
            print("❌ Insufficient balance. You need at least 1 ALGO")
            return
        
        # Get contract address using correct algosdk function
        app_address = get_application_address(APP_ID)
        print(f"📝 Contract address: {app_address}")
        print(f"📝 App ID: {APP_ID}\n")
        
        # Bounty parameters
        bounty_amount_microalgos = 500_000  # 0.5 ALGO
        deadline_timestamp = int(time.time()) + 3600  # 1 hour from now
        task_description = b"Test bounty - verifying contract accepts new bounties"
        verifier = address  # You are the verifier
        
        print(f"📋 Bounty Details:")
        print(f"   Amount: {bounty_amount_microalgos / 1_000_000} ALGO")
        print(f"   Deadline: {deadline_timestamp} ({time.ctime(deadline_timestamp)})")
        print(f"   Task: {task_description.decode()}")
        print(f"   Verifier: {verifier}\n")
        
        # Get suggested parameters
        print("🔄 Getting suggested parameters...")
        params = algod_client.suggested_params()
        
        # Transaction 1: Payment to contract
        print("📤 Creating payment transaction...")
        payment_txn = transaction.PaymentTxn(
            sender=address,
            sp=params,
            receiver=app_address,
            amt=bounty_amount_microalgos,
            note=b"AlgoEase: Test Bounty Payment"
        )
        
        # Transaction 2: App call to create bounty
        print("📤 Creating app call transaction...")
        
        app_args = [
            b"create_bounty",
            bounty_amount_microalgos.to_bytes(8, 'big'),
            deadline_timestamp.to_bytes(8, 'big'),
            task_description
        ]
        
        app_call_txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=app_args,
            accounts=[verifier],  # Pass verifier in accounts array
            note=b"AlgoEase: Create Test Bounty"
        )
        
        # Group transactions
        print("🔗 Grouping transactions...")
        gid = transaction.calculate_group_id([payment_txn, app_call_txn])
        payment_txn.group = gid
        app_call_txn.group = gid
        
        # Sign transactions
        print("🔑 Signing transactions...")
        signed_payment = payment_txn.sign(private_key)
        signed_app_call = app_call_txn.sign(private_key)
        
        # Send transactions
        print("📡 Sending transactions to blockchain...\n")
        tx_id = algod_client.send_transactions([signed_payment, signed_app_call])
        print(f"   Transaction ID: {tx_id}")
        
        # Wait for confirmation
        print("⏳ Waiting for confirmation...\n")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print("="*70)
        print("✅ SUCCESS! BOUNTY CREATED!")
        print("="*70)
        print(f"💰 Amount: 0.5 ALGO")
        print(f"📍 Round: {confirmed_txn['confirmed-round']}")
        print(f"🔗 View: https://testnet.explorer.perawallet.app/tx/{tx_id}")
        print("\n🎉 The stuck state has been cleared!")
        print("   Creating this bounty overwrote all the old state variables.")
        print("   You can now use the frontend normally.")
        print("="*70 + "\n")
        
        # Show new state
        print("📊 Checking new contract state...")
        app_info = algod_client.application_info(APP_ID)
        print("\nNew Global State:")
        import base64
        for item in app_info['params']['global-state']:
            key = base64.b64decode(item['key']).decode('utf-8', errors='ignore')
            if item['value']['type'] == 2:
                value = item['value']['uint']
                print(f"   {key}: {value}")
        print()
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ ERROR: {error_msg}\n")
        
        if "assert failed" in error_msg.lower():
            print("💡 The contract rejected the transaction.")
            print("\n🔍 Possible reasons:")
            print("   1. ensure_no_active_bounty() returned False")
            print("   2. Payment receiver doesn't match contract address")
            print("   3. Group transaction order is wrong")
            print("   4. Some other assertion in the contract failed")
            
            # Parse the error for more details
            if "pc=" in error_msg:
                import re
                match = re.search(r'pc=(\d+)', error_msg)
                if match:
                    pc = match.group(1)
                    print(f"\n   Failed at program counter: {pc}")
                    print(f"   This is a specific point in the TEAL contract code.")
            
            print("\n📝 The most likely issue:")
            print("   The ensure_no_active_bounty() check is failing even though")
            print("   status = REFUNDED (4), because amount = 4000000.")
            print("\n   This suggests the contract has a BUG where the OR logic")
            print("   isn't working as expected, or there's an additional check")
            print("   we're missing.")
            print("\n⚠️  WORKAROUND:")
            print("   Contact the contract creator to fix the state manually")
            print("   or deploy a new contract with a fix for this issue.\n")
        
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

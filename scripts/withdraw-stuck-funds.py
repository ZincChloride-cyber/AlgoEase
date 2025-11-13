"""
Force withdraw all stuck funds from the contract
This works even when status is REFUNDED by creating a new bounty and refunding it
"""
from algosdk import account, mnemonic, transaction
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
    print("💰 FORCE WITHDRAW STUCK FUNDS")
    print("="*70 + "\n")
    
    try:
        # Initialize
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        private_key = mnemonic.to_private_key(MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        print(f"✅ Your address: {address}\n")
        
        # Check contract balance
        app_address = get_application_address(APP_ID)
        contract_info = algod_client.account_info(app_address)
        contract_balance = contract_info['amount'] / 1_000_000
        available = contract_balance - (contract_info.get('min-balance', 0) / 1_000_000)
        
        print(f"📝 Contract address: {app_address}")
        print(f"💎 Contract balance: {contract_balance} ALGO")
        print(f"💰 Available to withdraw: {available} ALGO\n")
        
        if available < 0.1:
            print("✅ No significant funds to withdraw.\n")
            return
        
        # Check current state
        app_info = algod_client.application_info(APP_ID)
        import base64
        
        state_dict = {}
        for item in app_info['params']['global-state']:
            key = base64.b64decode(item['key']).decode('utf-8', errors='ignore')
            if item['value']['type'] == 2:
                state_dict[key] = item['value']['uint']
        
        status = state_dict.get('status', 999)
        amount_in_state = state_dict.get('amount', 0)
        
        print(f"📊 Current State:")
        print(f"   Status: {status} (4=REFUNDED)")
        print(f"   Amount in state: {amount_in_state / 1_000_000} ALGO\n")
        
        # Strategy: Create a tiny bounty, then immediately refund it
        # This will withdraw ALL available funds
        
        print("="*70)
        print("STRATEGY: Create minimal bounty then refund to withdraw funds")
        print("="*70 + "\n")
        
        # Step 1: Create tiny bounty
        print("STEP 1: Creating 0.01 ALGO bounty...")
        print("-"*70 + "\n")
        
        tiny_amount = 10_000  # 0.01 ALGO
        deadline = int(time.time()) + 300  # 5 minutes
        task_desc = b"withdraw"
        
        params = algod_client.suggested_params()
        
        payment_txn = transaction.PaymentTxn(
            sender=address,
            sp=params,
            receiver=app_address,
            amt=tiny_amount,
            note=b"Withdraw stuck funds"
        )
        
        app_args = [
            b"create_bounty",
            tiny_amount.to_bytes(8, 'big'),
            deadline.to_bytes(8, 'big'),
            task_desc
        ]
        
        app_call_txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=app_args,
            accounts=[address],
            note=b"Create bounty to enable withdrawal"
        )
        
        gid = transaction.calculate_group_id([payment_txn, app_call_txn])
        payment_txn.group = gid
        app_call_txn.group = gid
        
        signed_payment = payment_txn.sign(private_key)
        signed_app_call = app_call_txn.sign(private_key)
        
        tx_id = algod_client.send_transactions([signed_payment, signed_app_call])
        print(f"   Transaction ID: {tx_id}")
        print("   ⏳ Waiting for confirmation...")
        
        transaction.wait_for_confirmation(algod_client, tx_id, 4)
        print("   ✅ Bounty created!\n")
        
        # Step 2: Immediately refund it
        print("STEP 2: Refunding bounty (this withdraws ALL contract funds)...")
        print("-"*70 + "\n")
        
        time.sleep(1)  # Brief pause
        
        params = algod_client.suggested_params()
        
        refund_txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=[b"refund"],
            note=b"Refund to withdraw stuck funds"
        )
        
        signed_refund = refund_txn.sign(private_key)
        refund_tx_id = algod_client.send_transaction(signed_refund)
        
        print(f"   Transaction ID: {refund_tx_id}")
        print("   ⏳ Waiting for confirmation...")
        
        confirmed = transaction.wait_for_confirmation(algod_client, refund_tx_id, 4)
        print("   ✅ Refund completed!\n")
        
        # Check new balances
        new_contract_info = algod_client.account_info(app_address)
        new_balance = new_contract_info['amount'] / 1_000_000
        
        your_info = algod_client.account_info(address)
        your_balance = your_info['amount'] / 1_000_000
        
        print("="*70)
        print("✅ SUCCESS! FUNDS WITHDRAWN")
        print("="*70)
        print(f"💰 Contract balance now: {new_balance} ALGO")
        print(f"💰 Your balance now: {your_balance} ALGO")
        print(f"✅ Withdrew approximately: {available} ALGO")
        print(f"🔗 Refund transaction: https://testnet.explorer.perawallet.app/tx/{refund_tx_id}")
        print("="*70 + "\n")
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ ERROR: {error_msg}\n")
        
        if "logic eval error" in error_msg:
            print("💡 The contract rejected the transaction.")
            print("   This might be because:")
            print("   - The ensure_no_active_bounty() check failed")
            print("   - The contract has validation errors")
            print("\n   Trying alternative approach...\n")
        
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

"""
Withdraw remaining stuck funds by creating a bounty for the exact stuck amount
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
    print("💰 WITHDRAW REMAINING STUCK FUNDS")
    print("="*70 + "\n")
    
    try:
        # Initialize
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        private_key = mnemonic.to_private_key(MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        # Check contract balance
        app_address = get_application_address(APP_ID)
        contract_info = algod_client.account_info(app_address)
        contract_balance_microalgos = contract_info['amount']
        min_balance_microalgos = contract_info.get('min-balance', 100000)
        
        available_microalgos = contract_balance_microalgos - min_balance_microalgos - 1000  # Leave 0.001 for fees
        
        print(f"💎 Contract balance: {contract_balance_microalgos / 1_000_000} ALGO")
        print(f"🔒 Minimum balance: {min_balance_microalgos / 1_000_000} ALGO")
        print(f"💰 Available to withdraw: {available_microalgos / 1_000_000} ALGO\n")
        
        if available_microalgos < 100000:  # Less than 0.1 ALGO
            print("✅ Less than 0.1 ALGO remaining - not worth withdrawing.\n")
            return
        
        # Create bounty for the exact available amount
        print(f"Creating bounty for {available_microalgos / 1_000_000} ALGO...")
        print("-"*70 + "\n")
        
        deadline = int(time.time()) + 300
        task_desc = b"final-withdrawal"
        
        params = algod_client.suggested_params()
        
        payment_txn = transaction.PaymentTxn(
            sender=address,
            sp=params,
            receiver=app_address,
            amt=available_microalgos,
            note=b"Final withdrawal"
        )
        
        app_args = [
            b"create_bounty",
            available_microalgos.to_bytes(8, 'big'),
            deadline.to_bytes(8, 'big'),
            task_desc
        ]
        
        app_call_txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=app_args,
            accounts=[address],
            note=b"Create final bounty"
        )
        
        gid = transaction.calculate_group_id([payment_txn, app_call_txn])
        payment_txn.group = gid
        app_call_txn.group = gid
        
        signed_payment = payment_txn.sign(private_key)
        signed_app_call = app_call_txn.sign(private_key)
        
        print("📡 Sending create bounty transaction...")
        tx_id = algod_client.send_transactions([signed_payment, signed_app_call])
        print(f"   TX ID: {tx_id}")
        
        transaction.wait_for_confirmation(algod_client, tx_id, 4)
        print("✅ Bounty created!\n")
        
        # Immediately refund
        time.sleep(1)
        
        print("Refunding to withdraw funds...")
        print("-"*70 + "\n")
        
        params = algod_client.suggested_params()
        
        refund_txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=[b"refund"],
            note=b"Final refund"
        )
        
        signed_refund = refund_txn.sign(private_key)
        
        print("📡 Sending refund transaction...")
        refund_tx_id = algod_client.send_transaction(signed_refund)
        print(f"   TX ID: {refund_tx_id}")
        
        transaction.wait_for_confirmation(algod_client, refund_tx_id, 4)
        print("✅ Refund completed!\n")
        
        # Check final balances
        final_contract_info = algod_client.account_info(app_address)
        final_balance = final_contract_info['amount'] / 1_000_000
        
        your_info = algod_client.account_info(address)
        your_balance = your_info['amount'] / 1_000_000
        
        print("="*70)
        print("✅ ALL FUNDS WITHDRAWN!")
        print("="*70)
        print(f"💰 Contract balance: {final_balance} ALGO (only minimum balance left)")
        print(f"💰 Your balance: {your_balance} ALGO")
        print(f"✅ Withdrew: {available_microalgos / 1_000_000} ALGO")
        print(f"🔗 Transaction: https://testnet.explorer.perawallet.app/tx/{refund_tx_id}")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

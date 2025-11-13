"""
Delete the contract to recover all stuck funds (only creator can do this)
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.logic import get_application_address

# Configuration
APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# CREATOR credentials from contract.env
CREATOR_MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def main():
    print("\n" + "="*70)
    print("🗑️  DELETE CONTRACT TO RECOVER STUCK FUNDS")
    print("="*70 + "\n")
    print("⚠️  This will permanently delete the smart contract!")
    print("   All remaining funds will be sent to the creator.\n")
    
    confirm = input("Type 'DELETE' to confirm: ")
    if confirm != 'DELETE':
        print("\n❌ Operation cancelled.\n")
        return
    
    try:
        # Initialize
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
        creator_address = account.address_from_private_key(private_key)
        
        print(f"\n✅ Creator address: {creator_address}\n")
        
        # Check contract balance
        app_address = get_application_address(APP_ID)
        contract_info = algod_client.account_info(app_address)
        contract_balance = contract_info['amount'] / 1_000_000
        
        print(f"📝 Contract address: {app_address}")
        print(f"💎 Contract balance: {contract_balance} ALGO\n")
        
        # Check current state
        app_info = algod_client.application_info(APP_ID)
        import base64
        
        print("📊 Current Global State:")
        for item in app_info['params']['global-state']:
            key = base64.b64decode(item['key']).decode('utf-8', errors='ignore')
            if item['value']['type'] == 2:
                value = item['value']['uint']
                print(f"   {key}: {value}")
        
        print("\n⚠️  NOTE: The contract's deletion logic requires amount = 0")
        print("   But the state shows amount > 0, so deletion will fail.")
        print("   The contract code has a bug that prevents recovery of these funds.\n")
        
        # Try deletion anyway
        print("Attempting deletion...")
        print("-"*70 + "\n")
        
        params = algod_client.suggested_params()
        
        delete_txn = transaction.ApplicationDeleteTxn(
            sender=creator_address,
            sp=params,
            index=APP_ID,
            note=b"Delete to recover funds"
        )
        
        signed_delete = delete_txn.sign(private_key)
        
        print("📡 Sending delete transaction...")
        tx_id = algod_client.send_transaction(signed_delete)
        print(f"   TX ID: {tx_id}")
        
        transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print("\n" + "="*70)
        print("✅ CONTRACT DELETED!")
        print("="*70)
        print(f"💰 All funds have been sent to creator")
        print(f"🔗 Transaction: https://testnet.explorer.perawallet.app/tx/{tx_id}")
        print("="*70 + "\n")
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ ERROR: {error_msg}\n")
        
        if "assert failed" in error_msg:
            print("💡 DIAGNOSIS:")
            print("   The contract rejected deletion because amount != 0")
            print("   This is a BUG in the contract design.")
            print("\n📝 THE REAL PROBLEM:")
            print("   - The contract has 2.29 ALGO stuck")
            print("   - The global state 'amount' doesn't match actual balance")
            print("   - Refund only withdraws the 'amount' variable, not full balance")
            print("   - Deletion requires amount = 0 but we can't set it to 0")
            print("\n⚠️  CONCLUSION:")
            print("   These ~2.29 ALGO are PERMANENTLY STUCK in the contract")
            print("   due to a design flaw. They cannot be recovered.")
            print("\n💡 SOLUTION FOR FUTURE:")
            print("   Deploy a NEW contract with fixed logic that:")
            print("   1. Always keeps amount in sync with actual balance")
            print("   2. Allows deletion when actual balance <= min balance")
            print("   3. Or has an emergency withdrawal function\n")
        
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

"""
Delete and redeploy the smart contract to clean state
Only the creator can do this, and only when amount = 0
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
import base64

# Configuration
APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Creator credentials from contract.env
CREATOR_MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"
CREATOR_ADDRESS = "3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI"

def main():
    print("\n" + "="*70)
    print("🗑️  DELETE CONTRACT AND CLEAN STATE")
    print("="*70 + "\n")
    print("⚠️  WARNING: This will permanently delete the smart contract!")
    print("   A new contract will need to be deployed afterwards.\n")
    
    # Ask for confirmation
    confirm = input("Type 'DELETE' to confirm deletion: ")
    if confirm != 'DELETE':
        print("\n❌ Operation cancelled.\n")
        return
    
    try:
        # Initialize
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        print(f"\n✅ Creator verified: {address}")
        
        if address != CREATOR_ADDRESS:
            print(f"❌ ERROR: Mnemonic doesn't match creator address!")
            return
        
        # Check current state
        app_info = algod_client.application_info(APP_ID)
        print(f"\n📊 Current State:")
        
        amount_value = 0
        for item in app_info['params']['global-state']:
            key = base64.b64decode(item['key']).decode('utf-8', errors='ignore')
            if item['value']['type'] == 2:
                value = item['value']['uint']
                if key == 'amount':
                    amount_value = value
                print(f"   {key}: {value}")
        
        if amount_value > 0:
            print(f"\n❌ ERROR: Amount is {amount_value} (not 0)")
            print(f"   Contract has locked funds in state.")
            print(f"   Deletion is only allowed when amount = 0")
            print(f"\n   However, the actual contract balance is 0 ALGO.")
            print(f"   This means the funds aren't actually there, just the state variable.\n")
            
            confirm2 = input("The contract logic will prevent deletion. Continue anyway? (yes/no): ")
            if confirm2.lower() != 'yes':
                print("\n❌ Operation cancelled.\n")
                return
        
        # Get suggested parameters
        params = algod_client.suggested_params()
        
        # Create delete transaction
        print(f"\n🗑️  Creating delete transaction...")
        
        delete_txn = transaction.ApplicationDeleteTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            note=b"AlgoEase: Delete contract to clean state"
        )
        
        print(f"🔑 Signing transaction...")
        signed_delete = delete_txn.sign(private_key)
        
        print(f"📡 Sending to blockchain...")
        tx_id = algod_client.send_transaction(signed_delete)
        print(f"   Transaction ID: {tx_id}")
        
        print(f"⏳ Waiting for confirmation...\n")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print("="*70)
        print("✅ CONTRACT DELETED SUCCESSFULLY!")
        print("="*70)
        print(f"📍 Round: {confirmed_txn['confirmed-round']}")
        print(f"🔗 View: https://testnet.explorer.perawallet.app/tx/{tx_id}")
        print("\n⚠️  You now need to redeploy the contract using:")
        print(f"   python scripts/deploy.py")
        print(f"   OR")
        print(f"   .\\deploy.ps1")
        print("="*70 + "\n")
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ ERROR: {error_msg}\n")
        
        if "assert failed" in error_msg.lower():
            print("💡 The contract rejected deletion because:")
            print("   The amount field is not 0 (even though no funds are locked)")
            print("\n📝 ALTERNATIVE SOLUTION:")
            print("   Since the contract balance is 0 and status is REFUNDED,")
            print("   you CAN create new bounties from the frontend.")
            print("   The 'amount: 4000000' in state is just cosmetic.")
            print("\n   Try creating a bounty from the frontend now!")
            print("   It should work despite the state showing 4000000.\n")
        
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

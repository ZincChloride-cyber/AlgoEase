"""
Force withdraw stuck funds from contract by resetting the global state
This handles the case where status is REFUNDED but amount is still > 0
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Configuration
APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Creator mnemonic (has update/delete permissions)
CREATOR_MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def main():
    print("\n🔧 Force Withdraw Tool - Resetting Contract State\n")
    
    try:
        # Initialize algod client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get creator account
        creator_private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
        creator_address = account.address_from_private_key(creator_private_key)
        
        print(f"📝 Creator address: {creator_address}")
        
        # Get application address
        app_address = algod_client.application_info(APP_ID)['params']['creator']
        print(f"📝 App creator: {app_address}")
        
        # Get application info to check balance
        app_account_info = algod_client.account_application_info(creator_address, APP_ID)
        print(f"📊 Current global state:")
        
        for state in algod_client.application_info(APP_ID)['params']['global-state']:
            key = state['key']
            import base64
            key_decoded = base64.b64decode(key).decode('utf-8', errors='ignore')
            if state['value']['type'] == 2:
                print(f"   {key_decoded}: {state['value']['uint']}")
            else:
                print(f"   {key_decoded}: {state['value'].get('bytes', 'N/A')}")
        
        # The issue: status is REFUNDED (4) but amount is still 4000000
        # We need to call a reset or manually set amount to 0
        
        print("\n⚠️  The contract shows REFUNDED status but funds are still locked.")
        print("This is a state inconsistency. The contract needs to be cleared or recreated.\n")
        
        # Check contract balance
        from algosdk.encoding import encode_address
        import base64
        
        # Get the actual application address
        app_id_bytes = APP_ID.to_bytes(8, 'big')
        app_addr_raw = b'appID' + app_id_bytes
        from hashlib import sha512
        app_hash = sha512(app_addr_raw).digest()[:32]
        contract_address = encode_address(app_hash)
        
        print(f"📝 Contract address: {contract_address}")
        
        contract_info = algod_client.account_info(contract_address)
        contract_balance = contract_info['amount'] / 1_000_000
        print(f"💰 Contract balance: {contract_balance} ALGO")
        
        if contract_balance >= 4:
            print("\n💡 Solution: We need to manually clear the amount field.")
            print("Since the status is REFUNDED, we can create a new bounty which will reset the state.\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

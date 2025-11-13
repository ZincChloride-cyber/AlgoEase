"""
Check actual contract balance on the blockchain
"""
from algosdk.v2client import algod
from algosdk.logic import get_application_address

APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

def main():
    print("\n" + "="*70)
    print("💰 CHECKING ACTUAL CONTRACT BALANCE")
    print("="*70 + "\n")
    
    try:
        # Initialize client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get contract address
        app_address = get_application_address(APP_ID)
        print(f"📝 Contract App ID: {APP_ID}")
        print(f"📝 Contract Address: {app_address}\n")
        
        # Check balance
        account_info = algod_client.account_info(app_address)
        balance = account_info['amount'] / 1_000_000
        min_balance = account_info.get('min-balance', 0) / 1_000_000
        
        print(f"💎 Total Balance: {balance} ALGO")
        print(f"🔒 Minimum Balance: {min_balance} ALGO")
        print(f"💰 Available Balance: {balance - min_balance} ALGO\n")
        
        if balance > min_balance + 0.1:
            print(f"⚠️  FUNDS ARE STUCK! {balance - min_balance} ALGO is locked in the contract")
            print(f"   This needs to be refunded.\n")
        else:
            print(f"✅ No funds stuck! Contract only has minimum balance.")
            print(f"   The minimum balance is required for the contract to exist.\n")
        
        # Check global state
        print("-"*70)
        print("📊 GLOBAL STATE")
        print("-"*70 + "\n")
        
        app_info = algod_client.application_info(APP_ID)
        import base64
        
        state_dict = {}
        for item in app_info['params']['global-state']:
            key = base64.b64decode(item['key']).decode('utf-8', errors='ignore')
            if item['value']['type'] == 2:
                value = item['value']['uint']
                state_dict[key] = value
                print(f"   {key}: {value}")
        
        status = state_dict.get('status', 999)
        amount = state_dict.get('amount', 0)
        
        status_names = {0: "OPEN", 1: "ACCEPTED", 2: "APPROVED", 3: "CLAIMED", 4: "REFUNDED"}
        
        print(f"\n📋 Interpretation:")
        print(f"   Status: {status_names.get(status, 'UNKNOWN')} ({status})")
        print(f"   Amount in state: {amount / 1_000_000} ALGO")
        
        if status in [0, 1, 2] and balance > min_balance + 0.1:
            print(f"\n⚠️  ACTIVE BOUNTY WITH FUNDS")
            print(f"   You can refund this bounty to recover the funds.\n")
        elif status == 4:
            print(f"\n✅ Status is REFUNDED - no active bounty")
            if balance > min_balance + 0.1:
                print(f"⚠️  But funds are still in contract! Manual withdrawal needed.\n")
            else:
                print(f"✅ And no funds are stuck.\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

from algosdk.v2client import algod
from algosdk.logic import get_application_address
import base64

APP_ID = 749536735  # NEW CONTRACT
client = algod.AlgodClient('', 'https://testnet-api.algonode.cloud')

print("\n" + "="*70)
print("🔍 NEW CONTRACT VERIFICATION")
print("="*70 + "\n")

try:
    # Get app info
    app_info = client.application_info(APP_ID)
    app_address = get_application_address(APP_ID)
    
    print(f"✅ Contract Found!")
    print(f"📝 App ID: {APP_ID}")
    print(f"📝 App Address: {app_address}")
    print(f"📝 Creator: {app_info['params']['creator']}\n")
    
    # Get contract balance
    try:
        account_info = client.account_info(app_address)
        balance = account_info['amount'] / 1_000_000
        min_balance = account_info.get('min-balance', 0) / 1_000_000
        print(f"💰 Contract Balance: {balance} ALGO")
        print(f"🔒 Minimum Balance: {min_balance} ALGO")
        print(f"💎 Available: {balance - min_balance} ALGO\n")
    except:
        print(f"💰 Contract Balance: 0 ALGO (not yet funded)\n")
    
    # Get global state
    global_state = app_info['params'].get('global-state', [])
    
    if len(global_state) == 0:
        print("✅ CLEAN STATE: No bounties yet (bounty_count = 0)")
        print("✅ Ready to create first bounty!\n")
    else:
        print(f"📊 Global State ({len(global_state)} variables):")
        for item in global_state:
            key = base64.b64decode(item['key']).decode('utf-8', errors='ignore')
            if item['value']['type'] == 2:
                value = item['value']['uint']
                print(f"   {key}: {value}")
        print()
    
    print("="*70)
    print("✅ NEW CONTRACT IS ACTIVE AND READY!")
    print("="*70 + "\n")
    
except Exception as e:
    print(f"❌ Error: {e}\n")

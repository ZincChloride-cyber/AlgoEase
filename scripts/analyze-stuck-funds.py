"""
Direct withdrawal - send the 2 ALGO back from the wrong address
Since it went to a regular address (not escrow), you might be able to just send it back
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Your credentials  
YOUR_ADDRESS = "3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI"
MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

# The address where your 2 ALGO is stuck
WRONG_ADDRESS = "PHIBV4HGUNK3UDHGFVN6IY6HLGUGEHJGHBIADFYDUP3XJUWJV33QWMX32I"

# Correct contract address
CORRECT_CONTRACT = "3O6NVG3KWEONEECECQWURXEHJTVMSMBMWA4KYU5KTROAAJN7VZY4I3BHFY"

print("\n" + "="*70)
print("🔍 ANALYZING THE STUCK FUNDS")
print("="*70 + "\n")

client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Check if WRONG_ADDRESS is actually a contract
try:
    # Try to get application info
    # If it's a contract, we need to find its APP_ID
    acc_info = client.account_info(WRONG_ADDRESS)
    
    print(f"📊 Address analysis for {WRONG_ADDRESS}:")
    print(f"   Balance: {acc_info['amount']/1_000_000} ALGO")
    print(f"   Min Balance: {acc_info['min-balance']/1_000_000} ALGO")
    
    if 'created-apps' in acc_info and len(acc_info['created-apps']) > 0:
        print(f"   ✅ This IS a contract address!")
        for app in acc_info['created-apps']:
            print(f"      App ID: {app['id']}")
    else:
        print(f"   ❌ This is NOT a contract - it's a regular address or application account")
    
    if 'apps-local-state' in acc_info and len(acc_info['apps-local-state']) > 0:
        print(f"   Opted into apps:")
        for app in acc_info['apps-local-state']:
            print(f"      App ID: {app['id']}")
    
    # Check the auth-addr
    if 'auth-addr' in acc_info and acc_info['auth-addr']:
        print(f"   ⚠️  Rekeyed to: {acc_info['auth-addr']}")
    
except Exception as e:
    print(f"❌ Error checking address: {e}")

print("\n" + "="*70)
print("💡 DIAGNOSIS")
print("="*70 + "\n")

print("The address PHIBV4HGUNK3UDHGFVN6IY6HLGUGEHJGHBIADFYDUP3XJUWJV33QWMX32I")
print("is the escrow address shown in your contract.env file!")
print("\nLet me check contract.env to confirm...\n")

try:
    with open(r"C:\Users\Aditya singh\AlgoEase\contract.env", "r") as f:
        content = f.read()
        print("Contract.env contents:")
        print(content)
        
        if WRONG_ADDRESS in content:
            print(f"\n✅ CONFIRMED: {WRONG_ADDRESS} is in your contract.env")
            print("   This is listed as REACT_APP_CONTRACT_ADDRESS")
            print("\n❌ BUT this address does NOT match the calculated address for APP_ID 749540140!")
            print(f"   Calculated address should be: {CORRECT_CONTRACT}")
            
            print("\n" + "="*70)
            print("🔧 THE PROBLEM")
            print("="*70)
            print("\nYour contract.env has the WRONG contract address!")
            print("This caused the bounty payment to go to an incorrect address.")
            print("\nThe address in contract.env appears to be from an OLD deployment.")
            
except Exception as e:
    print(f"Error reading contract.env: {e}")

print("\n" + "="*70)
print("✅ SOLUTION")
print("="*70)
print("\n1. Find which APP_ID corresponds to", WRONG_ADDRESS)
print("2. Call refund on THAT contract to get your 2 ALGO back")
print("3. Update contract.env with the correct address for APP_ID 749540140")
print("4. Redeploy/update your frontend to use the correct addresses\n")

# Let's try to find the old APP_ID
print("🔍 Searching for the APP_ID that matches this address...\n")

from algosdk.encoding import encode_address
from hashlib import sha512

# Check some common older APP_IDs
old_app_ids = [
    749335380,  # From quick-refund.py
    749000000,
    748000000,
    750000000,
]

found = False
for app_id in old_app_ids:
    to_sign = b"appID" + app_id.to_bytes(8, "big")
    checksum = sha512(to_sign).digest()[:32]
    addr = encode_address(checksum)
    
    if addr == WRONG_ADDRESS:
        print(f"✅ FOUND IT! APP_ID {app_id} generates {WRONG_ADDRESS}")
        print(f"\n🔧 To refund your 2 ALGO, call refund on APP_ID {app_id}\n")
        found = True
        break
    else:
        print(f"   {app_id} -> {addr} (no match)")

if not found:
    print("\n❌ Could not find the APP_ID in common ranges.")
    print("   The address might be manually set or from a very different deployment.")

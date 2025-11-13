"""
Fix the bounty issue - The payment went to the wrong address
We need to check if this is the correct contract address
"""
from algosdk.v2client import algod
from algosdk.encoding import encode_address
from hashlib import sha512

# Configuration
APP_ID_V3 = 749540140
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# The address from the transaction
PAYMENT_ADDRESS = "PHIBV4HGUNK3UDHGFVN6IY6HLGUGEHJGHBIADFYDUP3XJUWJV33QWMX32I"

def get_app_address(app_id):
    """Calculate the application address"""
    to_sign = b"appID" + app_id.to_bytes(8, "big")
    checksum = sha512(to_sign).digest()[:32]
    return encode_address(checksum)

def main():
    print("\n" + "="*70)
    print("🔍 DIAGNOSING BOUNTY ISSUE")
    print("="*70 + "\n")
    
    # Calculate correct contract address
    correct_address = get_app_address(APP_ID_V3)
    print(f"✅ Correct contract address for APP_ID {APP_ID_V3}:")
    print(f"   {correct_address}\n")
    
    print(f"💸 Payment was sent to:")
    print(f"   {PAYMENT_ADDRESS}\n")
    
    if correct_address == PAYMENT_ADDRESS:
        print("✅ MATCH! Payment went to the correct contract address")
    else:
        print("❌ MISMATCH! Payment went to a DIFFERENT address!")
        print("\n🔍 Let me check what this address is...\n")
    
    # Check the payment address balance
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    
    try:
        acc_info = client.account_info(PAYMENT_ADDRESS)
        balance = acc_info['amount'] / 1_000_000
        print(f"📊 Balance at payment address {PAYMENT_ADDRESS}:")
        print(f"   {balance} ALGO\n")
        
        # Check if it's an application
        if 'created-apps' in acc_info and acc_info['created-apps']:
            print("   This is a CONTRACT/APPLICATION address")
            for app in acc_info['created-apps']:
                print(f"   App ID: {app['id']}")
    except Exception as e:
        print(f"❌ Could not fetch info: {e}")
    
    # Check correct contract balance
    try:
        correct_acc_info = client.account_info(correct_address)
        correct_balance = correct_acc_info['amount'] / 1_000_000
        print(f"\n📊 Balance at CORRECT contract address {correct_address}:")
        print(f"   {correct_balance} ALGO\n")
    except Exception as e:
        print(f"\n❌ Correct contract address doesn't exist or has no balance")
        print(f"   Error: {e}\n")
    
    print("="*70)
    print("💡 SOLUTION")
    print("="*70)
    print("\nThe issue is that your 2 ALGO payment went to a different contract")
    print("address than the one you're trying to refund from.")
    print("\nPossible causes:")
    print("1. You used the wrong APP_ID when creating the bounty")
    print("2. The frontend has an outdated APP_ID")
    print("3. There are multiple contract deployments\n")
    
    print("To fix this, you need to:")
    print("1. Find out which APP_ID corresponds to", PAYMENT_ADDRESS)
    print("2. Update contract.env with the correct APP_ID")
    print("3. Or, refund from the correct contract\n")

if __name__ == "__main__":
    main()

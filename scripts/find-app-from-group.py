"""
Find the APP_ID from the grouped transaction
"""
from algosdk.v2client import algod, indexer
import base64

# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
INDEXER_ADDRESS = "https://testnet-idx.algonode.cloud"
YOUR_ADDRESS = "3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI"
GROUP_ID = "vvaye6LqKEZs4adgJT/l9uVqRokr9RmlZscQ70dvBVs="

print("\n" + "="*70)
print("🔍 FINDING APP_ID FROM GROUPED TRANSACTION")
print("="*70 + "\n")

# Use indexer to search for transactions
indexer_client = indexer.IndexerClient("", INDEXER_ADDRESS)

try:
    print(f"🔍 Searching for transactions in group: {GROUP_ID[:20]}...\n")
    
    # Search for transactions from your address around the bounty creation time
    # Round 57450738 from the payment transaction
    txns = indexer_client.search_transactions(
        address=YOUR_ADDRESS,
        min_round=57450735,
        max_round=57450745
    )
    
    group_id_bytes = base64.b64decode(GROUP_ID)
    
    print("📋 Found transactions:\n")
    app_id_found = None
    
    for txn in txns['transactions']:
        # Check if this transaction is in the same group
        if 'group' in txn and base64.b64decode(txn['group']) == group_id_bytes:
            print(f"✅ Transaction in group: {txn['id']}")
            print(f"   Type: {txn['tx-type']}")
            print(f"   Round: {txn['confirmed-round']}")
            
            if txn['tx-type'] == 'appl':  # Application call
                app_id_found = txn['application-transaction']['application-id']
                print(f"   🎯 APP_ID: {app_id_found}")
                
                if 'application-args' in txn['application-transaction']:
                    args = txn['application-transaction']['application-args']
                    print(f"   Arguments:")
                    for i, arg in enumerate(args):
                        try:
                            decoded = base64.b64decode(arg).decode('utf-8', errors='ignore')
                            print(f"      [{i}]: {decoded}")
                        except:
                            print(f"      [{i}]: {arg}")
            
            elif txn['tx-type'] == 'pay':
                print(f"   Amount: {txn['payment-transaction']['amount']/1_000_000} ALGO")
                print(f"   To: {txn['payment-transaction']['receiver']}")
            
            print()
    
    if app_id_found:
        print("="*70)
        print("✅ FOUND THE APP_ID!")
        print("="*70)
        print(f"\nYour bounty is on APP_ID: {app_id_found}\n")
        
        # Verify the address
        from algosdk.encoding import encode_address
        from hashlib import sha512
        
        to_sign = b"appID" + app_id_found.to_bytes(8, "big")
        checksum = sha512(to_sign).digest()[:32]
        calculated_address = encode_address(checksum)
        
        print(f"📍 Contract address: {calculated_address}")
        print(f"💰 This address has your 2 ALGO\n")
        
        print("="*70)
        print("🔧 FIX REQUIRED")
        print("="*70)
        print(f"\nUpdate your contract.env file:")
        print(f"   Change REACT_APP_CONTRACT_APP_ID from 749540140 to {app_id_found}")
        print(f"   Change REACT_APP_CONTRACT_ADDRESS to {calculated_address}\n")
        
    else:
        print("❌ Could not find the application call transaction in the group")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

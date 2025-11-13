"""
Check transaction history to find APP_ID
"""
from algosdk.v2client import indexer

client = indexer.IndexerClient('', 'https://testnet-idx.algonode.cloud')
addr = 'PHIBV4HGUNK3UDHGFVN6IY6HLGUGEHJGHBIADFYDUP3XJUWJV33QWMX32I'

print(f"\n🔍 Transaction history for {addr}\n")

try:
    txns = client.search_transactions(address=addr, limit=100)
    
    if 'transactions' in txns and len(txns['transactions']) > 0:
        print(f"Found {len(txns['transactions'])} transactions:\n")
        
        app_ids_seen = set()
        
        for t in txns['transactions']:
            print(f"Round {t['confirmed-round']}: {t['tx-type']}")
            
            if t['tx-type'] == 'appl':
                app_id = t.get('application-transaction', {}).get('application-id', 0)
                if app_id > 0:
                    app_ids_seen.add(app_id)
                    print(f"   APP_ID: {app_id}")
                    
                    if 'application-args' in t.get('application-transaction', {}):
                        args = t['application-transaction']['application-args']
                        if args:
                            import base64
                            try:
                                first_arg = base64.b64decode(args[0]).decode('utf-8', errors='ignore')
                                print(f"   Method: {first_arg}")
                            except:
                                pass
            
            elif t['tx-type'] == 'pay':
                amt = t.get('payment-transaction', {}).get('amount', 0)
                rcv = t.get('payment-transaction', {}).get('receiver', '')
                print(f"   Amount: {amt/1_000_000} ALGO")
                if rcv == addr:
                    print(f"   ← Received")
                else:
                    print(f"   → Sent")
            
            print()
        
        if app_ids_seen:
            print("="*70)
            print(f"✅ APP_IDs associated with this address: {list(app_ids_seen)}")
            print("="*70)
            
            # Verify each one
            from algosdk.encoding import encode_address
            from hashlib import sha512
            
            for app_id in app_ids_seen:
                to_sign = b"appID" + app_id.to_bytes(8, "big")
                checksum = sha512(to_sign).digest()[:32]
                calculated_addr = encode_address(checksum)
                
                match = "✅ MATCH!" if calculated_addr == addr else "❌ No match"
                print(f"\nAPP_ID {app_id}:")
                print(f"   Calculated address: {calculated_addr}")
                print(f"   {match}")
    else:
        print("No transactions found for this address")
        print("This might be a manually funded address or very new")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

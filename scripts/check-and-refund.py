"""
Complete check and refund script for your account
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.encoding import encode_address
import base64
from hashlib import sha512

# Configuration
APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Your credentials
YOUR_ADDRESS = "3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI"
MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def get_app_address(app_id):
    """Calculate the application address"""
    to_sign = b"appID" + app_id.to_bytes(8, "big")
    checksum = sha512(to_sign).digest()[:32]
    return encode_address(checksum)

def decode_state(state_array):
    """Decode the global state array"""
    state_dict = {}
    for item in state_array:
        key = base64.b64decode(item['key']).decode('utf-8', errors='ignore')
        value = item['value']
        
        if value['type'] == 1:  # bytes
            try:
                bytes_data = base64.b64decode(value['bytes'])
                if len(bytes_data) == 32:
                    state_dict[key] = encode_address(bytes_data)
                else:
                    state_dict[key] = bytes_data.decode('utf-8', errors='ignore')
            except:
                state_dict[key] = value['bytes']
        elif value['type'] == 2:  # uint
            state_dict[key] = value['uint']
    
    return state_dict

def main():
    print("\n" + "="*70)
    print("🔍 COMPLETE BOUNTY CHECK AND REFUND TOOL")
    print("="*70 + "\n")
    
    try:
        # Initialize algod client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Verify account
        private_key = mnemonic.to_private_key(MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        print(f"✅ Mnemonic verified successfully")
        print(f"📝 Your address: {address}")
        
        if address != YOUR_ADDRESS:
            print(f"⚠️  WARNING: Address mismatch!")
            print(f"   Expected: {YOUR_ADDRESS}")
            print(f"   Got: {address}")
            return
        
        # Check account balance
        account_info = algod_client.account_info(address)
        balance = account_info['amount'] / 1_000_000
        print(f"💰 Your balance: {balance} ALGO\n")
        
        # Get application info
        print("-" * 70)
        print("📋 CONTRACT STATE ANALYSIS")
        print("-" * 70)
        
        app_info = algod_client.application_info(APP_ID)
        app_address = get_app_address(APP_ID)
        
        print(f"🏦 Contract address: {app_address}")
        
        # Check contract balance
        try:
            contract_info = algod_client.account_info(app_address)
            contract_balance = contract_info['amount'] / 1_000_000
            print(f"💎 Contract balance: {contract_balance} ALGO")
        except:
            print(f"💎 Contract balance: 0 ALGO (or account doesn't exist)")
            contract_balance = 0
        
        # Decode global state
        global_state = app_info['params'].get('global-state', [])
        state = decode_state(global_state)
        
        print(f"\n📊 Global State Variables:")
        for key, value in state.items():
            print(f"   {key}: {value}")
        
        # Analyze status
        status = state.get('status', 999)
        amount = state.get('amount', 0)
        client_addr = state.get('client_addr', 'N/A')
        verifier_addr = state.get('verifier_addr', 'N/A')
        
        status_names = {
            0: "OPEN",
            1: "ACCEPTED", 
            2: "APPROVED",
            3: "CLAIMED",
            4: "REFUNDED"
        }
        
        print(f"\n🎯 Status Analysis:")
        print(f"   Status: {status} ({status_names.get(status, 'UNKNOWN')})")
        print(f"   Amount in state: {amount} microAlgos ({amount/1_000_000} ALGO)")
        print(f"   Client: {client_addr}")
        print(f"   Verifier: {verifier_addr}")
        
        # Check if you're authorized to refund
        your_match = (address == client_addr or address == verifier_addr)
        print(f"   Your address matches client/verifier: {'✅ YES' if your_match else '❌ NO'}")
        
        print("\n" + "-" * 70)
        print("💡 DIAGNOSIS")
        print("-" * 70)
        
        if status == 4:
            print("⚠️  Status shows REFUNDED")
            if amount > 0:
                print(f"⚠️  But amount field still shows {amount/1_000_000} ALGO")
            if contract_balance > 0:
                print(f"⚠️  Contract still holds {contract_balance} ALGO")
                print("\n🔧 ACTION NEEDED: Manual withdrawal required")
            else:
                print(f"✅ Contract balance is 0 - no funds stuck")
                print(f"ℹ️  The amount field in state is just a display bug")
                print(f"✅ You can create new bounties now")
        
        elif status in [0, 1, 2]:
            print(f"⚠️  Active bounty in {status_names[status]} state")
            if amount > 0 and your_match:
                print(f"💰 {amount/1_000_000} ALGO can be refunded")
                print(f"✅ You are authorized to refund (client/verifier)")
                
                # Attempt refund
                print("\n" + "-" * 70)
                print("🔄 ATTEMPTING REFUND")
                print("-" * 70 + "\n")
                
                params = algod_client.suggested_params()
                
                txn = transaction.ApplicationNoOpTxn(
                    sender=address,
                    sp=params,
                    index=APP_ID,
                    app_args=[b"refund"],
                    note=b"AlgoEase: Force Refund"
                )
                
                print("🔑 Signing transaction...")
                signed_txn = txn.sign(private_key)
                
                print("📡 Sending to blockchain...")
                tx_id = algod_client.send_transaction(signed_txn)
                print(f"   Transaction ID: {tx_id}")
                
                print("⏳ Waiting for confirmation...\n")
                confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
                
                print("=" * 70)
                print("✅ REFUND SUCCESSFUL!")
                print("=" * 70)
                print(f"💰 Refunded: {amount/1_000_000} ALGO")
                print(f"📍 Round: {confirmed_txn['confirmed-round']}")
                print(f"🔗 View: https://testnet.explorer.perawallet.app/tx/{tx_id}")
                print("=" * 70 + "\n")
                
            elif amount > 0 and not your_match:
                print(f"❌ You are NOT authorized to refund this bounty")
                print(f"   Client: {client_addr}")
                print(f"   Verifier: {verifier_addr}")
                print(f"   You: {address}")
        
        elif status == 3:
            print("✅ Bounty already claimed")
            print("✅ You can create new bounties")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

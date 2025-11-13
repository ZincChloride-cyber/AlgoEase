"""
Refund script for the current bounty
Transaction ID: 4KEY7JBWYKACY452XWDHDIEANZIHSV5RBAB7NTU2XJX6QYPZU4TA
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.encoding import encode_address
import base64
from hashlib import sha512

# Configuration - UPDATED WITH CORRECT APP_ID
APP_ID = 749540140
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Your credentials
YOUR_ADDRESS = "3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI"
MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"
BOUNTY_TX_ID = "4KEY7JBWYKACY452XWDHDIEANZIHSV5RBAB7NTU2XJX6QYPZU4TA"

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
    print("🔄 REFUND BOUNTY - TRANSACTION " + BOUNTY_TX_ID)
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
            return
        
        # Check account balance
        account_info = algod_client.account_info(address)
        balance = account_info['amount'] / 1_000_000
        print(f"💰 Your current balance: {balance} ALGO\n")
        
        # Get application info
        print("-" * 70)
        print("📋 CHECKING CONTRACT STATE")
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
            print(f"💎 Contract balance: 0 ALGO")
            contract_balance = 0
        
        # Decode global state
        global_state = app_info['params'].get('global-state', [])
        state = decode_state(global_state)
        
        print(f"\n📊 Current Bounty State:")
        status = state.get('status', 999)
        amount = state.get('amount', 0)
        client_addr = state.get('client_addr', 'N/A')
        
        status_names = {
            0: "OPEN",
            1: "ACCEPTED", 
            2: "APPROVED",
            3: "CLAIMED",
            4: "REFUNDED"
        }
        
        print(f"   Status: {status} ({status_names.get(status, 'UNKNOWN')})")
        print(f"   Amount: {amount} microAlgos ({amount/1_000_000} ALGO)")
        print(f"   Client: {client_addr}")
        
        # Check authorization
        if address != client_addr:
            print(f"\n❌ ERROR: You are not authorized to refund this bounty")
            print(f"   Only the client ({client_addr}) can refund")
            return
        
        print(f"   ✅ You are the client - authorized to refund")
        
        # Check if already refunded
        if status == 4:
            print(f"\n⚠️  WARNING: Status already shows REFUNDED")
            if contract_balance == 0:
                print(f"✅ Contract balance is 0 - funds already returned")
                print(f"✅ You can create new bounties now")
                return
        
        # Check if there are funds to refund
        if amount == 0 and contract_balance == 0:
            print(f"\n❌ No funds to refund")
            return
        
        if contract_balance == 0 and amount > 0:
            print(f"\n⚠️  WARNING: Contract balance is 0 but state shows {amount/1_000_000} ALGO")
            print(f"ℹ️  This may be a display bug - funds might already be refunded")
            print(f"\nℹ️  Attempting refund anyway to clear the state...")
        
        # Attempt refund
        print("\n" + "-" * 70)
        print("🔄 PROCESSING REFUND")
        print("-" * 70 + "\n")
        
        params = algod_client.suggested_params()
        
        txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=[b"refund"],
            note=b"AlgoEase: Refund Bounty"
        )
        
        print("🔑 Signing transaction...")
        signed_txn = txn.sign(private_key)
        
        print("📡 Sending to blockchain...")
        tx_id = algod_client.send_transaction(signed_txn)
        print(f"   Transaction ID: {tx_id}")
        
        print("⏳ Waiting for confirmation (about 4.5 seconds)...\n")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print("=" * 70)
        print("✅ REFUND SUCCESSFUL!")
        print("=" * 70)
        print(f"💰 Amount refunded: {amount/1_000_000} ALGO")
        print(f"📍 Confirmed in round: {confirmed_txn['confirmed-round']}")
        print(f"🔗 View transaction: https://testnet.explorer.perawallet.app/tx/{tx_id}")
        print("=" * 70 + "\n")
        
        # Check new balance
        account_info = algod_client.account_info(address)
        new_balance = account_info['amount'] / 1_000_000
        print(f"💰 Your new balance: {new_balance} ALGO")
        print(f"📈 Increased by: {new_balance - balance:.6f} ALGO\n")
        
        print("✅ You can now create new bounties!\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        
        if "logic eval error" in str(e).lower():
            print("💡 The contract rejected the refund. Possible reasons:")
            print("   - Bounty is not in a refundable state")
            print("   - Deadline hasn't passed yet")
            print("   - You're not the authorized client")
        
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

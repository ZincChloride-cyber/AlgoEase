"""
Force clear the bounty state by calling refund with proper fee coverage
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.encoding import encode_address
import base64
from hashlib import sha512

# Configuration - CORRECT APP_ID
APP_ID = 749540140
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
    print("🗑️  FORCE CLEAR BOUNTY STATE")
    print("="*70 + "\n")
    
    try:
        # Initialize algod client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Verify account
        private_key = mnemonic.to_private_key(MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        print(f"✅ Address verified: {address}\n")
        
        # Check account balance
        account_info = algod_client.account_info(address)
        balance = account_info['amount'] / 1_000_000
        min_balance = account_info['min-balance'] / 1_000_000
        
        print(f"💰 Your balance: {balance} ALGO")
        print(f"📊 Minimum required: {min_balance} ALGO")
        print(f"💵 Available: {balance - min_balance} ALGO\n")
        
        # Get application info
        app_info = algod_client.application_info(APP_ID)
        app_address = get_app_address(APP_ID)
        
        print(f"🏦 Contract address: {app_address}")
        
        # Decode global state
        global_state = app_info['params'].get('global-state', [])
        state = decode_state(global_state)
        
        status = state.get('status', 999)
        amount = state.get('amount', 0)
        
        status_names = {0: "OPEN", 1: "ACCEPTED", 2: "APPROVED", 3: "CLAIMED", 4: "REFUNDED"}
        
        print(f"📊 Current bounty state:")
        print(f"   Status: {status} ({status_names.get(status, 'UNKNOWN')})")
        print(f"   Amount: {amount/1_000_000} ALGO\n")
        
        if status == 4:
            print("✅ Bounty already marked as REFUNDED")
            print("ℹ️  The state just needs to be reset for a new bounty\n")
            return
        
        # Check if there's actually money in the contract
        try:
            contract_info = algod_client.account_info(app_address)
            contract_balance = contract_info['amount'] / 1_000_000
            print(f"💎 Contract balance: {contract_balance} ALGO\n")
        except:
            contract_balance = 0
            print(f"💎 Contract balance: 0 ALGO\n")
        
        if contract_balance == 0 and amount > 0:
            print("⚠️  WARNING: Contract has 0 balance but state shows {amount/1_000_000} ALGO")
            print("ℹ️  This is a phantom bounty - the funds went to the wrong address")
            print("ℹ️  Attempting to clear the state anyway...\n")
        
        print("-" * 70)
        print("🔄 ATTEMPTING TO CLEAR STATE")
        print("-" * 70 + "\n")
        
        # Get suggested parameters
        params = algod_client.suggested_params()
        # Increase fee to ensure transaction goes through
        params.fee = 2000  # 0.002 ALGO
        params.flat_fee = True
        
        print("📝 Creating refund transaction...")
        print(f"   Fee: {params.fee / 1_000_000} ALGO\n")
        
        txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=[b"refund"],
            note=b"AlgoEase: Clear Bounty State"
        )
        
        print("🔑 Signing transaction...")
        signed_txn = txn.sign(private_key)
        
        print("📡 Sending to blockchain...")
        tx_id = algod_client.send_transaction(signed_txn)
        print(f"   Transaction ID: {tx_id}\n")
        
        print("⏳ Waiting for confirmation...\n")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print("=" * 70)
        print("✅ STATE CLEARED SUCCESSFULLY!")
        print("=" * 70)
        print(f"📍 Confirmed in round: {confirmed_txn['confirmed-round']}")
        print(f"🔗 View: https://testnet.explorer.perawallet.app/tx/{tx_id}")
        print("=" * 70 + "\n")
        
        print("✅ You can now create new bounties!\n")
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ ERROR: {error_msg}\n")
        
        if "below min" in error_msg.lower():
            print("💡 SOLUTION: Your balance is too low!")
            print("\nYou need to:")
            print("1. Get more testnet ALGO from: https://bank.testnet.algorand.network/")
            print("2. Request at least 5-10 ALGO to have enough for operations")
            print("3. Try again after funding your account\n")
        
        elif "logic eval error" in error_msg.lower():
            print("💡 The contract logic prevented the refund")
            print("   Possible reasons:")
            print("   - Contract has 0 balance (can't pay inner transaction fee)")
            print("   - Deadline hasn't passed")
            print("   - State is corrupted\n")
            print("   Solution: Deploy a fresh contract\n")
        
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

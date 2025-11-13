"""
Quick refund script using Python and py-algorand-sdk
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
import time

# Configuration
APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Your 25-word mnemonic
MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def main():
    print("\n🔧 Quick Refund Tool for AlgoEase (Python)\n")
    print("This will refund the stuck bounty and return 2 ALGO to your wallet.\n")
    
    try:
        # Initialize algod client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get account from mnemonic
        private_key = mnemonic.to_private_key(MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        print(f"📝 Your address: {address}")
        
        # Get account info
        account_info = algod_client.account_info(address)
        balance = account_info['amount'] / 1_000_000
        print(f"💰 Current balance: {balance} ALGO\n")
        
        # Get suggested parameters
        params = algod_client.suggested_params()
        
        # Create refund transaction
        print("📤 Creating refund transaction...")
        
        txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=[b"refund"],
            note=b"AlgoEase: Refund Bounty"
        )
        
        # Sign transaction
        print("🔑 Signing transaction...")
        signed_txn = txn.sign(private_key)
        
        # Send transaction
        print("📡 Sending to blockchain...")
        tx_id = algod_client.send_transaction(signed_txn)
        print(f"Transaction ID: {tx_id}")
        
        # Wait for confirmation
        print("⏳ Waiting for confirmation (this takes about 4.5 seconds)...\n")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print(f"✅ SUCCESS! Transaction confirmed in round {confirmed_txn['confirmed-round']}")
        print(f"💰 Refunded 2,000,000 microAlgos (2 ALGO) to your wallet")
        print(f"\n🎉 You can now create new bounties!\n")
        print(f"🔗 View transaction: https://testnet.explorer.perawallet.app/tx/{tx_id}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
        if "invalid mnemonic" in str(e).lower():
            print("💡 Your mnemonic phrase appears to be invalid.")
            print("   Make sure you copied all 25 words correctly.\n")

if __name__ == "__main__":
    main()

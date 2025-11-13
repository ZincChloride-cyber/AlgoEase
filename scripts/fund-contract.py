"""
Fund the contract account so it can process the refund
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# Configuration
APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
CONTRACT_ADDRESS = "4KO7QHXW3UNBRAQUCE7EKN5N5IRFV56W3ROENGI242M4AAFCKEDN7KXWEU"

# Your 25-word mnemonic
MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def main():
    print("\n💰 Funding Contract Account\n")
    
    try:
        # Initialize algod client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get account from mnemonic
        private_key = mnemonic.to_private_key(MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        print(f"📝 Your address: {address}")
        
        # Get suggested parameters
        params = algod_client.suggested_params()
        
        # Send 2.2 ALGO to contract to cover the refund + fees + min balance
        amount = 2_200_000  # 2.2 ALGO in microAlgos
        
        print(f"📤 Sending {amount / 1_000_000} ALGO to contract...")
        print(f"📍 Contract address: {CONTRACT_ADDRESS}\n")
        
        txn = transaction.PaymentTxn(
            sender=address,
            sp=params,
            receiver=CONTRACT_ADDRESS,
            amt=amount,
            note=b"Fund contract for refund"
        )
        
        # Sign and send
        signed_txn = txn.sign(private_key)
        tx_id = algod_client.send_transaction(signed_txn)
        
        print(f"Transaction ID: {tx_id}")
        print("⏳ Waiting for confirmation...\n")
        
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print(f"✅ SUCCESS! Transaction confirmed in round {confirmed_txn['confirmed-round']}")
        print(f"💰 Sent {amount / 1_000_000} ALGO to contract")
        print(f"\n📊 Contract can now process the refund!\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")

if __name__ == "__main__":
    main()

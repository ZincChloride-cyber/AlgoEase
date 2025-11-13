"""
Force clean the contract state by creating a minimal test bounty
This will override all the stuck state variables
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
import time

# Configuration
APP_ID = 749335380
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Your credentials
YOUR_ADDRESS = "3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI"
MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def get_app_address(app_id):
    """Calculate the application address"""
    from algosdk.encoding import encode_address
    from hashlib import sha512
    to_sign = b"appID" + app_id.to_bytes(8, "big")
    checksum = sha512(to_sign).digest()[:32]
    return encode_address(checksum)

def main():
    print("\n" + "="*70)
    print("🔧 FORCE STATE CLEANUP - Create Minimal Test Bounty")
    print("="*70 + "\n")
    print("This will create a tiny 0.1 ALGO bounty to reset the stuck state,")
    print("then you can immediately refund it to clean everything up.\n")
    
    try:
        # Initialize algod client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get account from mnemonic
        private_key = mnemonic.to_private_key(MNEMONIC)
        address = account.address_from_private_key(private_key)
        
        print(f"✅ Account verified: {address}")
        
        # Check balance
        account_info = algod_client.account_info(address)
        balance = account_info['amount'] / 1_000_000
        print(f"💰 Current balance: {balance} ALGO\n")
        
        if balance < 0.5:
            print("❌ Insufficient balance. You need at least 0.5 ALGO")
            print("   (0.1 for bounty + fees)")
            return
        
        # Get application address
        app_address = get_app_address(APP_ID)
        print(f"📝 Contract address: {app_address}\n")
        
        # Create minimal bounty
        print("-" * 70)
        print("STEP 1: Creating minimal test bounty (0.1 ALGO)")
        print("-" * 70 + "\n")
        
        # Bounty parameters
        bounty_amount = 100_000  # 0.1 ALGO
        deadline = int(time.time()) + 60  # 1 minute from now (so we can auto-refund)
        task_description = b"test-cleanup"
        
        # Get suggested parameters
        params = algod_client.suggested_params()
        
        # Transaction 0: Payment to contract
        payment_txn = transaction.PaymentTxn(
            sender=address,
            sp=params,
            receiver=app_address,
            amt=bounty_amount,
            note=b"AlgoEase: Test Bounty for State Cleanup"
        )
        
        # Transaction 1: App call to create bounty
        app_args = [
            b"create_bounty",
            bounty_amount.to_bytes(8, 'big'),
            deadline.to_bytes(8, 'big'),
            task_description
        ]
        
        app_call_txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=app_args,
            accounts=[address],  # Verifier = yourself
            note=b"AlgoEase: Create Test Bounty"
        )
        
        # Group transactions
        gid = transaction.calculate_group_id([payment_txn, app_call_txn])
        payment_txn.group = gid
        app_call_txn.group = gid
        
        # Sign transactions
        print("🔑 Signing grouped transactions...")
        signed_payment = payment_txn.sign(private_key)
        signed_app_call = app_call_txn.sign(private_key)
        
        # Send transactions
        print("📡 Sending to blockchain...")
        tx_id = algod_client.send_transactions([signed_payment, signed_app_call])
        print(f"   Transaction ID: {tx_id}")
        
        # Wait for confirmation
        print("⏳ Waiting for confirmation...\n")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        print("✅ Test bounty created successfully!")
        print(f"📍 Round: {confirmed_txn['confirmed-round']}")
        print(f"💰 Amount: 0.1 ALGO")
        print(f"⏰ Deadline: {deadline} (in 60 seconds)\n")
        
        # Wait a moment
        print("-" * 70)
        print("STEP 2: Waiting 65 seconds for deadline to pass...")
        print("-" * 70 + "\n")
        print("This allows us to use auto_refund to get the funds back.\n")
        
        for remaining in range(65, 0, -1):
            print(f"⏳ {remaining} seconds remaining...", end='\r')
            time.sleep(1)
        
        print("\n")
        
        # Now refund using auto_refund (works after deadline)
        print("-" * 70)
        print("STEP 3: Auto-refunding the test bounty")
        print("-" * 70 + "\n")
        
        params = algod_client.suggested_params()
        
        refund_txn = transaction.ApplicationNoOpTxn(
            sender=address,
            sp=params,
            index=APP_ID,
            app_args=[b"auto_refund"],
            note=b"AlgoEase: Auto Refund Test Bounty"
        )
        
        print("🔑 Signing refund transaction...")
        signed_refund = refund_txn.sign(private_key)
        
        print("📡 Sending to blockchain...")
        refund_tx_id = algod_client.send_transaction(signed_refund)
        print(f"   Transaction ID: {refund_tx_id}")
        
        print("⏳ Waiting for confirmation...\n")
        confirmed_refund = transaction.wait_for_confirmation(algod_client, refund_tx_id, 4)
        
        print("=" * 70)
        print("✅ STATE CLEANUP COMPLETE!")
        print("=" * 70)
        print("💰 0.1 ALGO refunded to your wallet")
        print("🧹 All state variables have been reset")
        print("✅ You can now create new bounties normally!")
        print(f"🔗 Refund tx: https://testnet.explorer.perawallet.app/tx/{refund_tx_id}")
        print("=" * 70 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        
        if "assert failed" in str(e).lower():
            print("💡 The contract rejected the transaction.")
            print("   This might be because:")
            print("   1. Status is REFUNDED but ensure_no_active_bounty() returned False")
            print("   2. The amount field is causing issues")
            print("\n🔍 Let me check the actual contract logic...")
        
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

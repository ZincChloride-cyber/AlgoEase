"""
Deploy Fresh AlgoEase Contract V4
This will create a brand new contract with no corrupted state
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.logic import get_application_address
import base64

# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Your credentials
CREATOR_MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def compile_program(client, source_code):
    """Compile TEAL source code"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

def deploy_contract():
    print("\n" + "="*70)
    print("🚀 DEPLOYING FRESH ALGOEASE CONTRACT V4")
    print("="*70 + "\n")
    
    # Initialize client
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    
    # Get creator account
    private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
    creator_address = account.address_from_private_key(private_key)
    
    print(f"📝 Creator address: {creator_address}")
    
    # Check balance
    account_info = client.account_info(creator_address)
    balance = account_info['amount'] / 1_000_000
    print(f"💰 Balance: {balance} ALGO\n")
    
    if balance < 0.5:
        print("❌ Insufficient balance for deployment")
        print("   Need at least 0.5 ALGO")
        return None
    
    # Read compiled TEAL files - use the original simple version
    try:
        with open(r"C:\Users\Aditya singh\AlgoEase\contracts\algoease_approval.teal", "r") as f:
            approval_teal = f.read()
        
        with open(r"C:\Users\Aditya singh\AlgoEase\contracts\algoease_clear.teal", "r") as f:
            clear_teal = f.read()
        
        print("✅ TEAL files loaded successfully (using simple single-bounty version)\n")
    except FileNotFoundError as e:
        print(f"❌ TEAL files not found: {e}")
        return None
    
    # Compile programs
    print("🔨 Compiling smart contract programs...")
    approval_program = compile_program(client, approval_teal)
    clear_program = compile_program(client, clear_teal)
    print("✅ Programs compiled\n")
    
    # Define schema - Original contract uses bounty_counter (1 uint), rest in boxes
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=0)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
    
    print("📋 Schema: 1 uint (bounty_counter), 0 byte slices")
    print("   Bounty data stored in boxes\n")
    
    # Get suggested params
    params = client.suggested_params()
    
    # Create application transaction
    print("📤 Creating deployment transaction...")
    txn = transaction.ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        extra_pages=0
    )
    
    # Sign transaction
    print("🔑 Signing transaction...")
    signed_txn = txn.sign(private_key)
    
    # Send transaction
    print("📡 Sending to blockchain...")
    tx_id = client.send_transaction(signed_txn)
    print(f"   Transaction ID: {tx_id}\n")
    
    # Wait for confirmation
    print("⏳ Waiting for confirmation (about 4.5 seconds)...\n")
    confirmed_txn = transaction.wait_for_confirmation(client, tx_id, 4)
    
    # Get app ID
    app_id = confirmed_txn['application-index']
    app_address = get_application_address(app_id)
    
    print("=" * 70)
    print("✅ CONTRACT DEPLOYED SUCCESSFULLY!")
    print("=" * 70)
    print(f"📱 App ID: {app_id}")
    print(f"📍 Contract Address: {app_address}")
    print(f"🔗 View on Explorer:")
    print(f"   https://testnet.explorer.perawallet.app/application/{app_id}")
    print("=" * 70 + "\n")
    
    # Update contract.env
    print("📝 Updating contract.env...\n")
    env_content = f"""# AlgoEase Contract Configuration - V4 FRESH DEPLOYMENT
REACT_APP_CONTRACT_APP_ID={app_id}
REACT_APP_CONTRACT_ADDRESS={app_address}
REACT_APP_CREATOR_MNEMONIC={CREATOR_MNEMONIC}
REACT_APP_CREATOR_ADDRESS={creator_address}
"""
    
    with open(r"C:\Users\Aditya singh\AlgoEase\contract.env", "w") as f:
        f.write(env_content)
    
    print("✅ contract.env updated!\n")
    
    print("=" * 70)
    print("🎉 DEPLOYMENT COMPLETE!")
    print("=" * 70)
    print("\n📋 Next Steps:")
    print("1. ✅ Contract deployed with APP_ID:", app_id)
    print("2. ✅ contract.env updated")
    print("3. 🔄 Rebuild frontend: cd frontend && npm run build")
    print("4. 🧪 Test creating a small bounty (0.1 ALGO)")
    print("5. 🗑️  Old contract (749540140) can be ignored\n")
    
    return app_id

if __name__ == "__main__":
    try:
        app_id = deploy_contract()
        if app_id:
            print("✅ Success! Your new APP_ID is:", app_id)
        else:
            print("❌ Deployment failed")
    except Exception as e:
        print(f"\n❌ Error during deployment: {e}")
        import traceback
        traceback.print_exc()

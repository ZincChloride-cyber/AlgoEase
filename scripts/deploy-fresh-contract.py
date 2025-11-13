"""
Deploy Fresh AlgoEase Contract
This will deploy a brand new contract with no history
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.logic import get_application_address
import base64

# Configuration
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Creator credentials from contract.env
CREATOR_MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def compile_program(client, source_file):
    """Compile TEAL file to bytes"""
    with open(source_file, "r") as f:
        source_code = f.read()
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response["result"])

def main():
    print("\n" + "="*70)
    print("🚀 DEPLOYING FRESH ALGOEASE CONTRACT")
    print("="*70 + "\n")
    
    try:
        # Initialize client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get creator account
        private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
        creator_address = account.address_from_private_key(private_key)
        
        print(f"✅ Creator address: {creator_address}")
        
        # Check balance
        account_info = algod_client.account_info(creator_address)
        balance = account_info['amount'] / 1_000_000
        print(f"💰 Creator balance: {balance} ALGO\n")
        
        if balance < 0.5:
            print("❌ Insufficient balance. Creator needs at least 0.5 ALGO for deployment.")
            return
        
        # Compile TEAL programs
        print("📝 Compiling TEAL programs...")
        approval_program = compile_program(algod_client, "contracts/algoease_approval.teal")
        clear_program = compile_program(algod_client, "contracts/algoease_clear.teal")
        print("   ✅ Approval program compiled")
        print("   ✅ Clear program compiled\n")
        
        # Define schema
        # Based on the contract: 4 uints, 4 byte-slices
        global_schema = transaction.StateSchema(num_uints=4, num_byte_slices=4)
        local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
        
        # Get suggested params
        params = algod_client.suggested_params()
        
        # Create application transaction
        print("📤 Creating application...")
        txn = transaction.ApplicationCreateTxn(
            sender=creator_address,
            sp=params,
            on_complete=transaction.OnComplete.NoOpOC,
            approval_program=approval_program,
            clear_program=clear_program,
            global_schema=global_schema,
            local_schema=local_schema,
            note=b"AlgoEase: Fresh Contract Deployment"
        )
        
        # Sign transaction
        print("🔑 Signing transaction...")
        signed_txn = txn.sign(private_key)
        
        # Send transaction
        print("📡 Sending to blockchain...")
        tx_id = algod_client.send_transaction(signed_txn)
        print(f"   Transaction ID: {tx_id}")
        
        # Wait for confirmation
        print("⏳ Waiting for confirmation (this may take a few seconds)...\n")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        # Get app ID
        app_id = confirmed_txn["application-index"]
        app_address = get_application_address(app_id)
        
        print("="*70)
        print("✅ CONTRACT DEPLOYED SUCCESSFULLY!")
        print("="*70)
        print(f"📍 App ID: {app_id}")
        print(f"📍 App Address: {app_address}")
        print(f"📍 Creator: {creator_address}")
        print(f"📍 Transaction: https://testnet.explorer.perawallet.app/tx/{tx_id}")
        print(f"📍 Round: {confirmed_txn['confirmed-round']}")
        print("="*70 + "\n")
        
        # Save to contract.env
        print("💾 Updating contract.env file...")
        env_content = f"""# AlgoEase Contract Configuration - DEPLOYED ON TESTNET
REACT_APP_CONTRACT_APP_ID={app_id}
REACT_APP_CONTRACT_ADDRESS={app_address}
REACT_APP_CREATOR_MNEMONIC={CREATOR_MNEMONIC}
REACT_APP_CREATOR_ADDRESS={creator_address}

"""
        
        with open("contract.env", "w") as f:
            f.write(env_content)
        
        print("   ✅ contract.env updated\n")
        
        # Update frontend .env if it exists
        frontend_env_path = "frontend/.env"
        try:
            print("💾 Updating frontend/.env file...")
            
            # Read existing env
            env_lines = []
            if os.path.exists(frontend_env_path):
                with open(frontend_env_path, "r") as f:
                    env_lines = f.readlines()
            
            # Update or add the APP_ID line
            app_id_found = False
            new_lines = []
            for line in env_lines:
                if line.startswith("REACT_APP_CONTRACT_APP_ID="):
                    new_lines.append(f"REACT_APP_CONTRACT_APP_ID={app_id}\n")
                    app_id_found = True
                elif line.startswith("REACT_APP_CONTRACT_ADDRESS="):
                    new_lines.append(f"REACT_APP_CONTRACT_ADDRESS={app_address}\n")
                else:
                    new_lines.append(line)
            
            if not app_id_found:
                new_lines.append(f"REACT_APP_CONTRACT_APP_ID={app_id}\n")
                new_lines.append(f"REACT_APP_CONTRACT_ADDRESS={app_address}\n")
            
            with open(frontend_env_path, "w") as f:
                f.writelines(new_lines)
            
            print("   ✅ frontend/.env updated\n")
        except Exception as e:
            print(f"   ⚠️  Could not update frontend/.env: {e}\n")
        
        print("📋 NEXT STEPS:")
        print("-" * 70)
        print("1. ✅ Contract deployed with clean state")
        print("2. ✅ Configuration files updated")
        print("3. 🔄 Restart your frontend (if running)")
        print("4. 🔄 Restart your backend (if running)")
        print("5. ✅ The old contract (749335380) can be abandoned")
        print("-" * 70 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import os
    main()

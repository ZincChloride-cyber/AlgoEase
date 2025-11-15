"""
Deploy AlgoEase Bounty Escrow V2 Contract
This will deploy the new clean contract
"""
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.logic import get_application_address
import base64
import os

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
    import sys
    import io
    # Fix encoding for Windows
    if sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print("\n" + "="*70)
    print("DEPLOYING ALGOEASE BOUNTY ESCROW V2 CONTRACT")
    print("="*70 + "\n")
    
    try:
        # Initialize client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get creator account
        private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
        creator_address = account.address_from_private_key(private_key)
        
        print(f"[OK] Creator address: {creator_address}")
        
        # Check balance
        account_info = algod_client.account_info(creator_address)
        balance = account_info['amount'] / 1_000_000
        print(f"[OK] Creator balance: {balance} ALGO\n")
        
        if balance < 0.5:
            print("❌ Insufficient balance. Creator needs at least 0.5 ALGO for deployment.")
            return
        
        # Compile TEAL programs
        print("[*] Compiling TEAL programs...")
        approval_program = compile_program(algod_client, "contracts/algoease_bounty_escrow_v2_approval.teal")
        clear_program = compile_program(algod_client, "contracts/algoease_bounty_escrow_v2_clear.teal")
        print("   [OK] Approval program compiled")
        print("   [OK] Clear program compiled\n")
        
        # Define schema - no global or local state needed (using boxes)
        global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=0)  # Only bounty_count
        local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
        
        # Get suggested params
        params = algod_client.suggested_params()
        
        # Create application transaction
        print("[*] Creating application...")
        txn = transaction.ApplicationCreateTxn(
            sender=creator_address,
            sp=params,
            on_complete=transaction.OnComplete.NoOpOC,
            approval_program=approval_program,
            clear_program=clear_program,
            global_schema=global_schema,
            local_schema=local_schema,
            note=b"AlgoEase: Bounty Escrow V2 Deployment"
        )
        
        # Sign transaction
        print("[*] Signing transaction...")
        signed_txn = txn.sign(private_key)
        
        # Send transaction
        print("[*] Sending to blockchain...")
        tx_id = algod_client.send_transaction(signed_txn)
        print(f"   Transaction ID: {tx_id}")
        
        # Wait for confirmation
        print("[*] Waiting for confirmation (this may take a few seconds)...\n")
        confirmed_txn = transaction.wait_for_confirmation(algod_client, tx_id, 4)
        
        # Get app ID
        app_id = confirmed_txn["application-index"]
        app_address = get_application_address(app_id)
        
        print("="*70)
        print("[SUCCESS] CONTRACT DEPLOYED SUCCESSFULLY!")
        print("="*70)
        print(f"App ID: {app_id}")
        print(f"App Address (Escrow): {app_address}")
        print(f"Creator: {creator_address}")
        print(f"Transaction: https://testnet.explorer.perawallet.app/tx/{tx_id}")
        print(f"Round: {confirmed_txn['confirmed-round']}")
        print("="*70 + "\n")
        
        # Save to contract.env
        print("[*] Updating contract.env file...")
        env_content = f"""# AlgoEase Bounty Escrow V2 Contract Configuration - DEPLOYED ON TESTNET
REACT_APP_CONTRACT_APP_ID={app_id}
REACT_APP_CONTRACT_ADDRESS={app_address}
REACT_APP_CREATOR_MNEMONIC={CREATOR_MNEMONIC}
REACT_APP_CREATOR_ADDRESS={creator_address}

"""
        
        with open("contract.env", "w") as f:
            f.write(env_content)
        
        print("   [OK] contract.env updated\n")
        
        # Update frontend .env if it exists
        frontend_env_path = "frontend/.env.local"
        try:
            print("[*] Updating frontend/.env.local file...")
            
            # Read existing env
            env_lines = []
            if os.path.exists(frontend_env_path):
                with open(frontend_env_path, "r") as f:
                    env_lines = f.readlines()
            
            # Update or add the APP_ID line
            app_id_found = False
            app_address_found = False
            new_lines = []
            for line in env_lines:
                if line.startswith("REACT_APP_CONTRACT_APP_ID="):
                    new_lines.append(f"REACT_APP_CONTRACT_APP_ID={app_id}\n")
                    app_id_found = True
                elif line.startswith("REACT_APP_CONTRACT_ADDRESS="):
                    new_lines.append(f"REACT_APP_CONTRACT_ADDRESS={app_address}\n")
                    app_address_found = True
                else:
                    new_lines.append(line)
            
            if not app_id_found:
                new_lines.append(f"REACT_APP_CONTRACT_APP_ID={app_id}\n")
            if not app_address_found:
                new_lines.append(f"REACT_APP_CONTRACT_ADDRESS={app_address}\n")
            
            with open(frontend_env_path, "w") as f:
                f.writelines(new_lines)
            
            print("   [OK] frontend/.env.local updated\n")
        except Exception as e:
            print(f"   [WARN] Could not update frontend/.env.local: {e}\n")
        
        # Update backend .env if it exists
        backend_env_path = "backend/.env"
        try:
            print("[*] Updating backend/.env file...")
            
            # Read existing env
            env_lines = []
            if os.path.exists(backend_env_path):
                with open(backend_env_path, "r") as f:
                    env_lines = f.readlines()
            
            # Update or add the contract lines
            app_id_found = False
            app_address_found = False
            new_lines = []
            for line in env_lines:
                if line.startswith("CONTRACT_APP_ID=") or line.startswith("CONTRACT_APPID="):
                    new_lines.append(f"CONTRACT_APP_ID={app_id}\n")
                    app_id_found = True
                elif line.startswith("CONTRACT_ADDRESS="):
                    new_lines.append(f"CONTRACT_ADDRESS={app_address}\n")
                    app_address_found = True
                else:
                    new_lines.append(line)
            
            if not app_id_found:
                new_lines.append(f"CONTRACT_APP_ID={app_id}\n")
            if not app_address_found:
                new_lines.append(f"CONTRACT_ADDRESS={app_address}\n")
            
            with open(backend_env_path, "w") as f:
                f.writelines(new_lines)
            
            print("   [OK] backend/.env updated\n")
        except Exception as e:
            print(f"   [WARN] Could not update backend/.env: {e}\n")
        
        print("NEXT STEPS:")
        print("-" * 70)
        print("1. [OK] Contract deployed with clean state")
        print("2. [OK] Configuration files updated")
        print("3. [ ] Restart your frontend (if running)")
        print("4. [ ] Restart your backend (if running)")
        print("5. [ ] Test the contract functionality")
        print("-" * 70 + "\n")
        
        return app_id, app_address
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        import traceback
        traceback.print_exc()
        return None, None

if __name__ == "__main__":
    main()


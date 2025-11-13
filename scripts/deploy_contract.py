#!/usr/bin/env python3
"""
AlgoEase Smart Contract Deployment Script

This script deploys the AlgoEase smart contract to Algorand TestNet.
It uses the compiled TEAL files from the contracts directory.
"""

import os
import sys
from pathlib import Path
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk import logic
import base64
from algosdk.transaction import wait_for_confirmation
import json

# Load environment variables from .env file
def load_env_file(filepath):
    """Simple .env file loader"""
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    value = value.strip('"\'')
                    env_vars[key] = value
                    os.environ[key] = value
    return env_vars

# Load environment variables
# Load contract.env first (takes precedence)
contract_env_vars = load_env_file('contract.env')
# Load frontend/.env but don't overwrite contract.env values
frontend_env_vars = load_env_file('frontend/.env')

# Configuration
ALGOD_ADDRESS = os.getenv('ALGOD_URL', 'https://testnet-api.algonode.cloud')
ALGOD_TOKEN = os.getenv('ALGOD_TOKEN', '')

# Get mnemonic from environment (prioritize contract.env over frontend/.env)
CREATOR_MNEMONIC = (
    contract_env_vars.get('REACT_APP_CREATOR_MNEMONIC') or
    contract_env_vars.get('CREATOR_MNEMONIC') or
    frontend_env_vars.get('REACT_APP_CREATOR_MNEMONIC') or
    frontend_env_vars.get('CREATOR_MNEMONIC') or
    os.getenv('REACT_APP_CREATOR_MNEMONIC') or
    os.getenv('CREATOR_MNEMONIC')
)

# Validate mnemonic format
if CREATOR_MNEMONIC:
    mnemonic_words = CREATOR_MNEMONIC.strip().split()
    if len(mnemonic_words) != 25:
        print(f"Warning: Mnemonic has {len(mnemonic_words)} words, expected 25")
        print(f"First 5 words: {mnemonic_words[:5]}")
        print(f"Last 5 words: {mnemonic_words[-5:]}")
        # Try to reconstruct if it was split incorrectly
        if len(mnemonic_words) > 25:
            # Might have extra spaces or formatting
            CREATOR_MNEMONIC = ' '.join(mnemonic_words[:25])
            print(f"Using first 25 words")
        elif len(mnemonic_words) < 25:
            # Might be missing words - but still try to use it if close
            if len(mnemonic_words) >= 24:
                print(f"Warning: Mnemonic has {len(mnemonic_words)} words, but continuing anyway")
                # Don't set to None, allow it to proceed and see what happens
            else:
                print(f"Error: Mnemonic is too incomplete ({len(mnemonic_words)} words)")
                CREATOR_MNEMONIC = None
    else:
        print(f"Mnemonic validated: {len(mnemonic_words)} words")

# Validate configuration
if not CREATOR_MNEMONIC:
    print("Error: CREATOR_MNEMONIC not found in environment variables")
    print("Please set CREATOR_MNEMONIC in contract.env or frontend/.env")
    sys.exit(1)

# Initialize Algod client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Get creator account
creator_private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
creator_address = account.address_from_private_key(creator_private_key)

def compile_program(client, source_file):
    """Compile TEAL file to bytes"""
    if not os.path.exists(source_file):
        raise FileNotFoundError(f"TEAL file not found: {source_file}")
    
    with open(source_file, "r") as f:
        source_code = f.read()
    
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response["result"])

def deploy_contract():
    """Deploy the AlgoEase smart contract"""
    print("Starting AlgoEase smart contract deployment...")
    print(f"Using account: {creator_address}")
    print(f"Network: {ALGOD_ADDRESS}")
    
    # Check if TEAL files exist
    approval_teal = "contracts/algoease_approval.teal"
    clear_teal = "contracts/algoease_clear.teal"
    
    if not os.path.exists(approval_teal):
        raise FileNotFoundError(f"TEAL files not found. Please compile the contract first by running: python contracts/algoease_contract_v3.py")
    
    # Compile TEAL programs
    print("Compiling TEAL programs...")
    approval_program = compile_program(algod_client, approval_teal)
    clear_program = compile_program(algod_client, clear_teal)
    
    # Get suggested parameters
    print("Getting transaction parameters...")
    suggested_params = algod_client.suggested_params()
    
    # Global schema: 1 uint (bounty_count), 0 byte slices (bounties stored in boxes)
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=0)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
    
    # Create application transaction
    print("Creating application transaction...")
    txn = transaction.ApplicationCreateTxn(
        sender=creator_address,
        sp=suggested_params,
        on_complete=transaction.OnComplete.NoOpOC.real,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
    )
    
    # Sign transaction
    print("Signing transaction...")
    signed_txn = txn.sign(creator_private_key)
    
    # Send transaction
    print("Submitting transaction...")
    txid = algod_client.send_transaction(signed_txn)
    print(f"Transaction ID: {txid}")
    
    # Wait for confirmation
    print("Waiting for confirmation...")
    confirmed_txn = wait_for_confirmation(algod_client, txid, 10)
    app_id = confirmed_txn["application-index"]
    app_address = logic.get_application_address(app_id)
    
    print(f"\nDeployment successful!")
    print(f"   Application ID: {app_id}")
    print(f"   Application Address: {app_address}")
    print(f"   Transaction ID: {txid}")
    
    # Save contract info to file
    contract_info = {
        "appId": app_id,
        "appAddress": app_address,
        "network": "testnet",
        "deployedAt": confirmed_txn.get("confirmed-round"),
        "transactionId": txid
    }
    
    with open("contract-info.json", "w") as f:
        json.dump(contract_info, f, indent=2)
    
    print(f"\nContract info saved to contract-info.json")
    
    # Update environment files
    update_env_files(app_id, app_address)
    
    return app_id, app_address

def update_env_files(app_id, app_address):
    """Update environment files with contract addresses"""
    print("\nUpdating environment files...")
    
    # Update contract.env
    contract_env_path = "contract.env"
    env_content = f"""# AlgoEase Contract Configuration
REACT_APP_CONTRACT_APP_ID={app_id}
REACT_APP_CONTRACT_ADDRESS={app_address}
REACT_APP_CREATOR_MNEMONIC={CREATOR_MNEMONIC}
REACT_APP_CREATOR_ADDRESS={creator_address}
"""
    
    with open(contract_env_path, "w") as f:
        f.write(env_content)
    print(f"Updated {contract_env_path}")
    
    # Update frontend/.env if it exists
    frontend_env_path = "frontend/.env"
    if os.path.exists(frontend_env_path):
        # Read existing .env file
        env_vars = {}
        with open(frontend_env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value.strip('"\'')
        
        # Update contract-related variables
        env_vars['REACT_APP_CONTRACT_APP_ID'] = str(app_id)
        env_vars['REACT_APP_CONTRACT_ADDRESS'] = app_address
        env_vars['REACT_APP_CREATOR_ADDRESS'] = creator_address
        
        # Write updated .env file
        with open(frontend_env_path, 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        print(f"Updated {frontend_env_path}")
    else:
        # Create frontend/.env if it doesn't exist
        frontend_env_content = f"""# AlgoEase Frontend Configuration
REACT_APP_CONTRACT_APP_ID={app_id}
REACT_APP_CONTRACT_ADDRESS={app_address}
REACT_APP_ALGOD_URL={ALGOD_ADDRESS}
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet
REACT_APP_API_URL=http://localhost:5000/api
"""
        os.makedirs("frontend", exist_ok=True)
        with open(frontend_env_path, "w") as f:
            f.write(frontend_env_content)
        print(f"Created {frontend_env_path}")
    
    # Update backend/.env if it exists
    backend_env_path = "backend/.env"
    if os.path.exists(backend_env_path):
        # Read existing .env file
        env_vars = {}
        with open(backend_env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value.strip('"\'')
        
        # Update contract-related variables
        env_vars['CONTRACT_APP_ID'] = str(app_id)
        env_vars['CONTRACT_ADDRESS'] = app_address
        
        # Write updated .env file
        with open(backend_env_path, 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        print(f"Updated {backend_env_path}")
    else:
        print(f"Warning: {backend_env_path} not found. Please create it manually or copy from backend/env.example")

def main():
    """Main deployment function"""
    try:
        # Check account balance
        account_info = algod_client.account_info(creator_address)
        balance = account_info.get("amount", 0) / 1000000  # Convert to ALGO
        print(f"Account balance: {balance:.2f} ALGO")
        
        if balance < 1:
            print("Warning: Low account balance. You may need more ALGO for deployment.")
        
        # Deploy contract
        app_id, app_address = deploy_contract()
        
        print(f"\nDeployment complete!")
        print(f"\nNext steps:")
        print(f"   1. Run the database migration to add 'rejected' status: backend/migrations/add_rejected_status.sql")
        print(f"   2. Restart your backend server")
        print(f"   3. Restart your frontend server")
        print(f"   4. Test the contract functionality")
        
    except Exception as e:
        print(f"\nDeployment failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()


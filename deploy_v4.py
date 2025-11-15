"""
Deploy AlgoEase Contract V4
Deploys the contract and updates all environment files with the new app ID and address.
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk import logic
import base64
import os
import json
from algosdk.transaction import wait_for_confirmation

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
                    # Remove quotes if present
                    value = value.strip('"\'')
                    env_vars[key] = value
                    os.environ[key] = value
    return env_vars

# Try loading from multiple locations
load_env_file('frontend/.env')
load_env_file('contract.env')

# ---------------- CONFIG ----------------
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Algonode doesn't require a token
CREATOR_MNEMONIC = os.getenv('REACT_APP_CREATOR_MNEMONIC') or os.getenv('CREATOR_MNEMONIC')

# Validate that mnemonic is loaded
if not CREATOR_MNEMONIC:
    raise ValueError("REACT_APP_CREATOR_MNEMONIC not found in .env file. Please add it to your .env file.")

# ----------------------------------------

# Initialize client
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
creator_private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
creator_address = account.address_from_private_key(creator_private_key)

def compile_program(client, source_file):
    """Compile TEAL file to bytes"""
    with open(source_file, "r") as f:
        source_code = f.read()
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response["result"])

def update_env_file(filepath, app_id, app_address):
    """Update .env file with new app ID and address"""
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} does not exist, skipping...")
        return
    
    lines = []
    updated = False
    
    with open(filepath, 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_CONTRACT_APP_ID='):
                lines.append(f'REACT_APP_CONTRACT_APP_ID={app_id}\n')
                updated = True
            elif line.startswith('REACT_APP_CONTRACT_ADDRESS='):
                lines.append(f'REACT_APP_CONTRACT_ADDRESS={app_address}\n')
                updated = True
            else:
                lines.append(line)
    
    # Add if not found
    if not any('REACT_APP_CONTRACT_APP_ID' in line for line in lines):
        lines.append(f'REACT_APP_CONTRACT_APP_ID={app_id}\n')
        updated = True
    if not any('REACT_APP_CONTRACT_ADDRESS' in line for line in lines):
        lines.append(f'REACT_APP_CONTRACT_ADDRESS={app_address}\n')
        updated = True
    
    if updated:
        with open(filepath, 'w') as f:
            f.writelines(lines)
        print(f"Updated {filepath}")

def update_contract_info(app_id, app_address):
    """Update contract-info.json files"""
    contract_info = {
        "appId": app_id,
        "appAddress": app_address,
        "version": "v4"
    }
    
    # Update contract-info.json
    with open("contract-info.json", "w") as f:
        json.dump(contract_info, f, indent=2)
    print("Updated contract-info.json")
    
    # Update contract-info-v3.json (for backward compatibility)
    with open("contract-info-v3.json", "w") as f:
        json.dump(contract_info, f, indent=2)
    print("Updated contract-info-v3.json")

def main():
    print("=" * 80)
    print("Deploying AlgoEase Contract V4")
    print("=" * 80)
    print(f"Creator Address: {creator_address}")
    print()
    
    # Compile TEAL programs
    print("Compiling TEAL programs...")
    approval_program = compile_program(algod_client, "contracts/algoease_approval_v4.teal")
    clear_program = compile_program(algod_client, "contracts/algoease_clear_v4.teal")
    print("Compilation successful!")
    print()

    # Global schema: 1 uint (bounty_counter), 0 byte slices (bounties stored in boxes)
    # Box storage doesn't count toward global schema limits
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=0)
    local_schema  = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    # Suggested params
    sp = algod_client.suggested_params()

    # Create application transaction
    print("Creating application transaction...")
    txn = transaction.ApplicationCreateTxn(
        sender=creator_address,
        sp=sp,
        on_complete=transaction.OnComplete.NoOpOC.real,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
    )

    # Sign transaction
    signed_txn = txn.sign(creator_private_key)

    # Send transaction
    print("Sending transaction to network...")
    txid = algod_client.send_transaction(signed_txn)
    print(f"Transaction ID: {txid}")

    # Wait for confirmation
    print("Waiting for confirmation...")
    confirmed_txn = wait_for_confirmation(algod_client, txid, 10)
    app_id = confirmed_txn["application-index"]
    app_address = logic.get_application_address(app_id)
    
    print()
    print("=" * 80)
    print("Deployment successful!")
    print("=" * 80)
    print(f"App ID: {app_id}")
    print(f"App Address (Escrow): {app_address}")
    print()
    
    # Update all environment files
    print("Updating environment files...")
    update_env_file("frontend/.env", app_id, app_address)
    update_env_file("contract.env", app_id, app_address)
    update_contract_info(app_id, app_address)
    
    print()
    print("=" * 80)
    print("Deployment complete!")
    print("=" * 80)
    print(f"Contract deployed with App ID: {app_id}")
    print(f"Escrow address: {app_address}")
    print()
    print("All environment files have been updated.")
    print("Please restart your frontend and backend servers to use the new contract.")

if __name__ == "__main__":
    main()


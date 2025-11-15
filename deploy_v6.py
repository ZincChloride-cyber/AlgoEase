from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
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
    raise ValueError("REACT_APP_CREATOR_MNEMONIC not found in .env file. Please add it to your contract.env file.")

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

def update_env_files(app_id, app_address):
    """Update environment files with new contract info"""
    # Update contract.env
    contract_env_path = "contract.env"
    env_content = f"""# AlgoEase Contract Configuration
# Contract V6 - Escrow and Claim Flow
# App ID: {app_id} (V6)
# Escrow Address: {app_address}
REACT_APP_CONTRACT_APP_ID={app_id}
REACT_APP_CONTRACT_ADDRESS={app_address}
REACT_APP_CREATOR_MNEMONIC={CREATOR_MNEMONIC}
REACT_APP_CREATOR_ADDRESS={creator_address}
"""
    with open(contract_env_path, 'w') as f:
        f.write(env_content)
    print(f"Updated {contract_env_path}")

    # Update frontend/.env if it exists
    frontend_env_path = "frontend/.env"
    frontend_env_content = f"""# AlgoEase Frontend Configuration - V6 Contract
REACT_APP_CONTRACT_APP_ID={app_id}
REACT_APP_CONTRACT_ADDRESS={app_address}
REACT_APP_ALGOD_URL={ALGOD_ADDRESS}
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet
"""
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(frontend_env_path) if os.path.dirname(frontend_env_path) else '.', exist_ok=True)
    with open(frontend_env_path, 'w') as f:
        f.write(frontend_env_content)
    print(f"Updated {frontend_env_path}")

    # Update contract-info.json
    contract_info = {
        "appId": app_id,
        "appAddress": app_address,
        "network": "testnet",
        "version": "v6",
        "deployedAt": __import__('datetime').datetime.now().isoformat(),
        "creator": creator_address,
        "algodUrl": ALGOD_ADDRESS,
        "indexerUrl": "https://testnet-idx.algonode.cloud"
    }
    with open("contract-info-v6.json", 'w') as f:
        json.dump(contract_info, f, indent=2)
    print(f"Updated contract-info-v6.json")

def main():
    print("Deploying AlgoEase V6 Smart Contract...")
    print(f"Creator Address: {creator_address}")
    print(f"Network: TestNet")
    print()

    # Compile TEAL programs
    print("Reading and compiling TEAL programs...")
    approval_program = compile_program(algod_client, "contracts/algoease_approval_v6.teal")
    clear_program = compile_program(algod_client, "contracts/algoease_clear_v6.teal")
    print("TEAL programs compiled successfully")

    # Global schema: 1 uint (bounty_counter), 0 byte slices (bounties stored in boxes)
    # Box storage doesn't count toward global schema limits
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=0)
    local_schema  = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    # Suggested params
    print("Getting suggested parameters...")
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
    print("Signing transaction...")
    signed_txn = txn.sign(creator_private_key)

    # Send transaction
    print("Sending transaction to network...")
    txid = algod_client.send_transaction(signed_txn)
    print(f"Transaction ID: {txid}")

    # Wait for confirmation
    print("Waiting for confirmation...")
    confirmed_txn = wait_for_confirmation(algod_client, txid, 10)
    app_id = confirmed_txn["application-index"]
    
    # Calculate application address using algosdk
    from algosdk import logic
    app_address = logic.get_application_address(app_id)
    
    print()
    print("Deployment successful!")
    print(f"Application ID: {app_id}")
    print(f"Application Address: {app_address}")
    print()

    # Update environment files
    print("Updating configuration files...")
    update_env_files(app_id, app_address)
    
    print()
    print("All configuration files updated!")
    print()
    print("Next steps:")
    print("1. Restart your frontend server")
    print("2. Test the contract functionality")
    print("3. Verify the contract in AlgoExplorer")

if __name__ == "__main__":
    main()


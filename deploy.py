from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
import base64
import os
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

load_env_file('frontend/.env')

# ---------------- CONFIG ----------------
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""  # Algonode doesn't require a token
CREATOR_MNEMONIC = os.getenv('REACT_APP_CREATOR_MNEMONIC')

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

def main():
    # Compile TEAL programs
    approval_program = compile_program(algod_client, "contracts/algoease_approval.teal")
    clear_program = compile_program(algod_client, "contracts/algoease_clear.teal")

    # Global schema: 4 uints, 4 byte slices (matches your contract)
    global_schema = transaction.StateSchema(num_uints=4, num_byte_slices=4)
    local_schema  = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    # Suggested params
    sp = algod_client.suggested_params()

    # Create application transaction
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
    txid = algod_client.send_transaction(signed_txn)
    print("Transaction sent:", txid)

    # Wait for confirmation
    confirmed_txn = wait_for_confirmation(algod_client, txid, 10)
    app_id = confirmed_txn["application-index"]
    print("Deployed successfully!")
    print("App ID:", app_id)

if __name__ == "__main__":
    main()

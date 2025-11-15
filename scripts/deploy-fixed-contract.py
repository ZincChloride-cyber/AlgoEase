#!/usr/bin/env python3
"""
Deploy the fixed AlgoEase contract to TestNet
"""

import json
import base64
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCreateTxn, wait_for_confirmation, StateSchema
from algosdk import encoding

# Configuration
TESTNET_ALGOD = "https://testnet-api.algonode.cloud"
CREATOR_MNEMONIC = "once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place"

def compile_teal(client, source_path):
    """Compile TEAL source code"""
    with open(source_path, 'r') as f:
        teal_source = f.read()
    
    compile_response = client.compile(teal_source)
    # Decode base64 to bytes
    program_bytes = base64.b64decode(compile_response['result'])
    return program_bytes, compile_response['hash']

def deploy_contract():
    """Deploy the fixed contract"""
    print("=" * 80)
    print("Deploying Fixed AlgoEase Contract to TestNet")
    print("=" * 80)
    
    # Initialize client
    algod_client = algod.AlgodClient("", TESTNET_ALGOD)
    
    # Get creator account
    creator_private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
    creator_address = account.address_from_private_key(creator_private_key)
    
    print(f"\nCreator Address: {creator_address}")
    
    # Get account info
    account_info = algod_client.account_info(creator_address)
    balance = account_info['amount'] / 1_000_000
    print(f"Balance: {balance} ALGO")
    
    if balance < 1:
        print("\n[ERROR] Insufficient balance. Need at least 1 ALGO for deployment.")
        return None, None
    
    # Compile programs
    print("\n[1/4] Compiling approval program...")
    approval_program, approval_hash = compile_teal(algod_client, "contracts/algoease_approval_fixed.teal")
    print(f"  Approval program hash: {approval_hash}")
    
    print("[2/4] Compiling clear program...")
    clear_program, clear_hash = compile_teal(algod_client, "contracts/algoease_clear_fixed.teal")
    print(f"  Clear program hash: {clear_hash}")
    
    # Get suggested params
    print("[3/4] Getting transaction parameters...")
    params = algod_client.suggested_params()
    
    # Create application
    print("[4/4] Creating application...")
    on_complete = 0  # NoOp
    
    # Global schema: 1 uint64 (bounty_count)
    global_schema = StateSchema(num_uints=1, num_byte_slices=0)
    
    # Local schema: none
    local_schema = StateSchema(num_uints=0, num_byte_slices=0)
    
    txn = ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=on_complete,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
    )
    
    # Sign and send
    signed_txn = txn.sign(creator_private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"  Transaction ID: {txid}")
    
    # Wait for confirmation
    print("\nWaiting for confirmation...")
    try:
        confirmed_txn = wait_for_confirmation(algod_client, txid, 10)
        print(f"  Confirmed in round: {confirmed_txn['confirmed-round']}")
    except Exception as e:
        print(f"  [ERROR] Confirmation failed: {e}")
        return None, None
    
    # Get app ID from transaction
    transaction_response = algod_client.pending_transaction_info(txid)
    app_id = transaction_response['application-index']
    app_address = encoding.encode_address(encoding.decode_address(creator_address))
    
    # Calculate actual app address
    from algosdk import logic
    app_address = logic.get_application_address(app_id)
    
    print("\n" + "=" * 80)
    print("[SUCCESS] Contract deployed successfully!")
    print("=" * 80)
    print(f"App ID: {app_id}")
    print(f"App Address: {app_address}")
    print(f"Transaction ID: {txid}")
    print("=" * 80)
    
    # Save contract info
    contract_info = {
        "appId": app_id,
        "appAddress": app_address,
        "network": "testnet",
        "deployedAt": confirmed_txn['confirmed-round'],
        "transactionId": txid
    }
    
    with open("contract-info.json", "w") as f:
        json.dump(contract_info, f, indent=2)
    
    print("\nContract info saved to contract-info.json")
    
    return app_id, app_address

if __name__ == "__main__":
    deploy_contract()


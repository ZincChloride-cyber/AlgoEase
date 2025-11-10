#!/usr/bin/env python3
"""
AlgoEase Deployment Script

This script handles the deployment of the AlgoEase smart contract using AlgoKit.
"""

import os
import sys
from pathlib import Path

# Add the contracts directory to the Python path
sys.path.append(str(Path(__file__).parent.parent / "projects" / "algoease-contracts"))

from algokit_utils import (
    ApplicationClient,
    ApplicationSpecification,
    get_algod_client,
    get_indexer_client,
    get_localnet_default_account,
    get_testnet_default_account,
    get_mainnet_default_account,
    Network,
    TransactionParameters,
)
from algosdk.atomic_transaction_composer import TransactionWithSigner
from algosdk.transaction import PaymentTxn
from algosdk.encoding import decode_address, encode_address

# Import our contract
from algoease_contract import approval_program, clear_state_program

def deploy_contract(network: Network = Network.TESTNET):
    """Deploy the AlgoEase contract to the specified network."""
    
    print(f"🚀 Deploying AlgoEase contract to {network.value}...")
    
    # Get clients
    algod_client = get_algod_client(network)
    indexer_client = get_indexer_client(network)
    
    # Get default account
    if network == Network.LOCALNET:
        account = get_localnet_default_account(algod_client)
    elif network == Network.TESTNET:
        account = get_testnet_default_account(algod_client)
    else:  # MAINNET
        account = get_mainnet_default_account(algod_client)
    
    print(f"📝 Using account: {account.address}")
    
    # Create application specification
    app_spec = ApplicationSpecification(
        name="AlgoEase",
        description="Decentralized escrow platform for freelance payments",
        approval_program=approval_program(),
        clear_state_program=clear_state_program(),
        global_schema=None,  # Will be set by PyTeal
        local_schema=None,    # Will be set by PyTeal
    )
    
    # Create application client
    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        signer=account,
    )
    
    # Deploy the application
    try:
        app_id, app_address, txid = app_client.create()
        print(f"✅ Contract deployed successfully!")
        print(f"   App ID: {app_id}")
        print(f"   App Address: {app_address}")
        print(f"   Transaction ID: {txid}")
        
        # Save deployment info
        deployment_info = {
            "network": network.value,
            "app_id": app_id,
            "app_address": app_address,
            "deployment_tx": txid,
            "deployer": account.address
        }
        
        # Write to file
        with open("deployment_info.json", "w") as f:
            import json
            json.dump(deployment_info, f, indent=2)
        
        print(f"📄 Deployment info saved to deployment_info.json")
        
        return app_id, app_address
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        return None, None

def fund_contract(app_address: str, amount: int, network: Network = Network.TESTNET):
    """Fund the contract with ALGO for testing."""
    
    print(f"💰 Funding contract with {amount} microALGO...")
    
    algod_client = get_algod_client(network)
    
    if network == Network.LOCALNET:
        account = get_localnet_default_account(algod_client)
    elif network == Network.TESTNET:
        account = get_testnet_default_account(algod_client)
    else:
        account = get_mainnet_default_account(algod_client)
    
    # Create payment transaction
    params = algod_client.suggested_params()
    txn = PaymentTxn(
        sender=account.address,
        receiver=app_address,
        amount=amount,
        sp=params,
    )
    
    # Sign and send
    signed_txn = account.sign_transaction(txn)
    txid = algod_client.send_transaction(signed_txn)
    
    print(f"✅ Contract funded! Transaction ID: {txid}")
    return txid

def main():
    """Main deployment function."""
    
    # Check command line arguments
    if len(sys.argv) > 1:
        network_arg = sys.argv[1].lower()
        if network_arg == "localnet":
            network = Network.LOCALNET
        elif network_arg == "testnet":
            network = Network.TESTNET
        elif network_arg == "mainnet":
            network = Network.MAINNET
        else:
            print("❌ Invalid network. Use: localnet, testnet, or mainnet")
            return
    else:
        network = Network.TESTNET  # Default to testnet
    
    print(f"🌐 Deploying to {network.value} network")
    
    # Deploy contract
    app_id, app_address = deploy_contract(network)
    
    if app_id and app_address:
        # Fund contract for testing (only on testnet/localnet)
        if network in [Network.TESTNET, Network.LOCALNET]:
            fund_contract(app_address, 1000000)  # 1 ALGO
        
        print(f"\n🎉 Deployment complete!")
        print(f"   Next steps:")
        print(f"   1. Update your frontend with App ID: {app_id}")
        print(f"   2. Update your backend with App ID: {app_id}")
        print(f"   3. Test the contract functionality")

if __name__ == "__main__":
    main()

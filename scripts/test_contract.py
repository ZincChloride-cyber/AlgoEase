#!/usr/bin/env python3
"""
AlgoEase Testing Script

This script tests the AlgoEase smart contract functionality.
"""

import os
import sys
from pathlib import Path

# Add the contracts directory to the Python path
sys.path.append(str(Path(__file__).parent / "contracts"))

from algokit_utils import (
    ApplicationClient,
    ApplicationSpecification,
    get_algod_client,
    get_localnet_default_account,
    Network,
)
from algosdk.atomic_transaction_composer import TransactionWithSigner
from algosdk.transaction import PaymentTxn
from algosdk.encoding import decode_address, encode_address
import time

# Import our contract
from algoease_contract import approval_program, clear_state_program

def test_contract():
    """Test the AlgoEase contract functionality."""
    
    print("🧪 Starting AlgoEase contract tests...")
    
    # Get clients
    algod_client = get_algod_client(Network.LOCALNET)
    account = get_localnet_default_account(algod_client)
    
    print(f"📝 Using account: {account.address}")
    
    # Create application specification
    app_spec = ApplicationSpecification(
        name="AlgoEase",
        description="Decentralized escrow platform for freelance payments",
        approval_program=approval_program(),
        clear_state_program=clear_state_program(),
    )
    
    # Create application client
    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        signer=account,
    )
    
    # Deploy the application
    print("🚀 Deploying contract...")
    app_id, app_address, txid = app_client.create()
    print(f"✅ Contract deployed! App ID: {app_id}")
    
    # Test 1: Create a bounty
    print("\n📋 Test 1: Creating a bounty...")
    
    bounty_amount = 1000000  # 1 ALGO in microAlgos
    deadline = int(time.time()) + 86400  # 24 hours from now
    task_description = "Test task description"
    verifier_address = account.address  # Self as verifier
    
    # Fund the contract first
    params = algod_client.suggested_params()
    fund_txn = PaymentTxn(
        sender=account.address,
        receiver=app_address,
        amount=bounty_amount,
        sp=params,
    )
    
    # Create bounty transaction
    create_txn = app_client.create_transaction(
        method="create_bounty",
        args=[
            bounty_amount,
            deadline,
            task_description,
            verifier_address
        ]
    )
    
    # Group transactions
    from algosdk.transaction import assign_group_id
    grouped_txns = assign_group_id([fund_txn, create_txn])
    
    # Sign and send
    signed_fund = account.sign_transaction(grouped_txns[0])
    signed_create = account.sign_transaction(grouped_txns[1])
    
    txid = algod_client.send_transactions([signed_fund, signed_create])
    print(f"✅ Bounty created! Transaction ID: {txid}")
    
    # Test 2: Accept bounty (simulate freelancer)
    print("\n👤 Test 2: Accepting bounty...")
    
    # Create a second account for freelancer
    from algosdk import account as algo_account
    freelancer_private_key, freelancer_address = algo_account.generate_account()
    
    # Fund freelancer account
    params = algod_client.suggested_params()
    fund_freelancer = PaymentTxn(
        sender=account.address,
        receiver=freelancer_address,
        amount=1000000,  # 1 ALGO
        sp=params,
    )
    
    signed_fund_freelancer = account.sign_transaction(fund_freelancer)
    algod_client.send_transaction(signed_fund_freelancer)
    
    # Accept bounty
    accept_txn = app_client.create_transaction(
        method="accept_bounty",
        args=[]
    )
    
    # Sign with freelancer
    signed_accept = algo_account.sign_transaction(accept_txn, freelancer_private_key)
    txid = algod_client.send_transaction(signed_accept)
    print(f"✅ Bounty accepted! Transaction ID: {txid}")
    
    # Test 3: Approve bounty
    print("\n✅ Test 3: Approving bounty...")
    
    approve_txn = app_client.create_transaction(
        method="approve_bounty",
        args=[]
    )
    
    signed_approve = account.sign_transaction(approve_txn)
    txid = algod_client.send_transaction(signed_approve)
    print(f"✅ Bounty approved! Transaction ID: {txid}")
    
    # Test 4: Claim bounty
    print("\n💰 Test 4: Claiming bounty...")
    
    claim_txn = app_client.create_transaction(
        method="claim",
        args=[]
    )
    
    signed_claim = algo_account.sign_transaction(claim_txn, freelancer_private_key)
    txid = algod_client.send_transaction(signed_claim)
    print(f"✅ Bounty claimed! Transaction ID: {txid}")
    
    print("\n🎉 All tests passed successfully!")
    
    # Get final state
    app_info = algod_client.application_info(app_id)
    print(f"\n📊 Final contract state:")
    print(f"   App ID: {app_id}")
    print(f"   App Address: {app_address}")
    print(f"   Creator: {app_info['params']['creator']}")

def main():
    """Main testing function."""
    
    try:
        test_contract()
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Check Algorand account balance for deployment
"""

import os
import sys
from algosdk import account, mnemonic
from algosdk.v2client import algod

# Load environment variables
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
contract_env_vars = load_env_file('contract.env')
frontend_env_vars = load_env_file('frontend/.env')

# Get mnemonic
CREATOR_MNEMONIC = (
    contract_env_vars.get('REACT_APP_CREATOR_MNEMONIC') or
    contract_env_vars.get('CREATOR_MNEMONIC') or
    frontend_env_vars.get('REACT_APP_CREATOR_MNEMONIC') or
    frontend_env_vars.get('CREATOR_MNEMONIC') or
    os.getenv('REACT_APP_CREATOR_MNEMONIC') or
    os.getenv('CREATOR_MNEMONIC')
)

if not CREATOR_MNEMONIC:
    print("Error: CREATOR_MNEMONIC not found")
    sys.exit(1)

# Initialize client
ALGOD_ADDRESS = os.getenv('ALGOD_URL', 'https://testnet-api.algonode.cloud')
ALGOD_TOKEN = os.getenv('ALGOD_TOKEN', '')
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Get account address
creator_private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
creator_address = account.address_from_private_key(creator_private_key)

# Get account info
account_info = algod_client.account_info(creator_address)
balance = account_info.get("amount", 0) / 1000000  # Convert to ALGO
min_balance = account_info.get("min-balance", 0) / 1000000  # Convert to ALGO

# Estimated deployment cost (includes minimum balance increase)
estimated_cost = 0.2  # Approximate ALGO needed for deployment
required_balance = min_balance + estimated_cost
available = balance - min_balance
shortage = max(0, required_balance - balance)

print(f"Account: {creator_address}")
print(f"Current Balance: {balance:.6f} ALGO")
print(f"Minimum Balance: {min_balance:.6f} ALGO")
print(f"Available: {available:.6f} ALGO")
print(f"Required for Deployment: ~{required_balance:.6f} ALGO")
print(f"Shortage: {shortage:.6f} ALGO")

if balance >= required_balance:
    print("\nAccount has sufficient balance for deployment!")
    print("You can now run: python scripts/deploy_contract.py")
    sys.exit(0)
else:
    print(f"\nAccount needs {shortage:.6f} more ALGO for deployment")
    print(f"\nTo get testnet ALGO:")
    print(f"1. Visit: https://bank.testnet.algorand.network/")
    print(f"2. Request ALGO for address: {creator_address}")
    print(f"3. Wait for transaction confirmation")
    print(f"4. Run this script again to check balance")
    sys.exit(1)


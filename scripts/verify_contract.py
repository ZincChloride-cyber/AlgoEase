#!/usr/bin/env python3
"""
Verify AlgoEase Smart Contract Deployment
"""

import os
import sys
from algosdk.v2client import algod
from algosdk import logic

# Configuration
ALGOD_ADDRESS = os.getenv('ALGOD_URL', 'https://testnet-api.algonode.cloud')
ALGOD_TOKEN = os.getenv('ALGOD_TOKEN', '')

# Contract ID from deployment
CONTRACT_APP_ID = 749599170

def verify_contract():
    """Verify the deployed contract"""
    try:
        # Initialize client
        algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
        
        # Get application info
        print(f"Checking contract: {CONTRACT_APP_ID}")
        app_info = algod_client.application_info(CONTRACT_APP_ID)
        
        # Get contract address
        app_address = logic.get_application_address(CONTRACT_APP_ID)
        
        # Display contract information
        print(f"\nContract Verification:")
        print(f"  Application ID: {CONTRACT_APP_ID}")
        print(f"  Application Address: {app_address}")
        print(f"  Creator: {app_info['params'].get('creator', 'N/A')}")
        if 'created-at-round' in app_info['params']:
            print(f"  Created at Round: {app_info['params']['created-at-round']}")
        
        # Check global state
        global_state = app_info.get('params', {}).get('global-state', [])
        print(f"\nGlobal State ({len(global_state)} keys):")
        if global_state:
            for item in global_state:
                key = item['key']
                value = item['value']
                # Decode key
                if key:
                    import base64
                    key_decoded = base64.b64decode(key).decode('utf-8')
                    if value.get('uint'):
                        print(f"  - {key_decoded}: {value['uint']}")
                    elif value.get('bytes'):
                        print(f"  - {key_decoded}: {value['bytes']}")
        else:
            print("  (No global state - contract initialized)")
        
        # Check if contract address has balance
        try:
            account_info = algod_client.account_info(app_address)
            balance = account_info.get('amount', 0) / 1000000
            min_balance = account_info.get('min-balance', 0) / 1000000
            print(f"\nContract Account:")
            print(f"  Balance: {balance:.6f} ALGO")
            print(f"  Minimum Balance: {min_balance:.6f} ALGO")
            print(f"  Available: {balance - min_balance:.6f} ALGO")
        except Exception as e:
            print(f"\nContract Account: (Error checking balance: {e})")
        
        print(f"\nContract is deployed and accessible!")
        print(f"\nView on AlgoExplorer: https://testnet.algoexplorer.io/application/{CONTRACT_APP_ID}")
        
        return True
        
    except Exception as e:
        print(f"Error verifying contract: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = verify_contract()
    sys.exit(0 if success else 1)


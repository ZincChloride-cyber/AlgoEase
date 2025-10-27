#!/usr/bin/env python3
"""
Real-time transaction monitoring for bounty creation
"""
from algosdk.v2client import algod
import time
import os

# Load environment
def load_env_file(filepath):
    env_vars = {}
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    value = value.strip('"\'')
                    env_vars[key] = value
    return env_vars

env = load_env_file('frontend/.env')

ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
APP_ID = int(env.get('REACT_APP_CONTRACT_APP_ID', '748433709'))

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

print("=" * 80)
print("🎬 LIVE TRANSACTION MONITOR")
print("=" * 80)
print(f"Monitoring App ID: {APP_ID}")
print("Waiting for new transactions...")
print("=" * 80)
print()

# Get initial state
try:
    app_info = algod_client.application_info(APP_ID)
    initial_state = app_info.get('params', {}).get('global-state', [])
    initial_count = 0
    
    for item in initial_state:
        import base64
        key = base64.b64decode(item['key']).decode('utf-8')
        if key == 'bounty_count' and item['value']['type'] == 1:
            initial_count = item['value']['uint']
    
    print(f"📊 Current bounty count: {initial_count}")
    print("⏳ Waiting for new bounty creation...")
    print()
    
    # Poll for changes
    for i in range(30):  # Wait up to 60 seconds (30 * 2)
        time.sleep(2)
        
        app_info = algod_client.application_info(APP_ID)
        current_state = app_info.get('params', {}).get('global-state', [])
        
        for item in current_state:
            key = base64.b64decode(item['key']).decode('utf-8')
            if key == 'bounty_count' and item['value']['type'] == 1:
                current_count = item['value']['uint']
                
                if current_count > initial_count:
                    print("=" * 80)
                    print("🎉 BOUNTY CREATED SUCCESSFULLY!")
                    print("=" * 80)
                    print(f"New bounty count: {current_count}")
                    print()
                    print("Running full state check...")
                    print()
                    import subprocess
                    subprocess.run(["python", "check-bounty-state.py"])
                    exit(0)
        
        # Show progress
        if i % 5 == 0:
            print(f"⏳ Still waiting... ({i*2}s elapsed)")
    
    print()
    print("⏱️  Timeout reached. The transaction may still be processing.")
    print("Run: python check-bounty-state.py to check manually")
    
except KeyboardInterrupt:
    print("\n⏸️  Monitoring stopped by user")
except Exception as e:
    print(f"❌ Error: {e}")


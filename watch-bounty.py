#!/usr/bin/env python3
"""
Continuous monitoring for bounty creation
"""
from algosdk.v2client import algod
import time
import os

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
print("🎬 WATCHING FOR BOUNTY CREATION")
print("=" * 80)
print(f"App ID: {APP_ID}")
print("Press Ctrl+C to stop")
print("=" * 80)

last_count = None

while True:
    try:
        app_info = algod_client.application_info(APP_ID)
        current_state = app_info.get('params', {}).get('global-state', [])
        
        import base64
        current_count = None
        
        for item in current_state:
            key = base64.b64decode(item['key']).decode('utf-8')
            if key == 'bounty_count' and item['value']['type'] == 1:
                current_count = item['value']['uint']
                break
        
        if last_count is None:
            last_count = current_count or 0
            print(f"📊 Initial bounty count: {last_count}")
            print("⏳ Waiting for changes...\n")
        elif current_count != last_count:
            print("\n" + "=" * 80)
            print("🎉 BOUNTY CREATED!")
            print("=" * 80)
            import subprocess
            subprocess.run(["python", "check-bounty-state.py"])
            break
        
        time.sleep(3)
        print(".", end="", flush=True)
        
    except KeyboardInterrupt:
        print("\n\n⏸️  Stopped by user")
        break
    except Exception as e:
        print(f"\n❌ Error: {e}")
        time.sleep(5)


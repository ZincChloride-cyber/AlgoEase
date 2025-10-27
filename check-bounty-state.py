#!/usr/bin/env python3
"""
Check the current bounty state in the smart contract
"""
from algosdk.v2client import algod
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

def decode_state(state_array):
    """Decode the global state"""
    state = {}
    for item in state_array:
        key = item['key']
        value = item['value']
        
        # Decode key from base64
        import base64
        decoded_key = base64.b64decode(key).decode('utf-8')
        
        # Decode value based on type
        if value['type'] == 1:  # uint
            state[decoded_key] = value['uint']
        elif value['type'] == 2:  # bytes
            try:
                state[decoded_key] = base64.b64decode(value['bytes']).decode('utf-8')
            except:
                state[decoded_key] = base64.b64decode(value['bytes']).hex()
    
    return state

print("=" * 80)
print("🔍 CHECKING SMART CONTRACT STATE")
print("=" * 80)
print(f"\n📱 App ID: {APP_ID}")
print(f"🌐 Network: Algorand TestNet")
print(f"🔗 Explorer: https://testnet.algoexplorer.io/application/{APP_ID}")
print("\n" + "=" * 80)

try:
    app_info = algod_client.application_info(APP_ID)
    
    if 'params' in app_info and 'global-state' in app_info['params']:
        global_state = app_info['params']['global-state']
        state = decode_state(global_state)
        
        print("📊 CURRENT BOUNTY STATE:")
        print("=" * 80)
        
        # Status mapping
        status_map = {
            0: "🟢 OPEN - Waiting for someone to accept",
            1: "🔵 ACCEPTED - Someone is working on it",
            2: "🟣 APPROVED - Work approved, ready to claim",
            3: "✅ CLAIMED - Payment sent to winner",
            4: "🔴 REFUNDED - Money returned to client"
        }
        
        if 'bounty_count' in state:
            bounty_count = state['bounty_count']
            if isinstance(bounty_count, str):
                bounty_count = int(bounty_count) if bounty_count.isdigit() else 0
            print(f"Total Bounties:     {bounty_count}")
        
        if 'status' in state:
            status_code = state['status']
            if isinstance(status_code, str):
                status_code = int(status_code) if status_code.isdigit() else -1
            print(f"Status:             {status_map.get(status_code, f'Unknown ({status_code})')}")
        
        if 'amount' in state:
            amount = state['amount']
            if isinstance(amount, str):
                amount = int(amount) if amount.isdigit() else 0
            amount_algo = amount / 1_000_000
            print(f"💰 Escrow Amount:    {amount_algo} ALGO")
        
        if 'client_addr' in state:
            print(f"👤 Client:           {state['client_addr']}")
        
        if 'verifier_addr' in state:
            print(f"✓ Verifier:          {state['verifier_addr']}")
        
        if 'freelancer_addr' in state:
            print(f"👨‍💻 Freelancer:       {state['freelancer_addr']}")
        
        if 'deadline' in state:
            from datetime import datetime
            deadline = state['deadline']
            if isinstance(deadline, str):
                deadline = int(deadline) if deadline.isdigit() else 0
            if deadline > 0:
                deadline_date = datetime.fromtimestamp(deadline)
                print(f"⏰ Deadline:         {deadline_date.strftime('%Y-%m-%d %H:%M:%S')}")
        
        if 'task_desc' in state:
            print(f"📝 Task:             {state['task_desc']}")
        
        print("=" * 80)
        
        # Show next actions based on status
        if 'status' in state:
            status_code = state['status']
            print("\n💡 NEXT ACTIONS YOU CAN TAKE:")
            if status_code == 0:
                print("   ➜ Anyone can ACCEPT this bounty")
                print("   ➜ You can REFUND if you want to cancel")
            elif status_code == 1:
                print("   ➜ Verifier can APPROVE the work")
                print("   ➜ Verifier can REFUND if work is rejected")
            elif status_code == 2:
                print("   ➜ Freelancer can CLAIM the payment")
            elif status_code == 3:
                print("   ✅ Bounty complete! Payment sent to freelancer")
            elif status_code == 4:
                print("   ✅ Bounty refunded! Money returned to client")
        
    else:
        print("⚠️  No bounty has been created yet")
        print("Create one using the frontend at http://localhost:3000")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nMake sure:")
    print("1. App ID is correct in frontend/.env")
    print("2. You're connected to the internet")

print("\n" + "=" * 80)


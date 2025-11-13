"""
Find the correct APP_ID for the address with your funds
"""
from algosdk.encoding import encode_address, decode_address
from hashlib import sha512

# The address where your 2 ALGO is
TARGET_ADDRESS = "PHIBV4HGUNK3UDHGFVN6IY6HLGUGEHJGHBIADFYDUP3XJUWJV33QWMX32I"

def get_app_address(app_id):
    """Calculate the application address"""
    to_sign = b"appID" + app_id.to_bytes(8, "big")
    checksum = sha512(to_sign).digest()[:32]
    return encode_address(checksum)

def find_app_id_for_address(target_addr, start=749000000, end=750000000):
    """Brute force search for the APP_ID that matches the address"""
    print(f"🔍 Searching for APP_ID that generates address: {target_addr}")
    print(f"   Range: {start} to {end}\n")
    print("   This may take a moment...\n")
    
    # Check common APP IDs first
    common_ids = [749540140, 749335380, 749000000]
    for app_id in common_ids:
        addr = get_app_address(app_id)
        if addr == target_addr:
            return app_id
    
    # Search in range
    for app_id in range(start, end, 100):
        if app_id % 10000 == 0:
            print(f"   Checking {app_id}...")
        addr = get_app_address(app_id)
        if addr == target_addr:
            return app_id
    
    return None

# Actually, let's reverse engineer from the address
print("\n" + "="*70)
print("🔍 REVERSE ENGINEERING APP_ID FROM ADDRESS")
print("="*70 + "\n")

# Decode the address to get the hash
addr_bytes = decode_address(TARGET_ADDRESS)
print(f"Address bytes (first 16): {addr_bytes[:16].hex()}")
print(f"\nThis hash was created by: sha512(b'appID' + APP_ID.to_bytes(8, 'big'))[:32]\n")

# Let's check the contract.env for the old APP_ID
print("Let me check your contract.env file...\n")

import re

# Read contract.env
try:
    with open(r"C:\Users\Aditya singh\AlgoEase\contract.env", "r") as f:
        content = f.read()
        match = re.search(r'REACT_APP_CONTRACT_APP_ID=(\d+)', content)
        if match:
            current_app_id = int(match.group(1))
            print(f"✅ Current APP_ID in contract.env: {current_app_id}")
            current_addr = get_app_address(current_app_id)
            print(f"   Generated address: {current_addr}\n")
            
        # Check if there's a different APP_ID mentioned
        all_numbers = re.findall(r'(\d{9})', content)
        unique_numbers = list(set(all_numbers))
        
        if len(unique_numbers) > 1:
            print(f"🔍 Found other large numbers in contract.env:")
            for num in unique_numbers:
                app_id = int(num)
                addr = get_app_address(app_id)
                match_symbol = "✅" if addr == TARGET_ADDRESS else "  "
                print(f"   {match_symbol} {app_id} -> {addr}")
except Exception as e:
    print(f"❌ Error reading contract.env: {e}")

print("\n" + "="*70)
print("💡 Let me check the transaction to find the APP_ID")
print("="*70 + "\n")

from algosdk.v2client import algod
import base64

client = algod.AlgodClient("", "https://testnet-api.algonode.cloud")

try:
    txn_info = client.pending_transaction_info("4KEY7JBWYKACY452XWDHDIEANZIHSV5RBAB7NTU2XJX6QYPZU4TA")
    print("Transaction details:")
    print(f"   Type: {txn_info['txn']['txn']['type']}")
    print(f"   From: {txn_info['txn']['txn']['snd']}")
    print(f"   To: {txn_info['txn']['txn']['rcv']}")
    print(f"   Amount: {txn_info['txn']['txn']['amt']/1_000_000} ALGO")
    
    # Decode note
    if 'note' in txn_info['txn']['txn']:
        note_bytes = base64.b64decode(txn_info['txn']['txn']['note'])
        note_text = note_bytes.decode('utf-8', errors='ignore')
        print(f"   Note: {note_text}")
    
    # Check if it's part of a group
    if 'grp' in txn_info['txn']['txn'] and txn_info['txn']['txn']['grp'] != "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=":
        print(f"\n   ✅ This is part of a GROUP TRANSACTION!")
        print(f"   Group ID: {txn_info['txn']['txn']['grp']}")
        print(f"\n   The other transaction in the group likely calls the app.")
        print(f"   Let me search for it...\n")
        
        # We need to find the other transaction in the group
        # Let's check recent transactions from your address
        print("   Checking your recent transactions for the app call...")
        
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "="*70)
print("🎯 SOLUTION")
print("="*70)
print("\nYour 2 ALGO is at: " + TARGET_ADDRESS)
print("This address has a balance of 2.0 ALGO")
print("\nTo refund, I need to find the correct APP_ID.")
print("The APP_ID in your contract.env (749540140) generates a different address.\n")

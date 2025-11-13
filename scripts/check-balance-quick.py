from algosdk.v2client import algod

client = algod.AlgodClient('', 'https://testnet-api.algonode.cloud')
addr = '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI'
acc = client.account_info(addr)

balance = acc['amount'] / 1_000_000
min_balance = acc['min-balance'] / 1_000_000
available = balance - min_balance
assets = len(acc.get('assets', []))

print(f"\n💰 Account Balance Information:")
print(f"   Total Balance: {balance} ALGO")
print(f"   Min Balance Required: {min_balance} ALGO")
print(f"   Available to Spend: {available} ALGO")
print(f"   Number of Assets: {assets}")

if available < 0.2:
    print(f"\n⚠️  WARNING: Low available balance!")
    print(f"   You need at least 0.2 ALGO available for transactions")
    print(f"   Current available: {available} ALGO")
    print(f"\n💡 Get testnet ALGO from: https://bank.testnet.algorand.network/")

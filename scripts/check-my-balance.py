from algosdk.v2client import algod
client = algod.AlgodClient('', 'https://testnet-api.algonode.cloud')
addr = '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI'
info = client.account_info(addr)
print(f'Your balance: {info["amount"] / 1_000_000} ALGO')

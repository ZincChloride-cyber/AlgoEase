import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

// Simple ERC20 Token ABI (for token transfers)
const TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
]

function App() {
  const [account, setAccount] = useState('')
  const [balance, setBalance] = useState('0')
  const [chainId, setChainId] = useState('')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState(null)

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(provider)
    }
  }, [])

  const connectWallet = async () => {
    try {
      setError('')
      if (!window.ethereum) {
        setError('Please install MetaMask to use this dApp')
        return
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      setAccount(accounts[0])

      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      setChainId(network.chainId.toString())

      const balance = await provider.getBalance(accounts[0])
      setBalance(ethers.formatEther(balance))

    } catch (err) {
      setError(err.message)
    }
  }

  const sendTransaction = async () => {
    try {
      setError('')
      setTxHash('')
      setLoading(true)

      if (!provider) {
        throw new Error('Provider not initialized')
      }

      const signer = await provider.getSigner()
      
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount)
      })

      setTxHash(tx.hash)
      
      await tx.wait()
      
      // Update balance
      const newBalance = await provider.getBalance(account)
      setBalance(ethers.formatEther(newBalance))

      setRecipient('')
      setAmount('')
      
    } catch (err) {
      setError(err.message || 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  const switchToCustomChain = async () => {
    try {
      // Example: Switch to PolyOne custom chain
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x' + (123456).toString(16), // Example chain ID
          chainName: 'PolyOne Custom Chain',
          nativeCurrency: {
            name: 'POLY',
            symbol: 'POLY',
            decimals: 18
          },
          rpcUrls: ['https://rpc-custom.polyone.io'],
          blockExplorerUrls: ['https://explorer-custom.polyone.io']
        }]
      })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">🧩 PolyOne Sample dApp</h1>
        <p className="subtitle">
          Connect your wallet and send transactions on your custom chain
        </p>
      </div>

      {!account ? (
        <div>
          <button onClick={connectWallet} className="button">
            Connect Wallet
          </button>
          <button onClick={switchToCustomChain} className="button secondary">
            Add Custom Chain to MetaMask
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <label className="label">Connected Account</label>
            <div className="value">{account}</div>
          </div>

          <div className="card">
            <label className="label">Chain ID</label>
            <div className="value">{chainId}</div>
          </div>

          <div className="card">
            <label className="label">Balance</label>
            <div className="balance">{parseFloat(balance).toFixed(4)} ETH</div>
          </div>

          <div className="grid">
            <div className="stat-card">
              <div className="stat-value">Active</div>
              <div className="stat-label">Network Status</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">~2s</div>
              <div className="stat-label">Block Time</div>
            </div>
          </div>

          <div className="input-group">
            <label className="label">Recipient Address</label>
            <input
              type="text"
              className="input"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="label">Amount (ETH)</label>
            <input
              type="number"
              className="input"
              placeholder="0.1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <button
            onClick={sendTransaction}
            disabled={loading || !recipient || !amount}
            className="button"
          >
            {loading ? 'Sending...' : 'Send Transaction'}
          </button>

          {txHash && (
            <div className="status success">
              ✅ Transaction sent!
              <div className="tx-hash">
                Tx Hash: {txHash}
              </div>
            </div>
          )}

          {error && (
            <div className="status error">
              ❌ {error}
            </div>
          )}

          <button
            onClick={() => {
              setAccount('')
              setBalance('0')
              setChainId('')
            }}
            className="button secondary"
          >
            Disconnect
          </button>
        </>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
        <p>Powered by PolyOne | Built on Polygon CDK</p>
      </div>
    </div>
  )
}

export default App


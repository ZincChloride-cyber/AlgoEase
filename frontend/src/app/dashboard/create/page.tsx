'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, Info, ExternalLink, Network, Cpu, Layers, Zap } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { useWallet } from '@/hooks/useWallet'
import { ethers } from 'ethers'
import { PRIMARY_CHAIN_ID, polygonMainnet } from '@/lib/chains'

const CHAIN_FACTORY_ABI = [
  "function createChain(string _name, string _chainType, string _rollupType, string _gasToken, uint256 _validators, string _rpcUrl, string _explorerUrl) external returns (uint256)",
  "function getChain(uint256 _chainId) external view returns (tuple(uint256 id, address owner, string name, string chainType, string rollupType, string gasToken, uint256 validators, uint256 createdAt, bool isActive, string rpcUrl, string explorerUrl))",
  "function getUserChains(address _user) external view returns (uint256[])",
  "function getTotalChains() external view returns (uint256)",
  "event ChainCreated(uint256 indexed chainId, address indexed owner, string name, string chainType, string rollupType)"
]

export default function CreateChainPage() {
  const router = useRouter()
  const { address, isConnected, chainId, switchNetwork, getProvider } = useWallet()
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [polygonScanUrl, setPolygonScanUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    chainType: 'public',
    rollupType: 'zk-rollup',
    gasToken: '',
    validatorAccess: 'public',
    initialValidators: '3'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Check if user is on Polygon network
  const isPolygonNetwork = chainId === polygonMainnet.id || chainId === PRIMARY_CHAIN_ID // Polygon Mainnet or Amoy Testnet
  const getPolygonScanUrl = (txHash: string) => {
    if (chainId === polygonMainnet.id) {
      return `https://polygonscan.com/tx/${txHash}`
    } else if (chainId === PRIMARY_CHAIN_ID) {
      return `https://amoy.polygonscan.com/tx/${txHash}`
    }
    return null
  }

  // Check if contract is configured
  const contractAddress = process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
  const isContractConfigured = contractAddress && contractAddress.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validate form data
    if (!formData.name || !formData.gasToken) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate validators count
    const validatorsCount = parseInt(formData.initialValidators)
    if (isNaN(validatorsCount) || validatorsCount < 1) {
      toast.error('Initial validators must be a number greater than 0')
      return
    }

    // Check if contract address is configured (REQUIRED for on-chain registration)
    if (!isContractConfigured) {
      toast.error(
        'Chain Factory contract not configured. Please deploy the contract and set NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS in frontend/.env.local. See DEPLOYMENT_GUIDE.md for instructions.',
        {
          duration: 8000,
          style: {
            background: '#ef4444',
            color: 'white',
          },
        }
      )
      setLoading(false)
      return
    }

    // Ensure user is on Polygon network
    let currentChainId = chainId
    if (!isPolygonNetwork) {
      try {
        toast.loading('Switching to Polygon Amoy Testnet...', { id: 'network-switch' })
        await switchNetwork(PRIMARY_CHAIN_ID)
        currentChainId = PRIMARY_CHAIN_ID
        toast.success('Switched to Polygon Amoy Testnet!', { id: 'network-switch' })
      } catch (networkError: any) {
        const message = networkError?.message || 'Unknown error'
        toast.error(`Failed to switch network: ${message}`, { id: 'network-switch' })
        return
      }
    }

    setLoading(true)
    setTxHash(null)
    setPolygonScanUrl(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

      // Step 1: Create chain on blockchain first (REQUIRED)
      const eip1193Provider = await getProvider()
      const provider = new ethers.BrowserProvider(eip1193Provider)
      const signer = await provider.getSigner()
      
      // Validate contract address format
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid contract address. Please check NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS in your environment variables.')
      }

      // Check if contract is deployed by checking code at address
      const code = await provider.getCode(contractAddress)
      if (code === '0x' || code === '0x0') {
        throw new Error('No contract found at the specified address. Please ensure the ChainFactory contract is deployed.')
      }
      console.log('Contract code found at address:', contractAddress)

      // Test contract connection by calling a view function
      const contract = new ethers.Contract(contractAddress, CHAIN_FACTORY_ABI, provider)
      try {
        const totalChains = await contract.getTotalChains()
        console.log('Contract connection test successful. Total chains:', totalChains.toString())
      } catch (testError: any) {
        console.warn('Contract connection test failed:', testError)
        // Don't throw, just log - the contract might still work for write operations
      }

      // Create contract with signer for write operations
      const contractWithSigner = new ethers.Contract(contractAddress, CHAIN_FACTORY_ABI, signer)

      // Generate temporary URLs (will be updated after backend deployment)
      const tempChainId = `temp-${Date.now()}`
      const tempRpcUrl = `https://rpc-${tempChainId.substring(0, 8)}.polyone.io`
      const tempExplorerUrl = `https://explorer-${tempChainId.substring(0, 8)}.polyone.io`

      toast.loading('📝 Creating chain on Polygon blockchain...', { id: 'blockchain-tx' })
      
      // Check balance first
      const balance = await provider.getBalance(await signer.getAddress())
      if (balance === 0n) {
        throw new Error('Insufficient balance. Please add POL/MATIC to your wallet.')
      }

      // Prepare transaction parameters
      const txParams = {
        name: formData.name,
        chainType: formData.chainType,
        rollupType: formData.rollupType,
        gasToken: formData.gasToken.toUpperCase(),
        validators: parseInt(formData.initialValidators),
        rpcUrl: tempRpcUrl,
        explorerUrl: tempExplorerUrl
      }

      console.log('Transaction parameters:', txParams)
      console.log('Contract address:', contractAddress)
      console.log('Signer address:', await signer.getAddress())

      // First, try to populate the transaction to validate it
      let populatedTx
      try {
        toast.loading('⏳ Preparing transaction...', { id: 'blockchain-tx' })
        populatedTx = await contractWithSigner.createChain.populateTransaction(
          txParams.name,
          txParams.chainType,
          txParams.rollupType,
          txParams.gasToken,
          txParams.validators,
          txParams.rpcUrl,
          txParams.explorerUrl
        )
        console.log('Populated transaction:', populatedTx)
      } catch (populateError: any) {
        console.error('Transaction populate error:', populateError)
        throw new Error(`Failed to prepare transaction: ${populateError.message || populateError.reason || 'Unknown error'}`)
      }

      // Estimate gas with populated transaction
      let gasEstimate: bigint
      try {
        toast.loading('⏳ Estimating gas...', { id: 'blockchain-tx' })
        gasEstimate = await provider.estimateGas(populatedTx)
        console.log('Gas estimate:', gasEstimate.toString())
        // Add 30% buffer to gas estimate for safety
        gasEstimate = (gasEstimate * 130n) / 100n
      } catch (gasError: any) {
        console.error('Gas estimation error:', gasError)
        console.error('Error details:', {
          code: gasError.code,
          message: gasError.message,
          reason: gasError.reason,
          data: gasError.data,
          error: gasError.error
        })
        
        let gasErrorMessage = 'Gas estimation failed. '
        
        // Try to decode revert reason
        if (gasError.reason) {
          gasErrorMessage += `Reason: ${gasError.reason}`
        } else if (gasError.data) {
          try {
            // Try to decode error data
            const errorData = typeof gasError.data === 'string' ? gasError.data : JSON.stringify(gasError.data)
            gasErrorMessage += `Error: ${errorData}`
          } catch (e) {
            gasErrorMessage += 'Unable to decode error. The transaction would likely revert.'
          }
        } else if (gasError.message) {
          gasErrorMessage += gasError.message
        } else {
          gasErrorMessage += 'The transaction would likely fail. Please check your inputs and try again.'
        }
        
        throw new Error(gasErrorMessage)
      }

      // Get fee data & detect EIP-1559 support
      const [feeData, latestBlock] = await Promise.all([
        provider.getFeeData(),
        provider.getBlock('latest')
      ])
      const supportsEip1559 = latestBlock?.baseFeePerGas !== null && latestBlock?.baseFeePerGas !== undefined
      console.log('Fee data:', {
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        supportsEip1559
      })

      // Send transaction - try simpler approach first
      let tx
      let legacyGasPrice: bigint | null = null
      try {
        toast.loading('📤 Sending transaction...', { id: 'blockchain-tx' })
        
        // Use populateTransaction and sendTransaction for more control
        populatedTx.gasLimit = gasEstimate

        if (supportsEip1559 && feeData.maxFeePerGas) {
          // Ensure type 2 (EIP-1559) transaction
          populatedTx.type = 2
          populatedTx.maxFeePerGas = feeData.maxFeePerGas
          populatedTx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? feeData.maxFeePerGas / 2n
          delete populatedTx.gasPrice
        } else {
          // Force legacy transaction params
          populatedTx.type = 0
          legacyGasPrice = feeData.gasPrice ?? await provider.getGasPrice()
          populatedTx.gasPrice = legacyGasPrice
          delete populatedTx.maxFeePerGas
          delete populatedTx.maxPriorityFeePerGas
        }

        const txRequest: any = {
          to: populatedTx.to,
          data: populatedTx.data,
          gasLimit: populatedTx.gasLimit,
          value: populatedTx.value ?? 0
        }

        if (supportsEip1559 && feeData.maxFeePerGas) {
          txRequest.type = 2
          txRequest.maxFeePerGas = populatedTx.maxFeePerGas
          txRequest.maxPriorityFeePerGas = populatedTx.maxPriorityFeePerGas
        } else {
          txRequest.type = 0
          txRequest.gasPrice = legacyGasPrice ?? feeData.gasPrice ?? await provider.getGasPrice()
        }

        console.log('Sending transaction with params:', {
          to: txRequest.to,
          data: txRequest.data?.slice(0, 20) + '...',
          gasLimit: txRequest.gasLimit?.toString(),
          type: txRequest.type,
          maxFeePerGas: txRequest.maxFeePerGas?.toString(),
          gasPrice: txRequest.gasPrice?.toString()
        })

        // Try sending using signer.sendTransaction first
        tx = await signer.sendTransaction(txRequest)
        console.log('Transaction sent:', tx.hash)
      } catch (txError: any) {
        console.error('Transaction send error:', txError)
        console.error('Error details:', {
          code: txError.code,
          message: txError.message,
          reason: txError.reason,
          data: txError.data,
          error: txError.error,
          action: txError.action,
          transaction: txError.transaction
        })
        
        const eip1559Rejected =
          txError?.code === -32602 ||
          txError?.error?.code === -32602 ||
          txError?.message?.toLowerCase()?.includes('does not support eip-1559') ||
          txError?.error?.message?.toLowerCase()?.includes('does not support eip-1559')

        if (eip1559Rejected) {
          try {
            console.warn('RPC rejected EIP-1559 tx; retrying as legacy type-0 transaction')
            const legacyGas = legacyGasPrice ?? feeData.gasPrice ?? (await provider.getGasPrice())
            const legacyTx = {
              to: populatedTx.to,
              data: populatedTx.data,
              gasLimit: populatedTx.gasLimit,
              gasPrice: legacyGas,
              type: 0,
              value: populatedTx.value ?? 0
            }
            tx = await signer.sendTransaction(legacyTx)
            console.log('Legacy transaction sent:', tx.hash)
          } catch (legacyError) {
            console.error('Legacy retry failed:', legacyError)
          }
        }

        // Try fallback method if direct sendTransaction failed
        if (!tx && (txError.code === -32603 || txError.error?.code === -32603)) {
          console.log('Attempting fallback method (contract method call)...')
          try {
            // Fallback: use contract method directly (let ethers handle everything)
            const txOverrides: any = {
              gasLimit: gasEstimate
            }
            if (!supportsEip1559) {
              txOverrides.gasPrice = legacyGasPrice ?? feeData.gasPrice ?? await provider.getGasPrice()
            } else if (eip1559Rejected) {
              txOverrides.gasPrice = legacyGasPrice ?? feeData.gasPrice ?? await provider.getGasPrice()
              txOverrides.type = 0
            }

            tx = await contractWithSigner.createChain(
              txParams.name,
              txParams.chainType,
              txParams.rollupType,
              txParams.gasToken,
              txParams.validators,
              txParams.rpcUrl,
              txParams.explorerUrl,
              txOverrides
            )
            console.log('Transaction sent via fallback method:', tx.hash)
          } catch (fallbackError: any) {
            console.error('Fallback method also failed:', fallbackError)
            // Continue with original error handling
          }
        }
        
        // If we still don't have a transaction, throw error
        if (!tx) {
          let txErrorMessage = 'Failed to send transaction. '
          
          // Handle different error types
          if (txError.code === -32603 || txError.error?.code === -32603) {
            const rpcError = txError.error || txError
            if (rpcError.data) {
              // Try to decode the error data
              try {
                const errorData = typeof rpcError.data === 'string' ? rpcError.data : JSON.stringify(rpcError.data)
                txErrorMessage += `RPC Error: ${errorData}`
              } catch (e) {
                txErrorMessage += 'Internal JSON-RPC error. Check console for details.'
              }
            } else if (rpcError.message) {
              txErrorMessage += rpcError.message
            } else {
              txErrorMessage += 'Internal JSON-RPC error. This might be due to:\n- Network connectivity issues\n- RPC endpoint problems\n- Contract execution failure\n\nPlease check your network connection and try again.'
            }
          } else if (txError.code === 4001) {
            txErrorMessage = 'Transaction rejected by user'
          } else if (txError.reason) {
            txErrorMessage += txError.reason
          } else if (txError.message) {
            txErrorMessage += txError.message
          } else {
            txErrorMessage += 'Unknown error occurred. Please check the console for details and try again.'
          }
          
          // Log full error for debugging
          console.error('Full error object:', JSON.stringify(txError, Object.getOwnPropertyNames(txError), 2))
          
          throw new Error(txErrorMessage)
        }
      }

      const txHashValue = tx.hash
      setTxHash(txHashValue)
      // Use currentChainId instead of chainId for the scan URL
      const scanUrl = currentChainId === polygonMainnet.id 
        ? `https://polygonscan.com/tx/${txHashValue}`
        : currentChainId === PRIMARY_CHAIN_ID
        ? `https://amoy.polygonscan.com/tx/${txHashValue}`
        : null
      setPolygonScanUrl(scanUrl)

      toast.loading('⏳ Waiting for transaction confirmation...', { id: 'blockchain-tx' })
      
      const receipt = await tx.wait()
      
      toast.success('✅ Chain registered on Polygon blockchain!', { 
        id: 'blockchain-tx',
        duration: 3000
      })

      // Step 2: Call backend API to create chain infrastructure (optional)
      // Backend is only needed for infrastructure deployment, not for on-chain registration
      let chainData: any = null
      
      try {
        toast.loading('🚀 Starting chain deployment...', { id: 'backend-deploy' })

        // Check backend connectivity first
        try {
          const healthCheck = await axios.get(`${apiUrl}/health`, {
            timeout: 5000
          })
          console.log('Backend health check:', healthCheck.data)
        } catch (healthError: any) {
          console.warn('Backend not available, continuing with on-chain registration only')
          throw new Error('BACKEND_NOT_AVAILABLE')
        }

        // Call backend API to create chain
        const response = await axios.post(
          `${apiUrl}/api/chains/create`,
          {
            name: formData.name,
            chainType: formData.chainType,
            rollupType: formData.rollupType,
            gasToken: formData.gasToken,
            validatorAccess: formData.validatorAccess,
            initialValidators: formData.initialValidators,
            blockchainTxHash: txHashValue,
            blockchainChainId: currentChainId,
            walletAddress: address
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        )

        chainData = {
          ...response.data.chain,
          id: response.data.chainId,
          owner: address,
          createdAt: new Date().toISOString(),
          blockchainTxHash: txHashValue,
          polygonScanUrl: scanUrl,
          onChainRegistered: true
        }

        toast.success('✅ Chain deployment started!', { 
          id: 'backend-deploy',
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white',
          },
        })
      } catch (backendError: any) {
        // Backend is optional - chain is already registered on-chain
        if (backendError.message === 'BACKEND_NOT_AVAILABLE' || 
            backendError.code === 'ECONNREFUSED' || 
            backendError.message?.includes('Network Error')) {
          
          // Create chain data from on-chain registration only
          chainData = {
            id: `chain-${Date.now()}`,
            name: formData.name,
            chainType: formData.chainType,
            rollupType: formData.rollupType,
            gasToken: formData.gasToken,
            owner: address,
            status: 'on-chain-registered',
            createdAt: new Date().toISOString(),
            blockchainTxHash: txHashValue,
            polygonScanUrl: scanUrl,
            blockchainChainId: currentChainId,
            onChainRegistered: true,
            initialValidators: formData.initialValidators,
            note: 'Chain registered on blockchain. Backend infrastructure deployment skipped (backend server not available).'
          }

          toast.success('✅ Chain registered on blockchain!', { 
            id: 'backend-deploy',
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
            },
          })
          
          toast('ℹ️ Backend server not available. Chain is registered on-chain but infrastructure deployment skipped.', {
            duration: 8000,
            style: {
              background: '#3b82f6',
              color: 'white',
            },
          })
        } else {
          // Other backend errors
          console.error('Backend error:', backendError)
          toast('⚠️ Chain registered on blockchain, but backend deployment failed.', {
            id: 'backend-deploy',
            duration: 5000,
            style: {
              background: '#f59e0b',
              color: 'white',
            },
          })
          
          // Still create chain data
          chainData = {
            id: `chain-${Date.now()}`,
            name: formData.name,
            chainType: formData.chainType,
            rollupType: formData.rollupType,
            gasToken: formData.gasToken,
            owner: address,
            status: 'on-chain-registered',
            createdAt: new Date().toISOString(),
            blockchainTxHash: txHashValue,
            polygonScanUrl: scanUrl,
            blockchainChainId: currentChainId,
            onChainRegistered: true,
            initialValidators: formData.initialValidators
          }
        }
      }

      // Save to localStorage for frontend display
      if (chainData) {
        const existingChains = JSON.parse(localStorage.getItem('userChains') || '[]')
        existingChains.push(chainData)
        localStorage.setItem('userChains', JSON.stringify(existingChains))
      }

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Error creating chain:', error)
      
      // Provide specific error messages
      let errorMessage = 'Failed to create chain'
      
      // Handle JSON-RPC errors
      if (error.code === -32603 || error.error?.code === -32603) {
        const rpcError = error.error || error
        if (rpcError.message?.includes('execution reverted')) {
          errorMessage = 'Transaction would revert. Please check your inputs and ensure the contract is properly configured.'
        } else if (rpcError.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient POL/MATIC balance. Please add funds to your wallet.'
        } else {
          errorMessage = `Transaction failed: ${rpcError.message || 'Internal JSON-RPC error. Please try again or check your network connection.'}`
        }
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = `Cannot connect to backend server. Please ensure the backend server is running at ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}`
      } else if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user'
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient POL/MATIC balance. Please add funds to your wallet.'
      } else if (error.message?.includes('Transaction would fail')) {
        errorMessage = error.message
      } else if (error.reason) {
        errorMessage = `Transaction failed: ${error.reason}`
      } else if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid request. Please check your input.'
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else {
          errorMessage = error.response.data?.message || `Server error (${error.response.status})`
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: 'white',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden">
          <motion.div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage:
                'radial-gradient(120% 120% at 15% -20%, rgba(168, 85, 247, 0.35) 0%, transparent 60%), radial-gradient(140% 140% at 85% 120%, rgba(236, 72, 153, 0.25) 0%, transparent 70%), radial-gradient(80% 80% at 50% 30%, rgba(79, 70, 229, 0.22) 0%, transparent 75%)'
            }}
            animate={{ opacity: [0.6, 0.85, 0.6] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 -z-10 opacity-50"
            animate={{ backgroundPosition: ['0% 0%', '120% 120%'] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, transparent 25%, transparent 75%, rgba(236, 72, 153, 0.12) 100%), linear-gradient(225deg, rgba(99, 102, 241, 0.1) 0%, transparent 45%, rgba(147, 51, 234, 0.08) 55%, transparent 100%)',
              backgroundSize: '200% 200%'
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center relative"
          >
            <div className="relative bg-gradient-to-br from-white/10 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-3xl p-12 border border-purple-500/30 shadow-[0_0_80px_rgba(124,58,237,0.45)] overflow-hidden">
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{ rotate: [0, 3, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, rgba(129, 140, 248, 0.2) 0%, transparent 45%, rgba(236, 72, 153, 0.2) 100%)'
                }}
              />
              <div className="relative z-10">
                <motion.div
                  className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center border border-purple-400/50 shadow-[0_0_40px_rgba(168,85,247,0.6)]"
                  animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Network className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                  Connect Wallet to Continue
                </h2>
                <p className="text-gray-300 mb-8">One click away from launching your custom Polygon chain.</p>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-indigo-600 font-semibold transition-all shadow-[0_12px_30px_rgba(124,58,237,0.35)]"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto relative">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(130% 130% at 10% 0%, rgba(168, 85, 247, 0.25) 0%, transparent 55%), radial-gradient(110% 110% at 90% 10%, rgba(236, 72, 153, 0.2) 0%, transparent 60%), radial-gradient(120% 120% at 50% 120%, rgba(79, 70, 229, 0.18) 0%, transparent 70%)'
            }}
            animate={{ opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 opacity-60"
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              backgroundImage:
                'linear-gradient(140deg, rgba(124, 58, 237, 0.15) 0%, transparent 35%, transparent 65%, rgba(236, 72, 153, 0.15) 100%), linear-gradient(220deg, rgba(99, 102, 241, 0.12) 0%, transparent 45%, rgba(147, 51, 234, 0.12) 55%, transparent 100%)',
              backgroundSize: '220% 220%'
            }}
          />
          <motion.div
            className="absolute -top-32 -left-24 w-96 h-96 bg-purple-500/25 rounded-full blur-3xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 right-0 w-[28rem] h-[28rem] bg-fuchsia-500/20 rounded-full blur-3xl"
            animate={{ scale: [1.05, 1.2, 1.05], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-purple-200/70 hover:text-purple-100 transition-colors font-mono group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group overflow-hidden"
        >
          <div className="relative bg-gradient-to-br from-white/10 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-[34px] p-10 border border-purple-500/25 hover:border-purple-500/50 transition-all shadow-[0_30px_80px_rgba(124,58,237,0.35)]">
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{ rotate: [0, 4, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                backgroundImage:
                  'linear-gradient(100deg, rgba(168, 85, 247, 0.3) 0%, transparent 45%, rgba(236, 72, 153, 0.3) 100%)'
              }}
            />
            <motion.div
              className="absolute -inset-px rounded-[34px] border border-purple-400/25 pointer-events-none"
              animate={{ opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="pointer-events-none absolute top-6 left-10 right-10 h-px rounded-full bg-gradient-to-r from-transparent via-purple-300/40 to-transparent"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="pointer-events-none absolute bottom-6 left-10 right-10 h-px rounded-full bg-gradient-to-r from-transparent via-fuchsia-300/40 to-transparent"
              animate={{ opacity: [0.2, 0.6, 0.2], scaleX: [0.8, 1, 0.8] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10">
              <div className="mb-10 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-[0_10px_30px_rgba(124,58,237,0.45)]"
                      animate={{ rotate: [0, -6, 6, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Rocket className="w-8 h-8" />
                      <motion.div
                        className="absolute inset-0 rounded-2xl border border-white/30"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </motion.div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                        Launch Your Polygon Chain
                      </h1>
                      <p className="text-sm md:text-base text-purple-100/70 mt-2">
                        Deploy validators, configure rollups, and mint your chain identity in minutes.
                      </p>
                    </div>
                  </div>
                  <motion.div
                    className="px-4 py-3 rounded-full border border-purple-500/30 text-xs uppercase tracking-[0.3em] text-purple-100/70"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    One click launchpad
                  </motion.div>
                </div>

                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {[ 
                    { icon: <Layers className="w-5 h-5" />, label: 'Rollup Ready' },
                    { icon: <Cpu className="w-5 h-5" />, label: 'Validator Templates' },
                    { icon: <Zap className="w-5 h-5" />, label: 'Gas Token Customizer' }
                  ].map((pill, index) => (
                    <motion.div
                      key={index}
                      className="flex-1 min-w-[140px] px-4 py-3 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-indigo-500/10 text-sm flex items-center gap-3 shadow-[0_15px_35px_rgba(124,58,237,0.2)]"
                      whileHover={{ y: -4, scale: 1.02 }}
                    >
                      <span className="text-purple-200/90">{pill.icon}</span>
                      <span className="text-purple-100/80 uppercase tracking-[0.2em] text-[11px]">{pill.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200/80">Chain Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              className="w-full bg-white/10 border border-purple-500/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30 transition-all text-white placeholder:text-purple-100/40"
                placeholder="My Awesome Chain"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200/80">Chain Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['public', 'private'].map((type) => (
                  <motion.button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, chainType: type })}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex-1 p-4 rounded-[26px] border transition-all overflow-hidden shadow-[0_16px_40px_rgba(124,58,237,0.18)] ${
                      formData.chainType === type
                        ? 'border-purple-400 bg-purple-500/20 shadow-[0_18px_38px_rgba(124,58,237,0.35)]'
                        : 'border-purple-400/30 hover:border-purple-400/60 bg-white/10'
                    }`}
                  >
                    {formData.chainType === type && (
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.4)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.4)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-20" />
                    )}
                    <div className="relative z-10">
                      <div className="font-semibold capitalize text-white">{type}</div>
                      <div className="text-sm text-purple-100/60">{type === 'public' ? 'Open to everyone' : 'Restricted access'}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200/80">Rollup Type *</label>
              <select
                name="rollupType"
                value={formData.rollupType}
                onChange={handleChange}
                className="w-full bg-white/10 border border-purple-500/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30 text-white appearance-none cursor-pointer transition-all"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23c084fc' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem',
                }}
              >
                <option value="zk-rollup" style={{ backgroundColor: '#1a1031', color: '#ffffff' }}>zkRollup (Recommended)</option>
                <option value="optimistic-rollup" style={{ backgroundColor: '#1a1031', color: '#ffffff' }}>Optimistic Rollup</option>
                <option value="validium" style={{ backgroundColor: '#1a1031', color: '#ffffff' }}>Validium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200/80">Gas Token Symbol *</label>
              <input
                type="text"
                name="gasToken"
                value={formData.gasToken}
                onChange={handleChange}
                className="w-full bg-white/10 border border-purple-500/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30 transition-all text-white placeholder:text-purple-100/40 uppercase"
                placeholder="e.g., GAME, PAY, COIN"
                maxLength={10}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-purple-200/80">Initial Validators *</label>
              <input
                type="number"
                name="initialValidators"
                value={formData.initialValidators}
                onChange={handleChange}
                className="w-full bg-white/10 border border-purple-500/30 rounded-2xl px-4 py-3 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-400/30 transition-all text-white placeholder:text-purple-100/40"
                min="1"
                max="100"
                required
              />
            </div>

            {!isContractConfigured && (
              <div className="relative bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef4444_0.5px,transparent_0.5px),linear-gradient(to_bottom,#ef4444_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10" />
                <Info className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 relative z-10" />
                <div className="relative z-10">
                  <h3 className="font-bold text-red-400 mb-1 font-mono">Chain Factory Contract Not Configured</h3>
                  <p className="text-sm text-gray-300 mb-2 font-mono">
                    To enable on-chain registration, you need to deploy the ChainFactory contract and configure it.
                  </p>
                  <p className="text-sm text-gray-400 font-mono">
                    <strong>Steps:</strong><br />
                    1. Deploy the contract: <code className="bg-slate-900/50 px-1 rounded border border-cyan-500/20">npm run deploy:amoy</code> (or <code className="bg-slate-900/50 px-1 rounded border border-cyan-500/20">npm run deploy:polygon</code> for mainnet)<br />
                    2. Copy the deployed contract address<br />
                    3. Add <code className="bg-slate-900/50 px-1 rounded border border-cyan-500/20">NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x...</code> to <code className="bg-slate-900/50 px-1 rounded border border-cyan-500/20">frontend/.env.local</code><br />
                    4. Restart your frontend server
                  </p>
                </div>
              </div>
            )}

            {!isPolygonNetwork && isConnected && isContractConfigured && (
              <div className="relative bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#eab308_0.5px,transparent_0.5px),linear-gradient(to_bottom,#eab308_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10" />
                <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5 relative z-10" />
                <div className="relative z-10">
                  <h3 className="font-bold text-yellow-400 mb-1 font-mono">Switch to Polygon Network</h3>
                  <p className="text-sm text-gray-300 font-mono">
                    You need to be on Polygon Mainnet or Polygon Amoy Testnet to launch your chain. 
                    The network will be switched automatically when you submit.
                  </p>
                </div>
              </div>
            )}

            {txHash && polygonScanUrl && (
              <div className="relative bg-purple-500/10 border border-purple-500/40 rounded-[28px] p-5 overflow-hidden shadow-[0_12px_30px_rgba(124,58,237,0.25)]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.35)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.35)_0.5px,transparent_0.5px)] bg-[size:18px_18px] opacity-15" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div 
                      className="w-2.5 h-2.5 bg-purple-300 rounded-full"
                      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <h3 className="font-semibold text-purple-100 uppercase tracking-[0.3em] text-[12px]">Transaction Submitted</h3>
                  </div>
                  <p className="text-sm text-purple-100/70 mb-3">
                    Your chain transaction is live on Polygon. Review the details on PolygonScan:
                  </p>
                  <a
                    href={polygonScanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-100 hover:text-white transition-colors text-sm font-medium border border-purple-500/40 px-4 py-2 rounded-full hover:bg-purple-500/20"
                  >
                    View on PolygonScan
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-xs text-purple-100/60 mt-3 break-all">
                    {txHash}
                  </p>
                </div>
              </div>
            )}

            <div className="relative bg-gradient-to-br from-white/10 via-purple-500/10 to-white/5 border border-purple-500/30 rounded-2xl p-6 overflow-hidden shadow-[0_12px_32px_rgba(124,58,237,0.25)]">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.3)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.3)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-semibold mb-4 text-purple-100 flex items-center gap-2 uppercase tracking-[0.3em] text-[12px]">
                  <Zap className="w-5 h-5" />
                  Estimated Costs
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-purple-100/80">
                    <span>Setup Fee</span>
                    <span className="font-semibold text-white">$499</span>
                  </div>
                  <div className="flex justify-between text-purple-100/80">
                    <span>Monthly Hosting</span>
                    <span className="font-semibold text-white">$299/mo</span>
                  </div>
                  <div className="border-t border-purple-500/30 pt-3 mt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-purple-200">Total</span>
                      <span className="text-purple-100">$798</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="flex-1 py-3 text-center rounded-full border border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-500/10 transition-all"
              >
                Cancel
              </Link>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="relative flex-1 py-3 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-indigo-600 font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 overflow-hidden group shadow-[0_15px_35px_rgba(124,58,237,0.35)]"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      Launch Chain
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </form>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

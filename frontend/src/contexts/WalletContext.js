import React, { createContext, useContext, useState, useEffect } from 'react';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import LuteConnect from 'lute-connect';
import { PeraWalletConnect } from '@perawallet/connect';
import contractUtils from '../utils/contractUtils';

const WalletContext = createContext();

// Initialize wallet connections outside component to avoid re-initialization
const luteWallet = new LuteConnect('AlgoEase');
const peraWallet = new PeraWalletConnect({
  chainId: 416002, // TestNet chain ID (416001 for MainNet)
});

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [contractState, setContractState] = useState(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'pera' or 'lute'

  // Algorand TestNet configuration
  const algodClient = new algosdk.Algodv2(
    '',
    'https://testnet-api.algonode.cloud',
    ''
  );

  // Check for reconnection on mount
  useEffect(() => {
    // Check if Pera Wallet was previously connected
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          setWalletType('pera');
          console.log('Pera Wallet reconnected:', accounts[0]);
        }
      })
      .catch((error) => {
        console.log('Pera Wallet not previously connected');
      });
  }, []);

  const connectWallet = async (walletId = 'pera') => {
    try {
      setIsConnecting(true);
      console.log('Connecting to wallet:', walletId);
      
      if (walletId === 'pera') {
        console.log('Initializing Pera Wallet connection...');
        // Connect to Pera Wallet
        const accounts = await peraWallet.connect();
        console.log('Pera Wallet returned accounts:', accounts);
        
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          setWalletType('pera');
          console.log('✅ Pera Wallet connected successfully:', accounts[0]);
          
          // Listen for disconnect events
          peraWallet.connector?.on('disconnect', () => {
            console.log('Pera Wallet disconnected');
            disconnectWallet();
          });
          
          return;
        }
      } else if (walletId === 'lute') {
        console.log('Initializing Lute Wallet connection...');
        // Connect to Lute Wallet using lute-connect
        const genesis = await algodClient.genesis().do();
        const genesisID = `${genesis.network}-${genesis.id}`;
        const addresses = await luteWallet.connect(genesisID);
        
        if (addresses && addresses.length > 0) {
          setAccount(addresses[0]);
          setIsConnected(true);
          setWalletType('lute');
          console.log('✅ Lute Wallet connected successfully:', addresses[0]);
          return;
        }
      }
      
      throw new Error('Failed to connect wallet. Please try again.');
      
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      
      // User-friendly error messages
      if (error.message && error.message.includes('rejected')) {
        alert('Connection was cancelled. Please try again.');
      } else {
        alert('Failed to connect wallet: ' + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };


  const disconnectWallet = async () => {
    try {
      if (walletType === 'pera') {
        await peraWallet.disconnect();
      }
      // Lute wallet doesn't require explicit disconnect
      
      setAccount(null);
      setIsConnected(false);
      setWalletType(null);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const signTransaction = async (txn) => {
    try {
      if (!isConnected) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }
      
      if (walletType === 'pera') {
        // Sign transaction using Pera Wallet
        const txnGroup = [{ txn, signers: [account] }];
        const signedTxns = await peraWallet.signTransaction([txnGroup]);
        
        if (signedTxns && signedTxns.length > 0) {
          return signedTxns[0];
        } else {
          throw new Error('Failed to sign transaction with Pera Wallet.');
        }
      } else if (walletType === 'lute') {
        // Convert transaction to base64 format for Lute wallet
        const txnBytes = algosdk.encodeUnsignedTransaction(txn);
        const txnBase64 = btoa(String.fromCharCode(...txnBytes));
        
        // Sign transaction using Lute wallet
        const signedTxns = await luteWallet.signTxns([{ txn: txnBase64 }]);
        
        if (signedTxns && signedTxns.length > 0) {
          return signedTxns[0];
        } else {
          throw new Error('Failed to sign transaction with Lute wallet.');
        }
      }
      
      throw new Error('Unknown wallet type.');
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      
      // Provide user-friendly error messages
      if (error.message && error.message.includes('User Rejected Request')) {
        throw new Error('Transaction signing was cancelled by user.');
      } else if (error.message && error.message.includes('rejected')) {
        throw new Error('Transaction signing was cancelled by user.');
      } else if (error.message && error.message.includes('SignTxnsError')) {
        throw new Error('Failed to sign transaction. Please check your wallet connection.');
      } else {
        throw error;
      }
    }
  };

  const signTransactionGroup = async (txns) => {
    try {
      if (!isConnected) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }
      
      console.log('Signing transaction group with', txns.length, 'transactions');
      
      if (walletType === 'pera') {
        // Sign transaction group using Pera Wallet
        // Pera Wallet expects an array of transaction groups
        const txnsToSign = txns.map((txn) => {
          return { txn: txn, signers: [account] };
        });
        
        console.log('Sending to Pera Wallet for signing...');
        const signedTxns = await peraWallet.signTransaction([txnsToSign]);
        
        if (signedTxns && signedTxns.length > 0) {
          console.log('Successfully signed', signedTxns.length, 'transactions');
          return signedTxns;
        } else {
          throw new Error('Failed to sign transaction group with Pera Wallet.');
        }
      } else if (walletType === 'lute') {
        // Convert all transactions to base64 format for Lute wallet
        const txnGroup = txns.map(txn => {
          const txnBytes = algosdk.encodeUnsignedTransaction(txn);
          const txnBase64 = btoa(String.fromCharCode(...txnBytes));
          return { txn: txnBase64 };
        });
        
        // Sign transaction group using Lute wallet
        const signedTxns = await luteWallet.signTxns(txnGroup);
        
        if (signedTxns && signedTxns.length > 0) {
          return signedTxns;
        } else {
          throw new Error('Failed to sign transaction group with Lute wallet.');
        }
      }
      
      throw new Error('Unknown wallet type.');
    } catch (error) {
      console.error('Failed to sign transaction group:', error);
      
      // Provide user-friendly error messages
      if (error.message && error.message.includes('User Rejected Request')) {
        throw new Error('Transaction signing was cancelled by user.');
      } else if (error.message && error.message.includes('rejected')) {
        throw new Error('Transaction signing was cancelled by user.');
      } else if (error.message && error.message.includes('SignTxnsError')) {
        throw new Error('Failed to sign transaction. Please check your wallet connection.');
      } else {
        throw error;
      }
    }
  };

  const getAccountInfo = async () => {
    if (!account) return null;
    
    try {
      const accountInfo = await algodClient.accountInformation(account).do();
      return accountInfo;
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  };

  // Smart contract functions
  const loadContractState = async () => {
    if (!contractUtils.getAppId()) {
      console.warn('Contract app ID not set');
      return null;
    }

    try {
      setIsLoadingContract(true);
      const state = await contractUtils.getCurrentBounty();
      setContractState(state);
      return state;
    } catch (error) {
      console.error('Failed to load contract state:', error);
      setContractState(null);
      return null;
    } finally {
      setIsLoadingContract(false);
    }
  };

  const createBounty = async (amount, deadline, taskDescription, verifierAddress) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txns = await contractUtils.createBounty(
        account,
        amount,
        deadline,
        taskDescription,
        verifierAddress
      );

      // Sign transaction group
      const signedTxns = await signTransactionGroup(txns);

      // Submit transaction group
      const txId = await contractUtils.submitTransactionGroup(signedTxns);
      
      // Wait for confirmation
      await contractUtils.waitForConfirmation(txId);
      
      // Reload contract state
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to create bounty:', error);
      
      // Provide user-friendly error messages
      if (error.message && error.message.includes('User Rejected Request')) {
        throw new Error('Transaction was cancelled. Please try again and approve the transaction in your wallet.');
      } else if (error.message && error.message.includes('SignTxnsError')) {
        throw new Error('Failed to sign transaction. Please check your wallet connection and try again.');
      } else {
        throw error;
      }
    }
  };

  const acceptBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.acceptBounty(account);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to accept bounty:', error);
      throw error;
    }
  };

  const approveBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.approveBounty(account);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to approve bounty:', error);
      throw error;
    }
  };

  const claimBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.claimBounty(account);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to claim bounty:', error);
      throw error;
    }
  };

  const refundBounty = async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txn = await contractUtils.refundBounty(account);
      const signedTxn = await signTransaction(txn);
      const txId = await contractUtils.submitTransaction(signedTxn);
      
      await contractUtils.waitForConfirmation(txId);
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to refund bounty:', error);
      throw error;
    }
  };

  const canPerformAction = (action) => {
    if (!account || !contractState) return false;
    return contractUtils.canPerformAction(account, action, contractState);
  };

  const value = {
    account,
    isConnected,
    isConnecting,
    walletType,
    connectWallet,
    disconnectWallet,
    signTransaction,
    signTransactionGroup,
    getAccountInfo,
    algodClient,
    // Smart contract functions
    contractState,
    isLoadingContract,
    loadContractState,
    createBounty,
    acceptBounty,
    approveBounty,
    claimBounty,
    refundBounty,
    canPerformAction
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

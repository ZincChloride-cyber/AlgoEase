import React, { createContext, useContext, useState } from 'react';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import contractUtils from '../utils/contractUtils';

const WalletContext = createContext();

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

  // Algorand TestNet configuration
  const algodClient = new algosdk.Algodv2(
    '',
    'https://testnet-api.algonode.cloud',
    ''
  );

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Try Pera Wallet first
      if (window.algorand && window.algorand.pera) {
        const accounts = await window.algorand.pera.connect();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          console.log('Pera Wallet connected:', accounts[0]);
          return;
        }
      }
      
      // Try AlgoSigner as fallback
      if (window.AlgoSigner) {
        const accounts = await window.AlgoSigner.connect();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          console.log('AlgoSigner connected:', accounts[0]);
          return;
        }
      }
      
      // If no wallet is available, show error
      throw new Error('No Algorand wallet found. Please install Pera Wallet or AlgoSigner.');
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };


  const disconnectWallet = async () => {
    try {
      setAccount(null);
      setIsConnected(false);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const signTransaction = async (txn) => {
    try {
      if (window.algorand && window.algorand.pera) {
        // Pera Wallet signing
        const signedTxn = await window.algorand.pera.signTransaction(txn);
        return signedTxn;
      } else if (window.AlgoSigner) {
        // AlgoSigner signing
        const signedTxn = await window.AlgoSigner.signTxn(txn);
        return signedTxn;
      } else {
        throw new Error('No wallet available for signing. Please connect a wallet first.');
      }
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
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

      // Sign transactions
      const signedTxns = [];
      for (const txn of txns) {
        const signedTxn = await signTransaction(txn);
        signedTxns.push(signedTxn);
      }

      // Submit transaction group
      const txId = await contractUtils.submitTransactionGroup(signedTxns);
      
      // Wait for confirmation
      await contractUtils.waitForConfirmation(txId);
      
      // Reload contract state
      await loadContractState();
      
      return txId;
    } catch (error) {
      console.error('Failed to create bounty:', error);
      throw error;
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
    connectWallet,
    disconnectWallet,
    signTransaction,
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

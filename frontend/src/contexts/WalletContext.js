import React, { createContext, useContext, useState } from 'react';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';
import LuteConnect from 'lute-connect';
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

  // Initialize Lute wallet connection
  const luteWallet = new LuteConnect('AlgoEase');

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Connect to Lute Wallet using lute-connect
      const genesis = await algodClient.genesis().do();
      const genesisID = `${genesis.network}-${genesis.id}`;
      const addresses = await luteWallet.connect(genesisID);
      
      if (addresses && addresses.length > 0) {
        setAccount(addresses[0]);
        setIsConnected(true);
        console.log('Lute Wallet connected:', addresses[0]);
        return;
      }
      
      // If no wallet is available, show error
      throw new Error('No Lute wallet found. Please install Lute Wallet.');
      
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
      if (!luteWallet) {
        throw new Error('No Lute wallet available for signing. Please connect Lute wallet first.');
      }
      
      // Convert transaction to base64 format for Lute wallet
      const txnBytes = algosdk.encodeUnsignedTransaction(txn);
      const txnBase64 = btoa(String.fromCharCode(...txnBytes));
      
      // Sign transaction using Lute wallet
      const signedTxns = await luteWallet.signTxns([{ txn: txnBase64 }]);
      
      if (signedTxns && signedTxns.length > 0) {
        // Decode the signed transaction
        const decodedTxn = algosdk.decodeSignedTransaction(signedTxns[0]);
        return decodedTxn;
      } else {
        throw new Error('Failed to sign transaction with Lute wallet.');
      }
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      
      // Provide user-friendly error messages
      if (error.message && error.message.includes('User Rejected Request')) {
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
      if (!luteWallet) {
        throw new Error('No Lute wallet available for signing. Please connect Lute wallet first.');
      }
      
      // Convert all transactions to base64 format for Lute wallet
      const txnGroup = txns.map(txn => {
        const txnBytes = algosdk.encodeUnsignedTransaction(txn);
        const txnBase64 = btoa(String.fromCharCode(...txnBytes));
        return { txn: txnBase64 };
      });
      
      console.log('Signing transaction group with', txnGroup.length, 'transactions');
      
      // Sign transaction group using Lute wallet
      const signedTxns = await luteWallet.signTxns(txnGroup);
      
      if (signedTxns && signedTxns.length > 0) {
        // Return the signed transactions in their original format from Lute wallet
        // They are already in the correct format for submission
        return signedTxns;
      } else {
        throw new Error('Failed to sign transaction group with Lute wallet.');
      }
    } catch (error) {
      console.error('Failed to sign transaction group:', error);
      
      // Provide user-friendly error messages
      if (error.message && error.message.includes('User Rejected Request')) {
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

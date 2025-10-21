import React, { createContext, useContext, useState } from 'react';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';

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

  // Algorand TestNet configuration
  const algodClient = new algosdk.Algodv2(
    '',
    'https://testnet-api.algonode.cloud',
    ''
  );

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // For now, we'll use a simple mock connection
      // In production, this would connect to Pera Wallet, WalletConnect, or AlgoSigner
      const mockAccount = {
        address: 'TEST1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF'
      };
      
      setAccount(mockAccount.address);
      setIsConnected(true);
      
      console.log('Mock wallet connected:', mockAccount.address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectPeraWallet = async () => {
    try {
      // Check if Pera Wallet is available
      if (window.algorand && window.algorand.pera) {
        const accounts = await window.algorand.pera.connect();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      } else {
        // Fallback to AlgoSigner
        if (window.AlgoSigner) {
          const accounts = await window.AlgoSigner.connect();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to connect to Pera Wallet:', error);
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
        return await window.algorand.pera.signTransaction(txn);
      } else if (window.AlgoSigner) {
        // AlgoSigner signing
        return await window.AlgoSigner.signTxn(txn);
      } else {
        // Mock signing for development
        console.log('Mock transaction signing:', txn);
        return txn;
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

  const value = {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    signTransaction,
    getAccountInfo,
    algodClient
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import WalletInstallGuide from './WalletInstallGuide';

const WalletConnection = () => {
  const { 
    account, 
    isConnected, 
    isConnecting, 
    connectWallet, 
    disconnectWallet,
    getAccountInfo 
  } = useWallet();
  
  const [availableWallets, setAvailableWallets] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Check for available wallets
  useEffect(() => {
    const checkWallets = () => {
      if (window.AlgoEaseWallets && window.AlgoEaseWallets.available) {
        setAvailableWallets(window.AlgoEaseWallets.available);
      } else {
        // Fallback to direct detection
        const wallets = [];
        
        if (window.algorand && window.algorand.pera) {
          wallets.push({
            name: 'Pera Wallet',
            id: 'pera',
            icon: '🔗',
            description: 'Official Algorand wallet'
          });
        }
        
        if (window.AlgoSigner) {
          wallets.push({
            name: 'AlgoSigner',
            id: 'algosigner',
            icon: '🔐',
            description: 'Browser extension wallet'
          });
        }
        
        setAvailableWallets(wallets);
      }
    };
    
    checkWallets();
    
    // Check periodically for wallet changes
    const interval = setInterval(checkWallets, 2000);
    return () => clearInterval(interval);
  }, []);

  // Load account info when connected
  useEffect(() => {
    if (isConnected && account) {
      loadAccountInfo();
    }
  }, [isConnected, account]);

  const loadAccountInfo = async () => {
    try {
      const info = await getAccountInfo();
      setAccountInfo(info);
    } catch (error) {
      console.error('Failed to load account info:', error);
    }
  };

  const handleConnectWallet = async () => {
    if (availableWallets.length === 0) {
      setShowInstallGuide(true);
      return;
    }
    
    if (availableWallets.length === 1) {
      // Only one wallet available, connect directly
      await connectWallet();
    } else {
      // Multiple wallets available, show options
      setShowWalletOptions(true);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setAccountInfo(null);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance) return '0';
    return (balance / 1000000).toFixed(2); // Convert from microALGO to ALGO
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {formatAddress(account)}
          </div>
          {accountInfo && (
            <div className="text-xs text-gray-500">
              {formatBalance(accountInfo.amount)} ALGO
            </div>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          className="btn-outline text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (showWalletOptions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Choose Wallet</h3>
          <div className="space-y-3">
            {availableWallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={async () => {
                  setShowWalletOptions(false);
                  await connectWallet();
                }}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <div className="font-medium">{wallet.name}</div>
                    <div className="text-sm text-gray-500">{wallet.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowWalletOptions(false)}
            className="mt-4 w-full btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-4">
        {availableWallets.length === 0 ? (
          <button
            onClick={() => setShowInstallGuide(true)}
            className="btn-primary"
          >
            Install Wallet
          </button>
        ) : (
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="btn-primary"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
      
      {showInstallGuide && (
        <WalletInstallGuide onClose={() => setShowInstallGuide(false)} />
      )}
    </>
  );
};

export default WalletConnection;

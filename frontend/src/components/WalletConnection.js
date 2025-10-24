import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import WalletInstallGuide from './WalletInstallGuide';

const WalletConnection = () => {
  const { 
    account, 
    isConnected, 
    isConnecting,
    walletType, 
    connectWallet, 
    disconnectWallet,
    getAccountInfo 
  } = useWallet();
  
  const [availableWallets, setAvailableWallets] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Define available wallets
  useEffect(() => {
    const wallets = [
      {
        name: 'Pera Wallet',
        id: 'pera',
        icon: '🟢',
        description: 'Official Algorand mobile wallet',
        link: 'https://perawallet.app/'
      },
      {
        name: 'Lute Wallet',
        id: 'lute',
        icon: '🎵',
        description: 'Browser extension wallet',
        link: 'https://lute.app/'
      }
    ];
    
    setAvailableWallets(wallets);
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

  const handleConnectWallet = async (walletId) => {
    if (walletId) {
      // Connect to specific wallet
      await connectWallet(walletId);
      setShowWalletOptions(false);
    } else {
      // Show wallet options
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
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {walletType === 'pera' ? '🟢 Pera' : '🎵 Lute'}
            </span>
            <div className="text-sm font-medium text-gray-900">
              {formatAddress(account)}
            </div>
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
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose your preferred wallet to connect
          </p>
          <div className="space-y-3">
            {availableWallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnectWallet(wallet.id)}
                disabled={isConnecting}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{wallet.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{wallet.name}</div>
                      <div className="text-sm text-gray-500">{wallet.description}</div>
                    </div>
                  </div>
                  <svg 
                    className="w-6 h-6 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">
              Don't have a wallet?
            </p>
            <div className="space-y-1">
              {availableWallets.map((wallet) => (
                <a
                  key={wallet.id}
                  href={wallet.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 block"
                >
                  Get {wallet.name} →
                </a>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setShowWalletOptions(false)}
            className="mt-4 w-full btn-outline"
            disabled={isConnecting}
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
        <button
          onClick={() => handleConnectWallet()}
          disabled={isConnecting}
          className="btn-primary"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
      
      {showInstallGuide && (
        <WalletInstallGuide onClose={() => setShowInstallGuide(false)} />
      )}
    </>
  );
};

export default WalletConnection;

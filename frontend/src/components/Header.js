import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const Header = () => {
  const { account, isConnected, connectWallet, disconnectWallet, isConnecting } = useWallet();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AE</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AlgoEase</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                to="/bounties" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Browse Bounties
              </Link>
              <Link 
                to="/create" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Create Bounty
              </Link>
              <Link 
                to="/my-bounties" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                My Bounties
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Connected:</span>
                  <span className="ml-1 font-mono">{formatAddress(account)}</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="btn-outline text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

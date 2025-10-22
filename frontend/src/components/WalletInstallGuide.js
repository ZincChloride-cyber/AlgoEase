import React, { useState } from 'react';

const WalletInstallGuide = ({ onClose }) => {
  const [selectedWallet, setSelectedWallet] = useState(null);

  const wallets = [
    {
      name: 'Pera Wallet',
      description: 'Official Algorand wallet for mobile and web',
      icon: '🔗',
      links: {
        mobile: 'https://perawallet.app/',
        web: 'https://perawallet.app/',
        chrome: 'https://chrome.google.com/webstore/detail/pera-wallet/'
      },
      features: ['Mobile & Web', 'Official Algorand', 'NFT Support', 'DeFi Integration']
    },
    {
      name: 'AlgoSigner',
      description: 'Browser extension for Algorand transactions',
      icon: '🔐',
      links: {
        chrome: 'https://chrome.google.com/webstore/detail/algosigner/',
        firefox: 'https://addons.mozilla.org/en-US/firefox/addon/algosigner/',
        github: 'https://github.com/PureStake/algosigner'
      },
      features: ['Browser Extension', 'Developer Friendly', 'Transaction Signing', 'Account Management']
    }
  ];

  const handleInstall = (wallet) => {
    if (wallet.links.chrome) {
      window.open(wallet.links.chrome, '_blank');
    } else if (wallet.links.mobile) {
      window.open(wallet.links.mobile, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Install Algorand Wallet</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            To use AlgoEase, you need an Algorand wallet to sign transactions and manage your account.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3">ℹ️</div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Why do I need a wallet?</h4>
                <p className="text-blue-800 text-sm">
                  AlgoEase uses smart contracts on the Algorand blockchain. A wallet is required to:
                </p>
                <ul className="text-blue-800 text-sm mt-2 list-disc list-inside">
                  <li>Sign transactions securely</li>
                  <li>Manage your ALGO balance</li>
                  <li>Interact with smart contracts</li>
                  <li>Maintain control of your funds</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {wallets.map((wallet) => (
            <div key={wallet.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{wallet.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{wallet.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {wallet.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {wallet.links.chrome && (
                    <button
                      onClick={() => handleInstall(wallet)}
                      className="btn-primary text-sm"
                    >
                      Install
                    </button>
                  )}
                  {wallet.links.mobile && (
                    <button
                      onClick={() => window.open(wallet.links.mobile, '_blank')}
                      className="btn-outline text-sm"
                    >
                      Mobile
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              After installing, refresh the page to connect your wallet.
            </div>
            <button
              onClick={onClose}
              className="btn-outline"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInstallGuide;

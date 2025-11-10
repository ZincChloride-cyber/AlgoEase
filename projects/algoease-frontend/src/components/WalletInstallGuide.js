import React, { useState } from 'react';

const WalletInstallGuide = ({ onClose }) => {
  const [selectedWallet, setSelectedWallet] = useState(null);

  const wallets = [
    {
      name: 'Pera Wallet',
      description: 'Official Algorand mobile wallet with full DeFi support',
      icon: '🟢',
      links: {
        ios: 'https://apps.apple.com/us/app/pera-algo-wallet/id1459898525',
        android: 'https://play.google.com/store/apps/details?id=com.algorand.android',
        website: 'https://perawallet.app/'
      },
      features: ['Mobile App', 'WalletConnect', 'DeFi Support', 'NFT Gallery', 'Most Popular']
    },
    {
      name: 'Lute Wallet',
      description: 'Secure and user-friendly Algorand browser wallet',
      icon: '🎵',
      links: {
        chrome: 'https://chrome.google.com/webstore/detail/lute-wallet/',
        firefox: 'https://addons.mozilla.org/en-US/firefox/addon/lute-wallet/',
        website: 'https://lute.app/'
      },
      features: ['Browser Extension', 'Secure Storage', 'Transaction Signing', 'Easy to Use']
    }
  ];

  const handleInstall = (wallet, platform = 'default') => {
    if (platform === 'ios' && wallet.links.ios) {
      window.open(wallet.links.ios, '_blank');
    } else if (platform === 'android' && wallet.links.android) {
      window.open(wallet.links.android, '_blank');
    } else if (wallet.links.chrome) {
      window.open(wallet.links.chrome, '_blank');
    } else if (wallet.links.website) {
      window.open(wallet.links.website, '_blank');
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
                <div className="flex flex-col space-y-2">
                  {wallet.links.chrome && (
                    <button
                      onClick={() => handleInstall(wallet)}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      Install Extension
                    </button>
                  )}
                  {wallet.links.ios && (
                    <button
                      onClick={() => handleInstall(wallet, 'ios')}
                      className="btn-outline text-sm whitespace-nowrap"
                    >
                      iOS App
                    </button>
                  )}
                  {wallet.links.android && (
                    <button
                      onClick={() => handleInstall(wallet, 'android')}
                      className="btn-outline text-sm whitespace-nowrap"
                    >
                      Android App
                    </button>
                  )}
                  {wallet.links.website && !wallet.links.chrome && !wallet.links.ios && (
                    <button
                      onClick={() => handleInstall(wallet)}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      Visit Website
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

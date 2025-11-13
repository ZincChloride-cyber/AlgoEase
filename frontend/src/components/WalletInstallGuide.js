import React, { useState } from 'react';

const wallets = [
  {
    name: 'Pera Wallet',
    description: 'Official Algorand wallet with WalletConnect support and advanced DeFi tooling.',
    badge: 'Recommended',
    icon: 'PW',
    accent: 'from-emerald-400 to-emerald-500',
    links: {
      ios: 'https://apps.apple.com/us/app/pera-algo-wallet/id1459898525',
      android: 'https://play.google.com/store/apps/details?id=com.algorand.android',
      website: 'https://perawallet.app/',
    },
    features: ['Mobile app', 'WalletConnect', 'DeFi ready', 'NFT support'],
  },
];

const WalletInstallGuide = ({ onClose }) => {
  const [selectedWallet, setSelectedWallet] = useState(wallets[0]);

  const handleInstall = (wallet, platform) => {
    const { links } = wallet;
    if (platform === 'ios' && links.ios) window.open(links.ios, '_blank');
    else if (platform === 'android' && links.android) window.open(links.android, '_blank');
    else if (platform === 'chrome' && links.chrome) window.open(links.chrome, '_blank');
    else if (platform === 'firefox' && links.firefox) window.open(links.firefox, '_blank');
    else if (links.website) window.open(links.website, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-base-900/80 px-4 py-10 backdrop-blur-2xl">
      <div className="glass-card glow-border max-w-4xl overflow-hidden p-0 md:grid md:grid-cols-[1.05fr,0.95fr]">
        <div className="border-b border-white/10 p-8 md:border-b-0 md:border-r">
          <div className="flex items-start justify-between">
            <div>
              <span className="chip">Wallet setup</span>
              <h2 className="mt-4 text-2xl font-semibold text-white">Connect an Algorand wallet</h2>
              <p className="mt-2 text-sm text-white/60">
                Choose a wallet to authenticate with AlgoEase, sign escrow transactions, and manage funds securely.
              </p>
            </div>
            <button type="button" onClick={onClose} className="btn-ghost h-10 w-10 rounded-2xl px-0">
              ✕
            </button>
          </div>
          <div className="glass-panel mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/65">
            <p className="text-xs uppercase tracking-[0.32em] text-white/40">Why you need a wallet</p>
            <ul className="mt-4 space-y-2">
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                Sign bounty lifecycle transactions securely.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                Manage ALGO balances and escrow deposits.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                Maintain full control of your funds and approvals.
              </li>
            </ul>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-4">
            {wallets.map((wallet) => {
              const isActive = selectedWallet?.name === wallet.name;
              return (
                <button
                  key={wallet.name}
                  type="button"
                  onClick={() => setSelectedWallet(wallet)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-white/25 bg-white/10 shadow-glow'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${wallet.accent} text-base-900 font-semibold`}
                      >
                        {wallet.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-semibold text-white">{wallet.name}</h3>
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                            {wallet.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-white/60">{wallet.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {wallet.features.map((feature) => (
                            <span
                              key={feature}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/55"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <svg className="h-5 w-5 text-secondary-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedWallet && (
            <div className="glass-panel mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/65">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Install options</p>
              <div className="flex flex-wrap gap-2">
                {selectedWallet.links.chrome && (
                  <button className="btn-primary text-xs" onClick={() => handleInstall(selectedWallet, 'chrome')}>
                    Install Chrome extension
                  </button>
                )}
                {selectedWallet.links.firefox && (
                  <button className="btn-secondary text-xs" onClick={() => handleInstall(selectedWallet, 'firefox')}>
                    Firefox add-on
                  </button>
                )}
                {selectedWallet.links.ios && (
                  <button className="btn-outline text-xs" onClick={() => handleInstall(selectedWallet, 'ios')}>
                    iOS App Store
                  </button>
                )}
                {selectedWallet.links.android && (
                  <button className="btn-outline text-xs" onClick={() => handleInstall(selectedWallet, 'android')}>
                    Android Play Store
                  </button>
                )}
                <button className="btn-ghost text-xs uppercase tracking-[0.32em]" onClick={() => handleInstall(selectedWallet)}>
                  Open website
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-xs text-white/45">
            <span>After installing, refresh AlgoEase and connect your wallet.</span>
            <button type="button" className="btn-outline text-xs" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletInstallGuide;


import React, { useEffect, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import WalletInstallGuide from './WalletInstallGuide';

const WalletConnection = () => {
  const {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    getAccountInfo,
  } = useWallet();

  const [accountInfo, setAccountInfo] = useState(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      loadAccountInfo();
      <div className="flex items-center gap-3">
        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="btn-primary whitespace-nowrap text-sm"
        >
          {isConnecting ? 'Connecting…' : 'Connect Pera Wallet'}
        </button>
        <button
          onClick={() => setShowInstallGuide(true)}
          className="btn-ghost text-xs uppercase tracking-[0.32em] text-white/60"
        >
          Install guide
        </button>
      </div>
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    await connectWallet();
    setShowWalletOptions(false);
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
    return (balance / 1000000).toFixed(2);
  };

  if (isConnected && account) {
    return (
      <div className="glass-panel flex items-center gap-4 rounded-2xl px-4 py-2 shadow-inner-glow">
        <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-secondary-400 to-primary-600 text-sm font-semibold text-white/90 shadow-glow md:flex">
          PW
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11px] uppercase tracking-[0.32em] text-white/40">
            Pera Wallet
          </span>
          <span className="text-sm font-semibold text-white">
            {formatAddress(account)}
          </span>
          {accountInfo && (
            <span className="text-xs text-white/60">
              {formatBalance(accountInfo.amount)} ALGO
            </span>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          className="btn-outline text-xs"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={handleConnectWallet}
          disabled={isConnecting}
          className="btn-primary whitespace-nowrap text-sm"
        >
          {isConnecting ? 'Connecting…' : 'Connect Pera Wallet'}
        </button>
        <button
          onClick={() => setShowInstallGuide(true)}
          className="btn-ghost text-xs uppercase tracking-[0.32em] text-white/60"
        >
          Install guide
        </button>
      </div>

      {showInstallGuide && (
        <WalletInstallGuide onClose={() => setShowInstallGuide(false)} />
      )}
    </>
  );
};

export default WalletConnection;

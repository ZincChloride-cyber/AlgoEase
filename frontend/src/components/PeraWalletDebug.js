import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const PeraWalletDebug = () => {
  const { account, isConnected } = useWallet();
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    setTestResult(null);

    const results = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    // Check 1: Wallet Connection
    results.checks.push({
      name: 'Wallet Connection',
      status: isConnected ? 'PASS' : 'FAIL',
      details: isConnected ? `Connected: ${account}` : 'No wallet connected'
    });

    // Check 2: Pera Wallet Installed
    const hasPeraWallet = typeof window !== 'undefined' && window.PeraWalletConnect;
    results.checks.push({
      name: 'Pera Wallet SDK',
      status: hasPeraWallet ? 'PASS' : 'FAIL',
      details: hasPeraWallet ? 'SDK loaded successfully' : 'SDK not found'
    });

    // Check 3: Browser Environment
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    results.checks.push({
      name: 'Device Type',
      status: 'INFO',
      details: isMobile ? 'Mobile device detected' : 'Desktop browser detected'
    });

    // Check 4: Deep Link Support
    if (!isMobile) {
      results.checks.push({
        name: 'Deep Link Warning',
        status: 'WARN',
        details: 'Desktop detected - Pera Wallet deep links may not work. Use Pera Wallet web or browser extension.'
      });
    }

    // Check 5: Local Storage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      results.checks.push({
        name: 'LocalStorage',
        status: 'PASS',
        details: 'LocalStorage is working'
      });
    } catch (e) {
      results.checks.push({
        name: 'LocalStorage',
        status: 'FAIL',
        details: 'LocalStorage blocked or unavailable'
      });
    }

    // Check 6: WalletConnect Session
    try {
      const wcData = localStorage.getItem('walletconnect');
      if (wcData) {
        results.checks.push({
          name: 'WalletConnect Session',
          status: 'INFO',
          details: 'Session data found in localStorage'
        });
      } else {
        results.checks.push({
          name: 'WalletConnect Session',
          status: 'INFO',
          details: 'No saved session'
        });
      }
    } catch (e) {
      results.checks.push({
        name: 'WalletConnect Session',
        status: 'WARN',
        details: 'Cannot access session data'
      });
    }

    // Check 7: Network
    try {
      const response = await fetch('https://testnet-api.algonode.cloud/health');
      results.checks.push({
        name: 'Algorand TestNet',
        status: response.ok ? 'PASS' : 'FAIL',
        details: response.ok ? 'TestNet API is accessible' : 'Cannot reach TestNet API'
      });
    } catch (e) {
      results.checks.push({
        name: 'Algorand TestNet',
        status: 'FAIL',
        details: `Network error: ${e.message}`
      });
    }

    setTestResult(results);
    setTesting(false);
  };

  const clearWalletSession = () => {
    try {
      // Clear all wallet-related data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('wallet') || key.includes('wc') || key.includes('pera')) {
          localStorage.removeItem(key);
        }
      });
      alert('Wallet session cleared! Please reconnect your wallet.');
      window.location.reload();
    } catch (e) {
      alert(`Error clearing session: ${e.message}`);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🔧 Wallet Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="btn-primary text-xs px-4 py-2"
        >
          {testing ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {testResult && (
        <div className="space-y-2 text-sm">
          {testResult.checks.map((check, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                check.status === 'PASS'
                  ? 'bg-green-500/10 border-green-500/40'
                  : check.status === 'FAIL'
                  ? 'bg-red-500/10 border-red-500/40'
                  : 'bg-yellow-500/10 border-yellow-500/40'
              }`}
            >
              <span className="text-lg">
                {check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️'}
              </span>
              <div className="flex-1">
                <div className="font-semibold text-white">{check.name}</div>
                <div className="text-white/60 text-xs mt-1">{check.details}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={clearWalletSession}
          className="w-full btn-outline text-xs py-2"
        >
          Clear Wallet Session & Reconnect
        </button>
        
        <div className="text-xs text-white/40 text-center">
          If transactions aren't showing, try clearing the session
        </div>
      </div>

      <div className="rounded-xl bg-white/5 p-4 text-xs text-white/60 space-y-2">
        <div className="font-semibold text-white">Common Issues:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Desktop: Use Pera Wallet web (web.perawallet.app)</li>
          <li>Mobile: Make sure Pera Wallet app is installed</li>
          <li>Browser: Allow popups for this site</li>
          <li>Network: Check your internet connection</li>
        </ul>
      </div>
    </div>
  );
};

export default PeraWalletDebug;

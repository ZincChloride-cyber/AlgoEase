// Wallet Detection Script
// This script detects available Algorand wallets and provides global access

(function() {
  'use strict';
  
  // Wallet detection state
  window.AlgoEaseWallets = {
    pera: false,
    algosigner: false,
    available: []
  };
  
  // Check for Pera Wallet
  function checkPeraWallet() {
    if (window.algorand && window.algorand.pera) {
      window.AlgoEaseWallets.pera = true;
      window.AlgoEaseWallets.available.push({
        name: 'Pera Wallet',
        id: 'pera',
        icon: '🔗',
        description: 'Official Algorand wallet',
        connect: () => window.algorand.pera.connect(),
        signTransaction: (txn) => window.algorand.pera.signTransaction(txn)
      });
    }
  }
  
  // Check for AlgoSigner
  function checkAlgoSigner() {
    if (window.AlgoSigner) {
      window.AlgoEaseWallets.algosigner = true;
      window.AlgoEaseWallets.available.push({
        name: 'AlgoSigner',
        id: 'algosigner',
        icon: '🔐',
        description: 'Browser extension wallet',
        connect: () => window.AlgoSigner.connect(),
        signTransaction: (txn) => window.AlgoSigner.signTxn(txn)
      });
    }
  }
  
  // Initialize wallet detection
  function initWalletDetection() {
    checkPeraWallet();
    checkAlgoSigner();
    
    // Log available wallets
    if (window.AlgoEaseWallets.available.length > 0) {
      console.log('✅ Algorand wallets detected:', window.AlgoEaseWallets.available.map(w => w.name).join(', '));
    } else {
      console.log('⚠️ No Algorand wallets detected. Please install Pera Wallet or AlgoSigner.');
    }
  }
  
  // Run detection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWalletDetection);
  } else {
    initWalletDetection();
  }
  
  // Re-check periodically for dynamically loaded wallets
  setInterval(() => {
    const previousCount = window.AlgoEaseWallets.available.length;
    window.AlgoEaseWallets.available = [];
    checkPeraWallet();
    checkAlgoSigner();
    
    if (window.AlgoEaseWallets.available.length !== previousCount) {
      console.log('🔄 Wallet availability changed');
    }
  }, 2000);
  
})();

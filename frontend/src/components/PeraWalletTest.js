import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import algosdk from 'algosdk/dist/browser/algosdk.min.js';

const PeraWalletTest = () => {
  const { account, isConnected, peraWallet } = useWallet();
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const testSimpleTransaction = async () => {
    if (!isConnected || !account) {
      setTestResult({ success: false, message: 'Please connect your wallet first!' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing Pera Wallet transaction signing...');
      
      // Create algod client
      const algodClient = new algosdk.Algodv2(
        '',
        'https://testnet-api.algonode.cloud',
        ''
      );

      // Get suggested params
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Create a simple test transaction (0 ALGO to yourself)
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: account,
        to: account,
        amount: 0,
        note: new Uint8Array(Buffer.from('AlgoEase: Test Transaction')),
        suggestedParams
      });

      console.log('📝 Created test transaction:', {
        from: account,
        to: account,
        amount: 0,
        type: txn.constructor.name
      });

      // Try to sign with Pera Wallet
      console.log('📤 Calling Pera Wallet to sign...');
      
      const signedTxn = await peraWallet.signTransaction([[{ txn }]]);

      console.log('✅ Transaction signed successfully!', signedTxn);

      setTestResult({
        success: true,
        message: 'SUCCESS! Pera Wallet is working correctly. ✅',
        details: 'Transaction was signed (not sent to blockchain - this was just a test)'
      });

    } catch (error) {
      console.error('❌ Test failed:', error);
      
      let errorMessage = error.message || error.toString();
      let troubleshooting = [];

      if (errorMessage.includes('User rejected')) {
        troubleshooting.push('You cancelled the transaction in Pera Wallet');
        troubleshooting.push('This is normal - try again and approve it');
      } else if (errorMessage.includes('4100')) {
        troubleshooting.push('Another transaction is pending');
        troubleshooting.push('Open Pera Wallet and complete or cancel pending transactions');
      } else if (errorMessage.includes('deep link') || errorMessage.includes('not supported')) {
        troubleshooting.push('Desktop detected - Pera Wallet deep links don\'t work well on desktop');
        troubleshooting.push('Solution 1: Use Pera Wallet Web - https://web.perawallet.app');
        troubleshooting.push('Solution 2: Test on mobile device');
        troubleshooting.push('Solution 3: Use WalletConnect with QR code');
      } else {
        troubleshooting.push('Unknown error occurred');
        troubleshooting.push('Check browser console for details (F12)');
      }

      setTestResult({
        success: false,
        message: `Error: ${errorMessage}`,
        troubleshooting
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🧪 Pera Wallet Test</h3>
        <button
          onClick={testSimpleTransaction}
          disabled={testing || !isConnected}
          className="btn-primary text-xs px-4 py-2"
        >
          {testing ? 'Testing...' : 'Test Signing'}
        </button>
      </div>

      {!isConnected && (
        <div className="text-sm text-yellow-200 bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-3">
          ⚠️ Please connect your wallet first
        </div>
      )}

      {testResult && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            testResult.success
              ? 'bg-green-500/10 border-green-500/40'
              : 'bg-red-500/10 border-red-500/40'
          }`}
        >
          <div className={`font-semibold ${testResult.success ? 'text-green-200' : 'text-red-200'}`}>
            {testResult.message}
          </div>
          
          {testResult.details && (
            <div className="mt-2 text-xs opacity-80">
              {testResult.details}
            </div>
          )}

          {testResult.troubleshooting && (
            <div className="mt-3 space-y-1">
              <div className="font-semibold">Troubleshooting:</div>
              {testResult.troubleshooting.map((tip, idx) => (
                <div key={idx} className="text-xs opacity-80">
                  • {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white/5 p-4 text-xs text-white/60 space-y-2">
        <div className="font-semibold text-white">What this test does:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Creates a simple 0 ALGO transaction to yourself</li>
          <li>Asks Pera Wallet to sign it</li>
          <li>Does NOT send it to blockchain (it's just a test)</li>
          <li>If this works, your bounty creation will work too!</li>
        </ul>
      </div>

      <div className="rounded-xl bg-blue-500/10 border border-blue-500/40 p-4 text-xs text-blue-200">
        <div className="font-semibold mb-2">💡 Common Issues:</div>
        <div className="space-y-1">
          <div>• <strong>Desktop:</strong> Pera Wallet deep links don't work - use web.perawallet.app</div>
          <div>• <strong>Mobile:</strong> Make sure Pera Wallet app is installed and updated</div>
          <div>• <strong>Browser:</strong> Allow popups and redirects for this site</div>
        </div>
      </div>
    </div>
  );
};

export default PeraWalletTest;

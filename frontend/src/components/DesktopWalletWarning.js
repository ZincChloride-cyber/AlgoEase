import React from 'react';

const DesktopWalletWarning = ({ onClose, onContinue }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🖥️</div>
            <div>
              <h2 className="text-xl font-bold text-white">Desktop Browser Detected</h2>
              <p className="text-sm text-gray-400">Pera Wallet deep links don't work on desktop</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-200 mb-1">Transaction signing will fail</h3>
                <p className="text-sm text-yellow-300/90">
                  Desktop browsers cannot open the Pera Wallet mobile app using deep links.
                  Your transaction request will hang indefinitely.
                </p>
              </div>
            </div>
          </div>

          {/* Solution Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span>✅</span> Solutions:
            </h3>

            {/* Option 1: Pera Wallet Web */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🌐</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-200 mb-2">Option 1: Use Pera Wallet Web (Recommended)</h4>
                  <ol className="text-sm text-blue-300/90 space-y-1 list-decimal list-inside">
                    <li>Open <a href="https://web.perawallet.app" target="_blank" rel="noopener noreferrer" className="underline font-semibold">web.perawallet.app</a> in a new tab</li>
                    <li>Connect your wallet there</li>
                    <li>Return to AlgoEase and try again</li>
                    <li>Transaction will appear in the web wallet</li>
                  </ol>
                  <a 
                    href="https://web.perawallet.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Open Pera Wallet Web →
                  </a>
                </div>
              </div>
            </div>

            {/* Option 2: Mobile Device */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📱</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-200 mb-2">Option 2: Use Mobile Device</h4>
                  <ol className="text-sm text-purple-300/90 space-y-1 list-decimal list-inside">
                    <li>Open AlgoEase on your phone/tablet</li>
                    <li>Make sure Pera Wallet app is installed</li>
                    <li>Create your bounty from mobile</li>
                    <li>App will open automatically for signing</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Option 3: WalletConnect QR */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📸</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-200 mb-2">Option 3: Try QR Code (May Not Work)</h4>
                  <p className="text-sm text-green-300/90">
                    You can try continuing - Pera Wallet might show a QR code that you can scan with the mobile app.
                    However, this is not reliable on all browsers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Info */}
          <details className="bg-white/5 rounded-xl p-4">
            <summary className="cursor-pointer text-sm font-semibold text-white/80 hover:text-white">
              🔍 Why doesn't this work?
            </summary>
            <div className="mt-3 text-xs text-white/60 space-y-2">
              <p>
                Desktop browsers cannot handle <code className="bg-white/10 px-1 rounded">algorand://</code> deep link protocols.
                These links are designed to open mobile apps, but desktop browsers don't have that capability.
              </p>
              <p>
                Pera Wallet Connect SDK tries to use WalletConnect v1 which relies on deep links for desktop,
                rather than QR codes or web-based signing. This is a known limitation.
              </p>
              <p className="font-semibold text-white/80">
                Solution: Use Pera Wallet Web, which is specifically designed for desktop browsers.
              </p>
            </div>
          </details>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
          >
            Cancel Transaction
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-colors"
          >
            Try Anyway (QR Code)
          </button>
        </div>

        {/* Recommendation Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
          💡 Use Pera Wallet Web
        </div>
      </div>
    </div>
  );
};

export default DesktopWalletWarning;

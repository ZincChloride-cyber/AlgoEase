import React, { useState } from 'react';

const WalletTroubleshoot = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const commonIssues = [
    {
      issue: 'Transaction Pending Error (4100)',
      icon: '⏳',
      solution: [
        'Open your Pera Wallet mobile app',
        'Look for any pending transaction requests in the notifications',
        'Either approve or reject the pending transaction',
        'Wait 5-10 seconds for the wallet to clear the state',
        'Try your transaction again on AlgoEase',
      ],
      prevention: 'Always complete or cancel wallet prompts. Don\'t let transactions timeout.',
    },
    {
      issue: 'Transaction Signing Cancelled',
      icon: '❌',
      solution: [
        'This happens when you cancel or timeout on the wallet prompt',
        'Simply try the transaction again',
        'Make sure to approve within the time limit (usually 2 minutes)',
      ],
      prevention: 'Review transaction details carefully before approving to avoid mistakes.',
    },
    {
      issue: 'Wallet Not Connecting',
      icon: '🔌',
      solution: [
        'Make sure you have the Pera Wallet mobile app installed',
        'Check that you\'re on the same network (WiFi) on both devices',
        'Try disconnecting and reconnecting your wallet',
        'Restart the Pera Wallet app if needed',
      ],
      prevention: 'Keep your Pera Wallet app updated to the latest version.',
    },
    {
      issue: 'Insufficient Balance',
      icon: '💰',
      solution: [
        'Check your ALGO balance in Pera Wallet',
        'Remember you need extra ALGO for transaction fees (~0.001-0.003 ALGO)',
        'Keep at least 0.1 ALGO as minimum balance requirement',
        'Get TestNet ALGO from the faucet if testing',
      ],
      prevention: 'Always maintain a buffer of 0.3-0.5 ALGO above your transaction amount.',
    },
  ];

  const troubleshootSteps = [
    {
      step: 1,
      title: 'Check Pera Wallet App',
      description: 'Open the Pera Wallet mobile app and ensure it\'s running properly',
      icon: '📱',
    },
    {
      step: 2,
      title: 'Clear Pending Transactions',
      description: 'Look for and clear any pending transaction requests',
      icon: '🔄',
    },
    {
      step: 3,
      title: 'Wait & Retry',
      description: 'Wait 10-15 seconds, then try your transaction again',
      icon: '⏱️',
    },
    {
      step: 4,
      title: 'Reconnect Wallet',
      description: 'If issues persist, disconnect and reconnect your wallet',
      icon: '🔗',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Collapsible Troubleshooting Section */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <div>
            <h3 className="text-sm font-semibold text-white">Having Transaction Issues?</h3>
            <p className="text-xs text-white/60">Click here for troubleshooting help</p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 transform text-white/60 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          {/* Quick Fix Steps */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
              Quick Fix Steps
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              {troubleshootSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-400 text-sm font-bold text-white">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-white">{item.title}</h5>
                      <p className="mt-1 text-xs text-white/60">{item.description}</p>
                    </div>
                    <span className="text-xl">{item.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Issues */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
              Common Issues & Solutions
            </h4>
            <div className="space-y-3">
              {commonIssues.map((item, index) => (
                <details
                  key={index}
                  className="group rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <summary className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-white">
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex-1">{item.issue}</span>
                    <svg
                      className="h-4 w-4 transform text-white/40 transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                        Solution:
                      </p>
                      <ol className="mt-2 space-y-1 text-xs text-white/70">
                        {item.solution.map((step, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-secondary-400">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="rounded-lg bg-secondary-500/10 p-3">
                      <p className="text-xs font-semibold text-secondary-300">💡 Prevention:</p>
                      <p className="mt-1 text-xs text-white/70">{item.prevention}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Additional Resources */}
          <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-4">
            <h4 className="text-sm font-semibold text-accent-200">Still Having Issues?</h4>
            <p className="mt-2 text-xs text-white/70">
              If problems persist after trying these solutions:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-white/70">
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  Check the{' '}
                  <a
                    href="https://support.perawallet.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-300 underline hover:text-accent-200"
                  >
                    Pera Wallet Support
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Try using a different browser (Chrome or Brave recommended)</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Make sure both devices are on the same network</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Contact AlgoEase support with error details</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTroubleshoot;

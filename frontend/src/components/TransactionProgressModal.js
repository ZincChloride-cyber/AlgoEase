import React from 'react';

const TransactionProgressModal = ({ isOpen, stage, txId, error, onClose, onGoToMyBounties, onClearPending, mode = 'create' }) => {
  if (!isOpen) return null;

  const isResolveMode = mode === 'resolve';

  const stages = isResolveMode
    ? [
        { id: 'preparing', label: 'Preparing refund', icon: '🧾' },
        { id: 'signing', label: 'Waiting for wallet signature', icon: '✍️' },
        { id: 'submitting', label: 'Submitting refund to blockchain', icon: '🚀' },
        { id: 'confirming', label: 'Confirming refund on-chain', icon: '⏳' },
        { id: 'complete', label: 'Bounty refunded successfully!', icon: '✅' },
      ]
    : [
        { id: 'preparing', label: 'Preparing transaction', icon: '📝' },
        { id: 'signing', label: 'Waiting for wallet signature', icon: '✍️' },
        { id: 'submitting', label: 'Submitting to blockchain', icon: '🚀' },
        { id: 'confirming', label: 'Confirming transaction', icon: '⏳' },
        { id: 'persisting', label: 'Saving to database', icon: '💾' },
        { id: 'complete', label: 'Bounty created successfully!', icon: '✅' },
      ];

  const currentStageIndex = stages.findIndex((s) => s.id === stage);
  const isError = stage === 'error';
  const isComplete = stage === 'complete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-card mx-4 w-full max-w-lg p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                isError
                  ? 'bg-red-500/20 text-red-300'
                  : isComplete
                  ? 'bg-gradient-to-br from-secondary-500 to-accent-500 text-white shadow-glow'
                  : 'bg-gradient-to-br from-primary-500 to-secondary-400 text-white'
              }`}
            >
              {isError ? '❌' : isComplete ? '🎉' : '⚡'}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              {isError
                ? 'Transaction Failed'
                : isComplete
                ? isResolveMode
                  ? 'Bounty Refunded'
                  : 'Success!'
                : isResolveMode
                ? 'Resolving Existing Bounty'
                : 'Creating Bounty'}
            </h2>
            {!isError && !isComplete && (
              <p className="mt-2 text-sm text-white/60">
                {isResolveMode
                  ? 'Please wait while we clean up the previous bounty on-chain...'
                  : 'Please wait while we process your transaction...'}
              </p>
            )}
          </div>

          {/* Progress Stages */}
          {!isError && (
            <div className="space-y-3">
              {stages.map((stageItem, index) => {
                const isPast = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isFuture = index > currentStageIndex;

                return (
                  <div
                    key={stageItem.id}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                      isPast
                        ? 'border-secondary-500/40 bg-secondary-500/10'
                        : isCurrent
                        ? 'border-primary-500/60 bg-primary-500/20 shadow-glow'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg ${
                        isPast
                          ? 'bg-secondary-500/30 text-secondary-200'
                          : isCurrent
                          ? 'animate-pulse bg-primary-500/40 text-primary-100'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {isPast ? '✓' : stageItem.icon}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isPast || isCurrent ? 'text-white' : 'text-white/50'
                        }`}
                      >
                        {stageItem.label}
                      </p>
                    </div>
                    {isCurrent && (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Message */}
          {isError && error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4">
              <p className="text-sm font-medium text-red-200">Error Details:</p>
              <p className="mt-2 text-sm text-red-300">{error}</p>
              {(error.includes('pending') || error.includes('4100')) && (
                <div className="mt-3 rounded-lg bg-yellow-500/20 border border-yellow-500/40 p-3">
                  <p className="text-xs font-semibold text-yellow-200">💡 How to fix this:</p>
                  <ul className="mt-2 text-xs text-yellow-100 space-y-1 list-disc list-inside">
                    <li>Open your Pera Wallet mobile app (or browser extension)</li>
                    <li>Check for any pending transaction requests</li>
                    <li>Either approve or cancel the pending transaction</li>
                    <li>Wait a few seconds, then try creating your bounty again</li>
                  </ul>
                  {onClearPending && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // Call the clear pending handler (which is async)
                          if (typeof onClearPending === 'function') {
                            await onClearPending();
                          }
                        } catch (error) {
                          console.error('Error clearing pending state:', error);
                          // Still close the modal even if there's an error
                          if (onClose) {
                          onClose();
                          }
                        }
                      }}
                      className="mt-3 w-full rounded-lg bg-yellow-600 hover:bg-yellow-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      Clear Pending State & Retry
                    </button>
                  )}
                </div>
              )}
              {(error.includes('earlier bounty is still open') || error.includes('existing bounty')) && !error.includes('not authorized') && (
                <div className="mt-3 rounded-lg bg-blue-500/20 border border-blue-500/40 p-3">
                  <p className="text-xs font-semibold text-blue-200">💡 What happens next:</p>
                  <ul className="mt-2 text-xs text-blue-100 space-y-1 list-disc list-inside">
                    <li>Clicking "Try Again" will automatically attempt to refund the existing bounty</li>
                    <li>If you're the client or verifier, the refund will proceed automatically</li>
                    <li>If the deadline has passed, anyone can trigger the auto-refund</li>
                    <li>After refund, your new bounty will be created automatically</li>
                  </ul>
                </div>
              )}
              {error.includes('not authorized') && (
                <div className="mt-3 rounded-lg bg-amber-500/20 border border-amber-500/40 p-3">
                  <p className="text-xs font-semibold text-amber-200">⚠️ Action Required:</p>
                  <p className="mt-2 text-xs text-amber-100">
                    You cannot automatically refund this bounty because you are not the client or verifier, and the deadline has not passed yet.
                  </p>
                  {onGoToMyBounties && (
                    <button
                      type="button"
                      onClick={onGoToMyBounties}
                      className="mt-3 w-full rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      Go to My Bounties →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transaction ID Link */}
          {txId && (
            <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Transaction ID</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 overflow-hidden text-ellipsis text-xs text-white/80">{txId}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(txId);
                    alert('Transaction ID copied to clipboard!');
                  }}
                  className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                >
                  Copy
                </button>
              </div>
              <a
                href={`https://testnet.algoexplorer.io/tx/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-xs text-secondary-300 hover:text-secondary-200"
              >
                View on AlgoExplorer
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
          {isComplete &&
            (isResolveMode ? (
              <button
                type="button"
                onClick={onClose}
                className="btn-primary w-full"
              >
                Close
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (window.location.href = '/bounties')}
                className="btn-primary w-full"
              >
                View Bounty
              </button>
            ))}
            {isError && (
              <div className="flex flex-col gap-2">
                {!error?.includes('not authorized') && (
                  <button type="button" onClick={onClose} className="btn-outline w-full">
                    Try Again
                  </button>
                )}
                {error?.includes('not authorized') && onGoToMyBounties && (
                  <button type="button" onClick={onGoToMyBounties} className="btn-primary w-full">
                    Go to My Bounties
                  </button>
                )}
                <button type="button" onClick={onClose} className="btn-outline w-full">
                  {error?.includes('not authorized') ? 'Close' : 'Cancel'}
                </button>
              </div>
            )}
            {!isComplete && !isError && (
              <p className="text-center text-xs text-white/40">Please do not close this window</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionProgressModal;

import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import TransactionProgressModal from '../components/TransactionProgressModal';
import WalletTroubleshoot from '../components/WalletTroubleshoot';
import PeraWalletDebug from '../components/PeraWalletDebug';
import PeraWalletTest from '../components/PeraWalletTest';
import apiService from '../utils/api';

const blueprint = [
  {
    title: 'Define the deliverable',
    detail: 'Describe outcomes with links, acceptance criteria, and any assets contributors should provide.',
  },
  {
    title: 'Stake escrow funds',
    detail: 'Set the ALGO reward. Funds remain locked until the verifier or you approve the submission.',
  },
  {
    title: 'Assign verification',
    detail: 'Nominate a verifier wallet or default to yours. They can approve, reject, or trigger a refund.',
  },
];

const CreateBounty = () => {
  const {
    isConnected,
    account,
    createBounty,
    contractState,
    getAccountInfo,
    pendingTransaction,
    clearPendingTransaction,
    loadContractState,
    isLoadingContract,
    refundBounty,
  } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    deadline: '',
    verifier: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStage, setProgressStage] = useState('preparing');
  const [transactionId, setTransactionId] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [modalMode, setModalMode] = useState('create');

  const hasActiveContractBounty =
    contractState &&
    typeof contractState.status === 'number' &&
    contractState.amount > 0 &&
    contractState.status !== 3 &&
    contractState.status !== 4;

  const isCreateDisabled =
    isSubmitting || pendingTransaction || isLoadingContract || hasActiveContractBounty || isResolving;
  const primaryButtonLabel = isSubmitting
    ? 'Creating…'
    : pendingTransaction
    ? 'Transaction pending…'
    : hasActiveContractBounty
    ? 'Resolve active bounty'
    : isLoadingContract
    ? 'Syncing contract…'
    : 'Deploy bounty';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    // Check if there's already a pending transaction
    if (pendingTransaction) {
      alert('A transaction is already in progress. Please complete or cancel it in your Pera Wallet app first.');
      return;
    }

    // Proceed directly with bounty creation - deep links will work on mobile
    proceedWithBountyCreation();
  };

  const proceedWithBountyCreation = async () => {
    setSubmitError('');
    setTransactionId('');

    // Refresh contract state before proceeding to ensure no active bounty remains
    let latestState = contractState;
    try {
      latestState = await loadContractState();
    } catch (stateError) {
      console.warn('Unable to refresh contract state before creating bounty:', stateError);
    }

    const activeBounty =
      latestState &&
      typeof latestState.status === 'number' &&
      latestState.amount > 0 &&
      latestState.status !== 3 &&
      latestState.status !== 4;

    if (activeBounty) {
      setSubmitError(
        'An existing bounty is still open on-chain. Head to My Bounties to approve, claim, or refund it before creating another.'
      );
      return;
    }

    setIsSubmitting(true);
    setShowProgressModal(true);
    setProgressStage('preparing');
    setModalMode('create');

    try {
      const verifierAddress = formData.verifier || account;

      // Stage 1: Preparing - Validate balance
      const accountInfo = await getAccountInfo();
      const amountMicro = Math.round(parseFloat(formData.amount) * 1000000);
      const balance = accountInfo?.amount || 0;

      // Reserve for minimum balance and fees (conservative)
      const reserved = 200000 + 100000; // extra buffer for opt-ins / fees

      if (balance < amountMicro + reserved) {
        throw new Error(
          `Insufficient balance. You need ~${(amountMicro + reserved) / 1000000} ALGO but have ${(
            balance / 1000000
          ).toFixed(6)} ALGO in your wallet.`
        );
      }

      // Include title + description on-chain (contract stores task_desc)
      const taskPayload = formData.title ? `${formData.title}\n\n${formData.description}` : formData.description;

      // Stage 2: Signing - createBounty will prompt wallet
      setProgressStage('signing');
      
      // This will handle signing, submitting, and confirming
      let txId;
      try {
        txId = await createBounty(
          parseFloat(formData.amount),
          formData.deadline,
          taskPayload,
          verifierAddress
        );
      } catch (txError) {
        // Check for specific error conditions
        if (txError.message && txError.message.includes('cancelled')) {
          throw new Error('Transaction signing was cancelled. Please try again.');
        }
        if (txError.message && txError.message.includes('pending')) {
          throw new Error('Another transaction is pending. Please complete or cancel it in your Pera Wallet app, then try again.');
        }
        if (txError.message && txError.message.includes('4100')) {
          throw new Error('Another transaction is pending in your wallet. Please complete or cancel it first, then try again.');
        }
        throw txError;
      }

      setTransactionId(txId);
      
      // At this point, transaction is confirmed on-chain
      // Stage 5: Persisting to backend
      setProgressStage('persisting');
      
      try {
        // Create a simple auth token from wallet address (basic approach)
        // In production, you'd sign a message and verify on backend
        const authToken = `wallet:${account}:${Date.now()}`;
        apiService.setAuthToken(authToken);
        
        await apiService.createBounty({
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          deadline: new Date(formData.deadline).toISOString(),
          verifierAddress: verifierAddress,
          contractId: contractState?.bountyCount || Date.now(),
          transactionId: txId,
          status: 'open',
        });
      } catch (backendError) {
        console.warn('Backend persistence failed (non-critical):', backendError);
        // Don't fail the whole flow if backend is down
      }

      // Stage 6: Complete
      setProgressStage('complete');

      // Clear form
      setFormData({
        title: '',
        description: '',
        amount: '',
        deadline: '',
        verifier: '',
      });

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/bounties';
      }, 3000);
    } catch (error) {
      console.error('Error creating bounty:', error);
      setProgressStage('error');
      setSubmitError(error.message || 'Failed to create bounty. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveActiveBounty = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setSubmitError('');
      setIsResolving(true);
      setShowProgressModal(true);
      setProgressStage('signing');
      setTransactionId('');
      setModalMode('resolve');

      const txId = await refundBounty();
      setTransactionId(txId);
      setProgressStage('confirming');

      await loadContractState();

      setProgressStage('complete');
      setTimeout(() => {
        setShowProgressModal(false);
        setProgressStage('preparing');
        setTransactionId('');
      }, 1500);
    } catch (resolveError) {
      console.error('Failed to resolve active bounty:', resolveError);
      setProgressStage('error');
      setSubmitError(
        resolveError.message ||
          'We could not refund the existing bounty automatically. Please try from the My Bounties page.'
      );
    } finally {
      setIsResolving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCloseModal = () => {
    setShowProgressModal(false);
    setProgressStage('preparing');
    setTransactionId('');
    setModalMode('create');
  };

  if (!isConnected) {
    return (
      <div className="glass-card mx-auto max-w-3xl p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-400 text-2xl text-white shadow-glow">
          🔐
        </div>
        <h2 className="mt-6 text-3xl font-semibold text-white">Connect wallet to launch a bounty</h2>
        <p className="mt-3 text-sm text-white/60">
          Link a wallet to stake escrow funds, configure verifiers, and push your bounty live on Algorand.
        </p>
        <p className="mt-6 text-sm text-white/40">
          Once connected, your wallet address will be used as the default verifier and client.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
      <TransactionProgressModal
        isOpen={showProgressModal}
        stage={progressStage}
        txId={transactionId}
        error={submitError}
        onClose={handleCloseModal}
        mode={modalMode}
      />
      <div className="glass-card p-10">
        <div>
          <span className="chip">Create new bounty</span>
          <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
            Configure escrow logic, verifier, and rewards.
          </h1>
          <p className="mt-3 text-sm text-white/60">
            AlgoEase will deploy and manage the bounty contract for you. All interactions remain transparent and
            reversible according to your configuration.
          </p>
        </div>

        {submitError && (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-xs uppercase tracking-[0.32em] text-white/40">
              Bounty title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="AlgoEase onboarding UI revamp"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-xs uppercase tracking-[0.32em] text-white/40">
              Task description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="input-field"
              placeholder="Outline the deliverables, acceptance criteria, milestones, and any reference links."
              required
            />
            <p className="text-xs text-white/40">
              Tip: mention asset formats (Figma, GitHub repo, Loom demo) plus links for handoff.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-xs uppercase tracking-[0.32em] text-white/40">
                Escrow amount (ALGO)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="input-field"
                placeholder="150"
                min="0.001"
                step="0.001"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="deadline" className="text-xs uppercase tracking-[0.32em] text-white/40">
                Deadline
              </label>
              <input
                type="datetime-local"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="verifier" className="text-xs uppercase tracking-[0.32em] text-white/40">
              Verifier address (optional)
            </label>
            <input
              type="text"
              id="verifier"
              name="verifier"
              value={formData.verifier}
              onChange={handleChange}
              className="input-field"
              placeholder="Default: your wallet address"
            />
            <p className="text-xs text-white/40">
              The verifier can approve submissions or trigger refunds if requirements are not met.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <button 
              type="submit" 
              className="btn-primary flex-1" 
              disabled={isCreateDisabled}
            >
              {primaryButtonLabel}
            </button>
            <button
              type="button"
              className="btn-outline flex-1"
              onClick={() => window.history.back()}
              disabled={isSubmitting || pendingTransaction}
            >
              Cancel
            </button>
          </div>
          
          {pendingTransaction && (
            <div className="mt-3 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold mb-1">⚠️ Transaction Pending</p>
                  <p className="text-yellow-300/90">
                    Please complete or cancel the transaction in your Pera Wallet app before creating a new bounty.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors uppercase tracking-wider"
                  onClick={() => {
                    clearPendingTransaction();
                    alert('Pending transaction state cleared. Please try again.');
                  }}
                >
                  Clear Pending State
                </button>
                <a
                  href="https://web.perawallet.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-200 px-4 py-2 rounded-lg transition-colors uppercase tracking-wider"
                >
                  Open Pera Wallet Web →
                </a>
              </div>
            </div>
          )}
      {hasActiveContractBounty && (
        <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          There is already an active bounty on the contract. Visit the My Bounties page to approve, claim, or refund it
          before creating another.
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary text-xs uppercase tracking-[0.2em]"
              onClick={handleResolveActiveBounty}
              disabled={isResolving || pendingTransaction || isSubmitting}
            >
              {isResolving ? 'Processing refund…' : 'Refund stuck bounty'}
            </button>
            <button
              type="button"
              className="btn-outline text-xs uppercase tracking-[0.2em]"
              onClick={() => (window.location.href = '/my-bounties')}
              disabled={isResolving}
            >
              Open My Bounties
            </button>
          </div>
        </div>
      )}
      {isLoadingContract && (
        <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-white/60">
          Syncing the latest contract state…
        </div>
      )}
        </form>
      </div>

      <aside className="glass-panel flex flex-col justify-between gap-10 p-8">
        <div className="space-y-6">
          <div>
            <span className="chip">Launch checklist</span>
            <h2 className="mt-4 text-2xl font-semibold text-white">What to prepare before you go live</h2>
          </div>
          <div className="space-y-4">
            {blueprint.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-white/60">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add troubleshooting component */}
        <WalletTroubleshoot />
        
        {/* Add Pera Wallet test tool */}
        <PeraWalletTest />
        
        {/* Add Pera Wallet debug tool */}
        <PeraWalletDebug />

        <div className="glass-card glow-border space-y-4 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Smart tips</h3>
          <ul className="space-y-3 text-xs text-white/60">
            <li className="flex gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
              Use ISO date-time to match Algorand block times for deadlines.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
              Set the verifier to a coworker or multisig address for shared oversight.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
              Reference previous work or brand kits to help freelancers respond faster.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default CreateBounty;

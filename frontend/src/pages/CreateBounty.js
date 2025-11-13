import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import TransactionProgressModal from '../components/TransactionProgressModal';
import WalletTroubleshoot from '../components/WalletTroubleshoot';
import PeraWalletDebug from '../components/PeraWalletDebug';
import PeraWalletTest from '../components/PeraWalletTest';
import apiService from '../utils/api';
import contractUtils, { GLOBAL_STATE_KEYS } from '../utils/contractUtils';

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
    checkWalletReady,
    loadContractState,
    isLoadingContract,
    refundBounty,
    autoRefundBounty,
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

  // Removed: No longer checking for active bounties to block creation
  // Contract now supports multiple bounties
  const hasActiveContractBounty = false; // Always allow creating new bounties

  const isCreateDisabled =
    isSubmitting || pendingTransaction || isLoadingContract || isResolving;
  const primaryButtonLabel = isSubmitting
    ? 'Creating…'
    : pendingTransaction
    ? 'Transaction pending…'
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

    // V3 contract supports multiple concurrent bounties via box storage
    // No need to check for existing bounties before creating a new one

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
      
      // Check if wallet is ready before attempting transaction
      try {
        console.log('🔍 Checking wallet readiness...');
        await checkWalletReady();
        console.log('✅ Wallet is ready');
      } catch (walletError) {
        console.warn('⚠️ Wallet readiness check failed:', walletError);
        // Continue anyway - the transaction will fail if wallet is not ready
      }
      
      // Clear any pending transaction state before attempting new transaction
      clearPendingTransaction();
      
      // Wait a moment to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        // Always clear pending state on error
        clearPendingTransaction();
        
        // Check for specific error conditions
        if (txError.message && txError.message.includes('cancelled')) {
          throw new Error('Transaction signing was cancelled. Please try again.');
        }
        if (txError.message && (txError.message.includes('pending') || txError.message.includes('4100'))) {
          // Clear state and provide helpful error message
          await new Promise(resolve => setTimeout(resolve, 500));
          throw new Error('Another transaction is pending in Pera Wallet. Please complete or cancel it in your wallet app, then try again.');
        }
        
        // Log the actual error for debugging
        console.error('Transaction error:', txError);
        
        // Show the actual error message to the user
        // V3 contract supports multiple bounties, so no need for auto-refund logic
        const errorMessage = txError.message || txError.toString() || 'Unknown error occurred';
        throw new Error(`Failed to create bounty: ${errorMessage}`);
      }

      setTransactionId(txId);
      
      // At this point, transaction is confirmed on-chain
      // Stage 5: Persisting to backend
      setProgressStage('persisting');
      
      try {
        // Set auth token - backend expects the address directly as Bearer token
        apiService.setAuthToken(account);
        console.log('🔐 Auth token set for account:', account);
        
        // Get the bounty_id from contract after creation
        // For V3 contract, we use bounty_count - 1 as the ID
        // Wait a bit for the contract state to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let bountyId;
        try {
          const state = await contractUtils.getContractState();
          console.log('📊 Contract state after creation:', state);
          const bountyCounter = state['bounty_count'] || state[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
          console.log('🔢 Bounty counter from state:', bountyCounter);
          
          if (bountyCounter > 0) {
            // The new bounty_id is bounty_counter - 1 (since counter was incremented after creation)
            bountyId = bountyCounter - 1;
            console.log('✅ Got bounty ID from contract:', bountyId);
          } else {
            console.warn('⚠️ Bounty counter is 0, trying to get from transaction');
            // Try to get bounty ID from transaction or use a fallback
            // For now, we'll use the transaction ID as a temporary identifier
            // The backend will handle the actual contract ID
            bountyId = null;
          }
        } catch (bountyIdError) {
          console.error('❌ Failed to get bounty ID from contract:', bountyIdError);
          bountyId = null;
        }
        
        // If we couldn't get the bounty ID, we'll let the backend handle it
        // The backend can query the contract to get the latest bounty_count
        const bountyData = {
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          deadline: new Date(formData.deadline).toISOString(),
          verifierAddress: verifierAddress,
          contractId: bountyId !== null ? String(bountyId) : undefined, // Let backend set it if we don't have it
          transactionId: txId,
          status: 'open',
        };
        
        console.log('💾 Saving bounty to backend:', JSON.stringify(bountyData, null, 2));
        console.log('🌐 API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
        
        try {
          // First create the bounty in the database (might not have contractId yet)
          const savedBounty = await apiService.createBounty(bountyData);
          console.log('✅ Bounty saved to backend successfully:', savedBounty);
          
          // If we got the bounty ID from the contract, update the database
          if (bountyId !== null && savedBounty.id) {
            try {
              await apiService.updateBounty(savedBounty.id, { contractId: String(bountyId) });
              console.log('✅ Bounty contract ID updated:', bountyId);
            } catch (updateError) {
              console.warn('⚠️ Failed to update contract ID:', updateError);
              // Not critical - the bounty is already saved
            }
          }
        } catch (apiError) {
          console.error('❌ API call failed:', apiError);
          console.error('❌ Error details:', {
            message: apiError.message,
            stack: apiError.stack,
            response: apiError.response
          });
          throw apiError; // Re-throw to be caught by outer catch
        }
      } catch (backendError) {
        console.error('❌ Backend persistence failed:', backendError);
        console.error('❌ Full error object:', backendError);
        setSubmitError(
          `Bounty was created on-chain but failed to save to database: ${backendError.message || 'Unknown error'}. ` +
          `Please check the browser console and backend logs for details.`
        );
        // Don't fail the whole flow if backend is down - transaction is already confirmed
        // But show error to user
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
      
      // Show the actual error to the user
      // V3 contract supports multiple bounties, so no auto-refund logic needed
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
    setSubmitError('');
  };

  const handleTryAgain = async () => {
    // Clear pending transaction state first
    clearPendingTransaction();
    
    // Wait a moment for state to clear
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // If there's an error about existing bounty and user is authorized, try to handle it
    if (submitError && (
      submitError.includes('earlier bounty is still open') ||
      (submitError.includes('existing bounty') && !submitError.includes('not authorized'))
    )) {
      // Close modal and retry the entire process
      handleCloseModal();
      // Small delay to ensure modal closes
      await new Promise(resolve => setTimeout(resolve, 300));
      // Retry the submission
      proceedWithBountyCreation();
    } else if (submitError && (submitError.includes('pending') || submitError.includes('4100'))) {
      // For pending transaction errors, close modal and let user retry
      handleCloseModal();
      // Wait a bit longer for Pera Wallet to clear
      await new Promise(resolve => setTimeout(resolve, 1000));
      // User can try again after clearing the pending transaction in their wallet
    } else {
      // Just close the modal for other errors
      handleCloseModal();
    }
  };

  const handleGoToMyBounties = () => {
    window.location.href = '/my-bounties';
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
        onClose={progressStage === 'error' ? handleTryAgain : handleCloseModal}
        onGoToMyBounties={submitError && submitError.includes('not authorized') ? handleGoToMyBounties : null}
        onClearPending={() => {
          clearPendingTransaction();
          console.log('🧹 Cleared pending transaction state from error modal');
          // Close modal after clearing state
          setTimeout(() => {
            handleCloseModal();
          }, 500);
        }}
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
      {/* Removed: Active bounty warning - contract now supports multiple bounties */}
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

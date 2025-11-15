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
    setPendingTransaction,
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

      // Get actual minimum balance requirement from account
      // Minimum balance increases with assets, apps, and boxes
      const minBalance = accountInfo?.minBalance || 100000; // Default to 0.1 ALGO if not available
      
      // Calculate transaction fees
      // Payment transaction: 0.001 ALGO
      // App call transaction: 0.001 ALGO (can be higher for complex calls, use 0.002 for safety)
      const paymentFee = 1000; // 0.001 ALGO
      const appCallFee = 2000; // 0.002 ALGO (conservative estimate)
      const totalFees = paymentFee + appCallFee;
      
      // Calculate total required: amount + fees + minimum balance
      // The account must maintain minimum balance even after sending the payment
      const totalRequired = amountMicro + totalFees + minBalance;
      
      // Add a small buffer for safety (0.01 ALGO)
      const safetyBuffer = 10000; // 0.01 ALGO
      const totalRequiredWithBuffer = totalRequired + safetyBuffer;

      console.log('💰 Balance check:', {
        balance: balance / 1000000,
        amount: amountMicro / 1000000,
        minBalance: minBalance / 1000000,
        fees: totalFees / 1000000,
        totalRequired: totalRequired / 1000000,
        totalRequiredWithBuffer: totalRequiredWithBuffer / 1000000,
        shortfall: Math.max(0, (totalRequiredWithBuffer - balance) / 1000000)
      });

      if (balance < totalRequiredWithBuffer) {
        const shortfall = (totalRequiredWithBuffer - balance) / 1000000;
        throw new Error(
          `Insufficient balance. You need ${totalRequiredWithBuffer / 1000000} ALGO (${amountMicro / 1000000} ALGO for bounty + ${totalFees / 1000000} ALGO for fees + ${minBalance / 1000000} ALGO minimum balance) but have ${(balance / 1000000).toFixed(6)} ALGO. ` +
          `You need ${shortfall.toFixed(6)} more ALGO. ` +
          `Get testnet ALGOs from: https://bank.testnet.algorand.network/`
        );
      }

      // Include title + description on-chain (contract stores task_desc)
      const taskPayload = formData.title ? `${formData.title}\n\n${formData.description}` : formData.description;

      // Continue in "preparing" stage - build transactions first
      console.log('📝 Preparing transactions...');
      
      // Clear any pending transaction state (local only - don't disconnect wallet)
      // Only clear local state to avoid unnecessary wallet disconnection
      console.log('🧹 Clearing local pending transaction state...');
      try {
        // Pass false to avoid disconnecting wallet during normal flow
        await clearPendingTransaction(false);
        console.log('✅ Pending state cleared (local only)');
      } catch (clearError) {
        console.warn('⚠️ Error clearing pending transaction state (continuing anyway):', clearError);
      }
      
      // Wait a moment to ensure state is fully cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if wallet is ready before attempting transaction
      try {
        console.log('🔍 Checking wallet readiness...');
        await checkWalletReady();
        console.log('✅ Wallet is ready');
      } catch (walletError) {
        console.warn('⚠️ Wallet readiness check failed:', walletError);
        // Continue anyway - the transaction will fail if wallet is not ready
      }
      
      // Double-check that pending state is still clear
      // Note: clearPendingTransaction should have handled this, but we check anyway
      if (pendingTransaction) {
        console.warn('⚠️ Pending transaction state still set after clear, clearing again...');
        // Clear again (local only - don't disconnect)
        setPendingTransaction(false);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Now switch to "signing" stage - wallet will open next
      setProgressStage('signing');
      
      // Small delay to ensure UI updates and modal is visible before wallet opens
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now sign and submit transactions (this will open Pera Wallet)
      // createBounty will handle building, signing, submitting, and confirming
      // New contract: deadline and verifier are optional (not used by contract)
      let txId;
      try {
        console.log('🔐 Ready to open Pera Wallet for signing...');
        txId = await createBounty(
          parseFloat(formData.amount),
          formData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days if not provided
          taskPayload,
          verifierAddress || account // Use account as default if not provided
        );
      } catch (txError) {
        // Clear local pending state on error (don't disconnect wallet)
        setPendingTransaction(false);
        
        // Check for specific error conditions
        if (txError.message && txError.message.includes('cancelled')) {
          throw new Error('Transaction signing was cancelled. Please try again.');
        }
        if (txError.message && (txError.message.includes('pending') || txError.message.includes('4100'))) {
          // Clear state and provide helpful error message
          await new Promise(resolve => setTimeout(resolve, 500));
          throw new Error('Another transaction is pending in Pera Wallet. Please complete or cancel it in your wallet app, then try again.');
        }
        
        // Check for insufficient balance error
        if (txError.message && (txError.message.includes('balance') && txError.message.includes('below min'))) {
          // Extract balance information from error if possible
          const balanceMatch = txError.message.match(/balance (\d+)/);
          const minMatch = txError.message.match(/min (\d+)/);
          
          if (balanceMatch && minMatch) {
            const balance = parseInt(balanceMatch[1]) / 1000000;
            const minRequired = parseInt(minMatch[1]) / 1000000;
            const shortfall = minRequired - balance;
            
            throw new Error(
              `Insufficient balance. Your account has ${balance.toFixed(6)} ALGO but needs ${minRequired.toFixed(6)} ALGO to complete this transaction. ` +
              `You need ${shortfall.toFixed(6)} more ALGO. ` +
              `This includes the bounty amount, transaction fees, and minimum balance requirement. ` +
              `Get testnet ALGOs from: https://bank.testnet.algorand.network/`
            );
          }
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
        // Use improved retry logic with transaction ID
        console.log('🔍 Getting bounty ID from contract after creation...');
        let bountyId = null;
        
        try {
          // Use the improved function with retry logic
          bountyId = await contractUtils.getBountyIdAfterCreationWithRetry(txId, 5, 2000);
          
          if (bountyId !== null && bountyId !== undefined) {
            console.log(`✅ Successfully retrieved bounty ID: ${bountyId}`);
          } else {
            console.warn('⚠️ Could not retrieve bounty ID after all retries');
          }
        } catch (bountyIdError) {
          console.error('❌ Failed to get bounty ID:', bountyIdError);
          // Continue anyway - backend can try to fetch it
          bountyId = null;
        }
        
        // If we couldn't get the bounty ID, we'll let the backend handle it
        // The backend can query the contract to get the latest bounty_count
        // New contract: deadline and verifier are optional (stored in DB but not in contract)
        const bountyData = {
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null, // Optional
          clientAddress: account, // Explicitly send wallet address
          verifierAddress: verifierAddress || account, // Optional - default to creator
          contractId: bountyId !== null && bountyId !== undefined ? String(bountyId) : null, // Always send contractId (null if not available)
          transactionId: txId,
          status: 'open',
        };
        
        console.log('📤 Bounty data being sent to backend:', {
          ...bountyData,
          contractId: bountyData.contractId,
          hasContractId: bountyData.contractId !== null && bountyData.contractId !== undefined
        });
        
        console.log('💾 Saving bounty to backend:', JSON.stringify(bountyData, null, 2));
        console.log('🌐 API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
        
        let savedBounty;
        try {
          // First create the bounty in the database (might not have contractId yet)
          console.log('📤 Sending bounty data to backend API...');
          console.log('📤 Bounty data:', JSON.stringify(bountyData, null, 2));
          
          savedBounty = await apiService.createBounty(bountyData);
          
          console.log('✅ Bounty saved to backend successfully!');
          console.log('✅ Saved bounty response:', savedBounty);
          console.log('✅ Saved bounty ID:', savedBounty?.id);
          console.log('✅ Saved bounty contractId:', savedBounty?.contractId);
          
          // CRITICAL: Verify we got a valid response
          if (!savedBounty) {
            throw new Error('Backend returned empty response - bounty may not have been saved');
          }
          
          if (!savedBounty.id) {
            console.error('❌ CRITICAL: Backend response missing ID!', savedBounty);
            throw new Error('Backend response missing ID - bounty may not have been saved to database');
          }
          
          // Store the creation transaction ID and contractId
          if (txId && savedBounty.id) {
            try {
              console.log('💾 Storing creation transaction ID and contractId in database...');
              // Include contractId if we have it
              await apiService.updateBountyTransaction(
                savedBounty.id, 
                txId, 
                'create',
                bountyId !== null && bountyId !== undefined ? String(bountyId) : null
              );
              console.log('✅ Creation transaction ID and contractId stored successfully');
            } catch (txError) {
              console.warn('⚠️ Failed to store creation transaction ID (bounty still saved):', txError);
              // Don't throw - the bounty is already saved
            }
          }
          
          // CRITICAL: Always try to update contractId if we have it (even if it was sent initially)
          // This ensures the database always has the correct contractId
          if (bountyId !== null && bountyId !== undefined && savedBounty.id) {
            try {
              console.log('🔄 Updating bounty with contractId:', bountyId);
              const updatedBounty = await apiService.updateBounty(savedBounty.id, { contractId: String(bountyId) });
              console.log('✅ Bounty contract ID updated successfully:', {
                databaseId: savedBounty.id,
                contractId: bountyId,
                updatedBounty: updatedBounty
              });
              // Update savedBounty with the updated data
              savedBounty = updatedBounty;
            } catch (updateError) {
              console.error('❌ Failed to update contract ID:', updateError);
              console.error('❌ Update error details:', {
                message: updateError.message,
                status: updateError.status,
                response: updateError.response
              });
              // Try one more time with retry
              try {
                console.log('🔄 Retrying contract ID update...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retryUpdated = await apiService.updateBounty(savedBounty.id, { contractId: String(bountyId) });
                console.log('✅ Contract ID updated on retry:', retryUpdated);
                savedBounty = retryUpdated;
              } catch (retryError) {
                console.error('❌ Retry also failed:', retryError);
                // Still continue - the bounty is saved, just without contractId
              }
            }
          } else if (bountyId === null || bountyId === undefined) {
            console.warn('⚠️ No bounty ID available to update - contractId may be NULL in database');
          }
        } catch (apiError) {
          console.error('❌ API call failed:', apiError);
          console.error('❌ Error details:', {
            message: apiError.message,
            status: apiError.status,
            stack: apiError.stack,
            response: apiError.response
          });
          
          // Check if it's a network error or server error
          if (!apiError.status) {
            // Network error - backend might be down
            throw new Error(`Cannot connect to backend server. Please make sure the backend is running at ${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}`);
          }
          
          // If it's a 409 (Conflict) or 200 (already exists), treat as success
          if (apiError.status === 409 || apiError.status === 200 || apiError.isConflict) {
            console.log('✅ Bounty already exists in database, this is OK');
            // Try to get the existing bounty data from the response
            const existingData = apiError.existingData || apiError.response;
            if (existingData && (existingData.id || existingData.contractId)) {
              console.log('✅ Using existing bounty data from response:', existingData);
              savedBounty = existingData; // Use existing bounty data
              // Continue with success flow - bounty already exists
            } else if (bountyId !== null) {
              // If we can't get the data, try to fetch it by contract_id
              try {
                savedBounty = await apiService.getBounty(String(bountyId));
                console.log('✅ Fetched existing bounty by contract_id:', savedBounty);
              } catch (fetchError) {
                console.warn('⚠️ Could not fetch existing bounty, but it exists on-chain');
                // Create a minimal bounty object for the success flow
                savedBounty = {
                  id: null,
                  contractId: String(bountyId),
                  ...bountyData
                };
              }
            } else {
              // Can't proceed without bounty data - but since it exists on-chain, treat as success
              console.log('✅ Bounty exists on-chain, treating as success even without DB data');
              // Use the contractId from the response or from bountyId
              savedBounty = {
                id: null,
                contractId: existingData?.contractId || String(bountyId) || null,
                ...bountyData,
                exists: true // Mark that it exists
              };
            }
          } else {
            // Server error - get the error message from response
            const errorResponse = apiError.response || {};
            const errorMessage = errorResponse.message || errorResponse.error || apiError.message;
            
            // If it's a validation error, include the details
            if (errorResponse.details && Array.isArray(errorResponse.details)) {
              const validationDetails = errorResponse.details.map(d => {
                if (typeof d === 'string') return d;
                if (d.field && d.message) return `${d.field}: ${d.message}`;
                return JSON.stringify(d);
              }).join('; ');
              throw new Error(`Validation failed: ${validationDetails}. ${errorMessage}`);
            }
            
            throw new Error(`Backend error: ${errorMessage}`);
          }
        }
        
        // If we have savedBounty, continue with success flow
        if (!savedBounty) {
          throw new Error('Failed to save or retrieve bounty from database');
        }
      } catch (backendError) {
        console.error('❌ Backend persistence failed:', backendError);
        console.error('❌ Full error object:', backendError);
        
        // Set error state and stop the flow
        setProgressStage('error');
        setSubmitError(
          `Bounty was created on-chain (Transaction: ${txId}) but failed to save to database: ${backendError.message || 'Unknown error'}. ` +
          `Please check the browser console and backend logs for details. ` +
          `You can manually add this bounty to the database using the transaction ID.`
        );
        
        // Don't redirect - let user see the error
        setIsSubmitting(false);
        return; // Exit early - don't continue to completion
      }

      // Stage 6: Complete - only reached if save was successful
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
    // Clear pending transaction state first (local only - don't disconnect)
    try {
      await clearPendingTransaction(false);
      console.log('✅ Cleared pending transaction state');
    } catch (error) {
      console.warn('⚠️ Error clearing pending state:', error);
    }
    
    // Wait a moment for state to clear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // If there's an error about existing bounty and user is authorized, try to handle it
    if (submitError && (
      submitError.includes('earlier bounty is still open') ||
      (submitError.includes('existing bounty') && !submitError.includes('not authorized'))
    )) {
      // Close modal and retry the entire process
      handleCloseModal();
      // Small delay to ensure modal closes
      await new Promise(resolve => setTimeout(resolve, 500));
      // Retry the submission
      proceedWithBountyCreation();
    } else if (submitError && (submitError.includes('pending') || submitError.includes('4100'))) {
      // For pending transaction errors, close modal and let user retry
      handleCloseModal();
      // Wait a bit longer for Pera Wallet to clear
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('🔄 Ready to retry - user can click Deploy Bounty again');
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
        onClearPending={async () => {
          console.log('🧹 Clearing pending transaction state from error modal (with disconnect)...');
          try {
            // Pass true to force disconnect/reconnect when user explicitly requests it
            await clearPendingTransaction(true);
            console.log('✅ Pending state cleared successfully');
            // Close modal after clearing state
            setShowProgressModal(false);
            setSubmitError('');
            setIsSubmitting(false);
            // Wait a moment before allowing retry
            setTimeout(() => {
              console.log('🔄 Ready to retry - user can click Deploy Bounty again');
            }, 2000);
          } catch (error) {
            console.error('❌ Error clearing pending state:', error);
            // Still close modal even if there's an error
            setShowProgressModal(false);
            setSubmitError('');
            setIsSubmitting(false);
          }
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
                  onClick={async () => {
                    await clearPendingTransaction(false);
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

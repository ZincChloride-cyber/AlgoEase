import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import contractUtils from '../utils/contractUtils';
import apiService from '../utils/api';

const statusStyles = {
  open: { label: 'Open', badge: 'bg-gradient-to-r from-secondary-400/25 to-secondary-500/40 text-secondary-100 border border-secondary-300/40' },
  accepted: { label: 'Accepted', badge: 'bg-gradient-to-r from-primary-500/20 to-primary-600/40 text-primary-100 border border-primary-300/40' },
  approved: { label: 'Approved', badge: 'bg-gradient-to-r from-accent-400/25 to-accent-500/45 text-accent-50 border border-accent-300/40' },
  claimed: { label: 'Claimed', badge: 'bg-white/10 text-white/80 border border-white/20' },
  refunded: { label: 'Refunded', badge: 'bg-red-500/20 text-red-100 border border-red-400/40' },
  rejected: { label: 'Rejected', badge: 'bg-orange-500/20 text-orange-100 border border-orange-400/40' },
};

const BountyDetail = () => {
  const { id } = useParams();
  const {
    account,
    isConnected,
    contractState,
    loadContractState,
    acceptBounty,
    approveBounty,
    rejectBounty,
    claimBounty,
    refundBounty,
    canPerformAction,
  } = useWallet();

  const [bounty, setBounty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    description: '',
    links: ''
  });
  const [submittingWork, setSubmittingWork] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadBountyData = async () => {
      try {
        setLoading(true);
        console.log('📥 Loading bounty data for ID:', id);
        // Fetch bounty from API
        const bountyData = await apiService.getBounty(id);
        console.log('✅ Bounty data received:', bountyData);
        if (isMounted) {
          setBounty({
            ...bountyData,
            client: bountyData.clientAddress || bountyData.client_address,
            freelancer: bountyData.freelancerAddress || bountyData.freelancer_address,
            verifier: bountyData.verifierAddress || bountyData.verifier_address,
            requirements: bountyData.requirements || [],
            submissions: bountyData.submissions || [],
          });
        }
      } catch (error) {
        console.error('❌ Failed to load bounty data:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          response: error.response
        });
        if (isMounted) {
          setBounty(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadBountyData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const actions = useMemo(() => {
    if (!bounty || !isConnected) return [];
    // For API calls, always use the database ID (id) - this is the UUID from the database
    // For contract calls, we need the numeric contractId
    const apiBountyId = id; // Always use database ID for API calls
    // For contract calls, we need a numeric contractId
    const contractBountyId = bounty.contractId ? parseInt(bounty.contractId) : null;
    const hasValidContractId = contractBountyId !== null && !isNaN(contractBountyId);
    
    console.log('🔍 Bounty ID mapping:', {
      dbId: id,
      bountyContractId: bounty.contractId,
      contractBountyId: contractBountyId,
      hasValidContractId: hasValidContractId,
      bountyObject: bounty
    });
    
    // Normalize addresses for comparison (case-insensitive)
    const accountNormalized = (account || '').toUpperCase().trim();
    const isVerifier = accountNormalized === ((bounty.verifier || bounty.verifierAddress || bounty.verifier_address) || '').toUpperCase().trim();
    const isClient = accountNormalized === ((bounty.client || bounty.clientAddress || bounty.client_address) || '').toUpperCase().trim();
    const isFreelancer = accountNormalized === ((bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address) || '').toUpperCase().trim();
    
    return [
      bounty.status === 'open' && !isClient && {
        label: 'Accept bounty',
        action: 'accept',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error('This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.');
          }

          // Set auth token for API call (wallet address as Bearer token)
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          
          try {
            // First update backend
            console.log('📤 Calling API to accept bounty with ID:', apiBountyId);
            await apiService.acceptBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error:', apiError);
            throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
          }
          
          // Then call contract
          console.log('📤 Calling smart contract to accept bounty with contract ID:', contractBountyId);
          const txId = await acceptBounty(contractBountyId);
          console.log('✅ Contract transaction successful:', txId);
          
          // Store transaction ID in database (auth token still set from above)
          if (txId) {
            try {
              console.log('💾 Storing transaction ID in database...');
              console.log('💾 Using bounty ID:', id, 'for transaction update');
              // Use the database ID (id) not contractId for the API call
              await apiService.updateBountyTransaction(id, txId, 'accept');
              console.log('✅ Transaction ID stored successfully');
            } catch (txError) {
              console.error('❌ Failed to store transaction ID:', txError);
              console.error('❌ Error details:', {
                message: txError.message,
                status: txError.status,
                response: txError.response
              });
              // Don't throw - the transaction succeeded on-chain, this is just metadata
            }
          } else {
            console.warn('⚠️ No transaction ID returned from acceptBounty');
          }
          
          // Restore original token after all API calls
          if (originalToken) {
            apiService.setAuthToken(originalToken);
          } else {
            apiService.removeAuthToken();
          }
          
          return txId;
        },
        style: 'btn-primary',
      },
      bounty.status === 'accepted' && (isVerifier || isClient) && {
        label: 'Approve work',
        action: 'approve',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error(
              `This bounty does not have a valid contract ID.\n\n` +
              `Database ID: ${id}\n` +
              `Contract ID: ${bounty.contractId || 'Not set'}\n\n` +
              `The bounty may not have been deployed to the smart contract yet, or the contract ID may be missing from the database.\n\n` +
              `Please check:\n` +
              `- The bounty was successfully created on-chain\n` +
              `- The contract ID was saved to the database\n` +
              `- Try refreshing the page or recreating the bounty`
            );
          }

          // Set auth token for API call
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          try {
            // First update backend
            console.log('📤 Calling API to approve bounty with ID:', apiBountyId);
            await apiService.approveBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error:', apiError);
            throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
          }
          // Verify bounty exists on contract before attempting approval
          // First check if we have freelancer address in database (bounty was accepted)
          const dbFreelancerAddress = bounty.freelancerAddress || bounty.freelancer_address;
          if (!dbFreelancerAddress) {
            throw new Error(
              `Bounty has not been accepted yet.\n\n` +
              `A freelancer must accept the bounty before it can be approved.\n` +
              `Current status: ${bounty.status}\n\n` +
              `Please wait for a freelancer to accept the bounty.`
            );
          }
          
          console.log('🔍 Verifying bounty exists on contract before approval...');
          let bountyData = null;
          let boxReadFailed = false;
          
          try {
            // First, check contract state to see how many bounties exist
            let contractBountyCount = null;
            try {
              const contractState = await contractUtils.getContractState();
              contractBountyCount = contractState['bounty_count'] || contractState[GLOBAL_STATE_KEYS.BOUNTY_COUNT] || 0;
              console.log(`[BountyDetail] Contract has ${contractBountyCount} bounties (IDs 0-${contractBountyCount - 1})`);
            } catch (stateError) {
              console.warn('[BountyDetail] Could not get contract state:', stateError);
            }
            
            try {
              bountyData = await contractUtils.getBountyFromBox(contractBountyId);
            } catch (boxError) {
              boxReadFailed = true;
              console.warn('⚠️ Could not read bounty box, but continuing with database data:', boxError.message);
              
              // If box doesn't exist but we have database data, we can still proceed
              // The contract will handle the transaction, and if the box doesn't exist, it will fail there
              if (contractBountyCount !== null && contractBountyId >= contractBountyCount) {
                // Bounty ID is out of range
                throw new Error(
                  `Bounty ID ${contractBountyId} does not exist.\n\n` +
                  `The contract only has ${contractBountyCount} bounties (IDs 0-${contractBountyCount - 1}).\n\n` +
                  `Please verify the bounty ID in the database matches the on-chain bounty ID.`
                );
              }
              
              // If box read failed but bounty ID is valid, warn but continue
              console.warn('⚠️ Box read failed, but proceeding with approval using database freelancer address');
              console.warn('⚠️ The contract transaction may fail if the box truly doesn\'t exist');
            }
            
            // If we got bounty data from box, verify it
            if (bountyData) {
              if (!bountyData.freelancerAddress) {
                throw new Error(
                  `Bounty exists but has not been accepted yet.\n\n` +
                  `A freelancer must accept the bounty before it can be approved.\n` +
                  `Current status: ${bountyData.status}\n\n` +
                  `Please wait for a freelancer to accept the bounty.`
                );
              }
              
              // Verify freelancer address matches database
              if (bountyData.freelancerAddress !== dbFreelancerAddress) {
                console.warn('⚠️ Freelancer address mismatch:', {
                  database: dbFreelancerAddress,
                  onChain: bountyData.freelancerAddress
                });
              }
              
              console.log('✅ Bounty verified on contract:', {
                bountyId: contractBountyId,
                freelancer: bountyData.freelancerAddress,
                status: bountyData.status
              });
            } else if (boxReadFailed) {
              // Box read failed but we have database data - proceed with warning
              console.warn('⚠️ Proceeding with approval using database freelancer address:', dbFreelancerAddress);
              console.warn('⚠️ Note: Box verification failed, but transaction will be attempted');
            }
          } catch (verifyError) {
            console.error('❌ Bounty verification failed:', verifyError);
            // If it's already a formatted error, throw it as-is
            if (verifyError.message?.includes('Bounty not found') || 
                verifyError.message?.includes('has not been accepted') ||
                verifyError.message?.includes('does not exist')) {
              throw verifyError;
            }
            // Otherwise, provide a generic error
            throw new Error(
              `Failed to verify bounty on blockchain: ${verifyError.message}\n\n` +
              `Please check:\n` +
              `- The bounty was successfully created on-chain\n` +
              `- The contract ID matches: ${contractUtils.getAppId()} (V4)\n` +
              `- The bounty ID is correct: ${contractBountyId}`
            );
          }
          
          // Then call contract (transfers funds directly to freelancer)
          console.log('📤 Calling smart contract to approve bounty with contract ID:', contractBountyId);
          try {
            const txId = await approveBounty(contractBountyId);
            console.log('✅ Contract transaction successful:', txId);
            
            // Store transaction ID in database
            if (txId) {
              try {
                console.log('💾 Storing transaction ID in database...');
                console.log('💾 Using bounty ID:', id, 'for transaction update');
                // Use the database ID (id) not contractId for the API call
                await apiService.updateBountyTransaction(id, txId, 'approve');
                console.log('✅ Transaction ID stored successfully');
              } catch (txError) {
                console.error('❌ Failed to store transaction ID:', txError);
                console.error('❌ Error details:', {
                  message: txError.message,
                  status: txError.status,
                  response: txError.response
                });
                // Don't throw - the transaction succeeded on-chain, this is just metadata
              }
            } else {
              console.warn('⚠️ No transaction ID returned from approveBounty');
            }
            
            // Restore original token after all API calls
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
            
            return txId;
          } catch (contractError) {
            // Restore original token on error too
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
            console.error('❌ Contract error:', contractError);
            // Provide more helpful error message
            if (contractError.message?.includes('Failed to read bounty data')) {
              throw new Error(
                `Failed to approve bounty: ${contractError.message}\n\n` +
                `This usually means:\n` +
                `- The bounty may not exist on the smart contract yet\n` +
                `- The contract ID (${bounty.contractId}) may be incorrect\n` +
                `- The bounty may need to be recreated\n\n` +
                `Please check the bounty details and try again.`
              );
            }
            throw contractError;
          }
        },
        style: 'btn-primary',
      },
      bounty.status === 'accepted' && (isVerifier || isClient) && {
        label: 'Reject work',
        action: 'reject',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error('This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.');
          }

          // Set auth token for API call
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          try {
            // First update backend
            console.log('📤 Calling API to reject bounty with ID:', apiBountyId);
            await apiService.rejectBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error:', apiError);
            throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
          } finally {
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
          }
          // Then call contract (refunds to client)
          console.log('📤 Calling smart contract to reject bounty with contract ID:', contractBountyId);
          const txId = await rejectBounty(contractBountyId);
          console.log('✅ Contract transaction successful:', txId);
          return txId;
        },
        style: 'btn-outline',
      },
      bounty.status === 'approved' && isFreelancer && {
        label: 'Claim payment',
        action: 'claim',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error('This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.');
          }

          // Set auth token for API call
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          try {
            // First update backend
            console.log('📤 Calling API to claim bounty with ID:', apiBountyId);
            await apiService.claimBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error:', apiError);
            throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
          } finally {
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
          }
          // Then call contract
          console.log('📤 Calling smart contract to claim bounty with contract ID:', contractBountyId);
          const txId = await claimBounty(contractBountyId);
          console.log('✅ Contract transaction successful:', txId);
          return txId;
        },
        style: 'btn-secondary',
      },
      (bounty.status === 'open' || bounty.status === 'accepted') && (isClient || isVerifier) && {
        label: 'Initiate refund',
        action: 'refund',
        handler: async () => {
          if (!apiBountyId) {
            throw new Error('Bounty ID is missing');
          }

          // Contract requires numeric contractId
          if (!hasValidContractId) {
            throw new Error('This bounty does not have a valid contract ID. It may not have been deployed to the smart contract yet.');
          }

          // Set auth token for API call
          const originalToken = apiService.getAuthToken();
          apiService.setAuthToken(account);
          try {
            // First update backend
            console.log('📤 Calling API to refund bounty with ID:', apiBountyId);
            await apiService.refundBounty(apiBountyId);
            console.log('✅ Backend updated successfully');
          } catch (apiError) {
            console.error('❌ API error:', apiError);
            throw new Error(`Failed to update backend: ${apiError.message || 'Unknown error'}`);
          } finally {
            if (originalToken) {
              apiService.setAuthToken(originalToken);
            } else {
              apiService.removeAuthToken();
            }
          }
          // Then call contract
          console.log('📤 Calling smart contract to refund bounty with contract ID:', contractBountyId);
          const txId = await refundBounty(contractBountyId);
          console.log('✅ Contract transaction successful:', txId);
          return txId;
        },
        style: 'btn-outline',
      },
    ].filter(Boolean);
  }, [bounty, id, account, isConnected, acceptBounty, approveBounty, rejectBounty, claimBounty, refundBounty]);

  const formatDate = (value) => {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

  const handleAction = async (action) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const selected = actions.find((item) => item.action === action);
    if (!selected) return;

    try {
      setActionLoading(true);
      const txId = await selected.handler();
      alert(`Success! Transaction ID: ${txId}`);
      // Reload bounty data after action
      const bountyData = await apiService.getBounty(id);
      setBounty({
        ...bountyData,
        client: bountyData.clientAddress,
        freelancer: bountyData.freelancerAddress,
        verifier: bountyData.verifierAddress,
      });
    } catch (error) {
      console.error(`Failed to ${action} bounty:`, error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Unknown error occurred';
      
      // Check for pending transaction error
      if (errorMessage.toLowerCase().includes('pending') && errorMessage.toLowerCase().includes('pera wallet')) {
        errorMessage = 'Another transaction is pending in Pera Wallet.\n\n' +
          'How to fix this:\n' +
          '1. Open your Pera Wallet mobile app (or browser extension)\n' +
          '2. Check for any pending transaction requests\n' +
          '3. Either approve or cancel the pending transaction\n' +
          '4. Wait a few seconds, then try again\n\n' +
          'Tip: Make sure your Pera Wallet is unlocked and connected.';
      } else if (errorMessage.toLowerCase().includes('unavailable account')) {
        errorMessage = 'Smart contract cannot access required account.\n\n' +
          'This may happen if:\n' +
          '1. The bounty has not been accepted yet (for approve/reject actions)\n' +
          '2. The bounty data is corrupted\n\n' +
          'Please refresh the page and try again. If the issue persists, contact support.';
      } else if (errorMessage.toLowerCase().includes('reject') || errorMessage.toLowerCase().includes('cancel')) {
        errorMessage = 'Transaction was cancelled. You can try again when ready.';
      } else if (errorMessage.toLowerCase().includes('insufficient')) {
        errorMessage = 'Insufficient funds to complete this transaction.\n\n' +
          'Make sure you have enough ALGO to cover:\n' +
          '• The transaction amount\n' +
          '• Transaction fees (~0.001 ALGO)\n' +
          '• Minimum balance requirement (0.1 ALGO)';
      }
      
      alert(`Failed to ${action} bounty:\n\n${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    
    if (!isConnected || !account) {
      alert('Please connect your wallet first');
      return;
    }

    // Normalize addresses for comparison (case-insensitive, trimmed)
    const accountNormalized = (account || '').toUpperCase().trim();
    const freelancerNormalized = ((bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address) || '').toUpperCase().trim();
    
    console.log('🔍 Checking freelancer match for submission:', {
      account: accountNormalized,
      freelancer: freelancerNormalized,
      match: accountNormalized === freelancerNormalized,
      bountyFreelancer: bounty.freelancer,
      bountyFreelancerAddress: bounty.freelancerAddress,
      bountyFreelancer_address: bounty.freelancer_address
    });

    if (!freelancerNormalized || accountNormalized !== freelancerNormalized) {
      console.error('❌ Freelancer address mismatch:', {
        account: accountNormalized,
        freelancer: freelancerNormalized
      });
      alert(`Only the freelancer who accepted this bounty can submit work.\n\nYour address: ${account}\nFreelancer address: ${bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address}`);
      return;
    }

    try {
      setSubmittingWork(true);
      
      // Set auth token for API call (wallet address as Bearer token)
      const originalToken = apiService.getAuthToken();
      apiService.setAuthToken(account);
      
      try {
        const linksArray = submissionData.links
          ? submissionData.links.split(',').map(link => link.trim()).filter(link => link)
          : [];

        await apiService.submitWork(bounty.contractId || id, {
          description: submissionData.description,
          links: linksArray
        });
      } finally {
        // Restore original token
        if (originalToken) {
          apiService.setAuthToken(originalToken);
        } else {
          apiService.removeAuthToken();
        }
      }

      alert('Work submitted successfully!');
      setShowSubmissionForm(false);
      setSubmissionData({ description: '', links: '' });
      
      // Reload bounty data to show submission
      const bountyData = await apiService.getBounty(id);
      setBounty({
        ...bountyData,
        client: bountyData.clientAddress,
        freelancer: bountyData.freelancerAddress,
        verifier: bountyData.verifierAddress,
      });
    } catch (error) {
      console.error('Failed to submit work:', error);
      alert(`Failed to submit work: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmittingWork(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card mx-auto max-w-4xl p-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-secondary-300"></div>
        <p className="mt-4 text-sm text-white/60">Syncing bounty details from the blockchain…</p>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="glass-card mx-auto max-w-3xl p-12 text-center">
        <h2 className="text-2xl font-semibold text-white">Bounty not found</h2>
        <p className="mt-3 text-sm text-white/60">This bounty may have been closed or the ID is invalid.</p>
      </div>
    );
  }

  const statusStyle = statusStyles[bounty.status] || statusStyles.open;

  return (
    <div className="space-y-10">
      <section className="glass-card glow-border p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="tag">Bounty #{bounty.id || '—'}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${statusStyle.badge}`}>
                {statusStyle.label}
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">{bounty.title}</h1>
            <p className="text-sm text-white/60">{bounty.description}</p>
            <div className="glass-panel grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Client</p>
                <p className="mt-2 font-medium text-white">{formatAddress(bounty.client)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Created</p>
                <p className="mt-2 font-medium text-white">{formatDate(bounty.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Deadline</p>
                <p className="mt-2 font-medium text-white">{formatDate(bounty.deadline)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-6">
            <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-right">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Reward</p>
              <p className="mt-3 text-4xl font-semibold text-white">{bounty.amount} ALGO</p>
              <p className="text-xs text-white/45">Secured in escrow</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              {actions.length === 0 ? (
                <span className="text-xs text-white/45">No actions available at this stage.</span>
              ) : (
                actions.map(({ action, label, style }) => (
                  <button
                    key={action}
                    type="button"
                    className={`${style} text-sm`}
                    onClick={() => handleAction(action)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing…' : label}
                  </button>
                ))
              )}
            </div>
            <p className="text-xs text-white/40">Viewer wallet: {account ? formatAddress(account) : 'Not connected'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-8">
          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold text-white">Requirements</h2>
            <p className="mt-2 text-sm text-white/60">
              Meet each requirement to ensure approval and instant payout. All checkpoints are recorded on-chain for transparency.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-white/70">
              {bounty.requirements && bounty.requirements.length > 0 ? (
                bounty.requirements.map((requirement, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-secondary-400"></span>
                    <span>{requirement}</span>
                  </li>
                ))
              ) : (
                <li className="text-white/50">No specific requirements listed.</li>
              )}
            </ul>
          </div>

          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold text-white">On-chain timeline</h2>
            <p className="mt-2 text-sm text-white/60">
              Status transitions and relevant wallet signatures are logged automatically. Use them to resolve disputes quickly.
            </p>
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-primary-500"></div>
                <div>
                  <p className="text-sm font-semibold text-white">Bounty created</p>
                  <p className="text-xs text-white/50">{formatDate(bounty.createdAt)}</p>
                </div>
              </div>
              {bounty.status !== 'open' && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-3 w-3 rounded-full bg-secondary-400"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Accepted by contributor</p>
                    <p className="text-xs text-white/50">
                      {bounty.freelancer ? formatAddress(bounty.freelancer) : 'Awaiting signer'}
                    </p>
                  </div>
                </div>
              )}
              {bounty.status === 'approved' && (
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-3 w-3 rounded-full bg-accent-400"></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Work approved</p>
                    <p className="text-xs text-white/50">Payment ready for claim</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="mt-1 h-3 w-3 rounded-full bg-white/30"></div>
                <div>
                  <p className="text-sm font-semibold text-white">Deadline</p>
                  <p className="text-xs text-white/50">{formatDate(bounty.deadline)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold text-white">Role summary</h2>
            <div className="mt-5 space-y-4 text-sm text-white/70">
              <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Client</p>
                <p className="mt-2 text-white">{formatAddress(bounty.client)}</p>
              </div>
              <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Verifier</p>
                <p className="mt-2 text-white">
                  {bounty.verifier ? formatAddress(bounty.verifier) : 'Pending assignment'}
                </p>
              </div>
              <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.32em] text-white/40">Freelancer</p>
                <p className="mt-2 text-white">
                  {bounty.freelancer ? formatAddress(bounty.freelancer) : 'Not yet accepted'}
                </p>
              </div>
            </div>
          </div>

          {bounty.status === 'accepted' && (() => {
            const accountNormalized = (account || '').toUpperCase().trim();
            const freelancerNormalized = ((bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address) || '').toUpperCase().trim();
            return accountNormalized === freelancerNormalized;
          })() && (
            <div className="glass-card glow-border p-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Submit Your Work</h3>
              {!showSubmissionForm ? (
                <>
                  <p className="mt-3 text-sm text-white/65">
                    Share your completed work, including GitHub repositories, design files, or documentation links.
                  </p>
                  <button
                    onClick={() => setShowSubmissionForm(true)}
                    className="btn-primary mt-4 text-sm"
                  >
                    Submit Work
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmitWork} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.32em] text-white/40 mb-2">
                      Description
                    </label>
                    <textarea
                      value={submissionData.description}
                      onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                      placeholder="Describe your work, what you've completed, and any important notes..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.32em] text-white/40 mb-2">
                      Links (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={submissionData.links}
                      onChange={(e) => setSubmissionData({ ...submissionData, links: e.target.value })}
                      placeholder="https://github.com/..., https://example.com/..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                    />
                    <p className="mt-1 text-xs text-white/40">Separate multiple links with commas</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingWork}
                      className="btn-primary text-sm flex-1 disabled:opacity-50"
                    >
                      {submittingWork ? 'Submitting...' : 'Submit Work'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubmissionForm(false);
                        setSubmissionData({ description: '', links: '' });
                      }}
                      className="btn-outline text-sm"
                      disabled={submittingWork}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          
          {(bounty.status !== 'accepted' || (() => {
            const accountNormalized = (account || '').toUpperCase().trim();
            const freelancerNormalized = ((bounty.freelancer || bounty.freelancerAddress || bounty.freelancer_address) || '').toUpperCase().trim();
            return accountNormalized !== freelancerNormalized;
          })()) && (
            <div className="glass-card glow-border p-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Need to submit?</h3>
              <p className="mt-3 text-sm text-white/65">
                Share GitHub repositories, design files, or documentation links in your submission payload. Keep logs and proof of work for faster verification.
              </p>
              <ul className="mt-6 space-y-3 text-xs text-white/50">
                <li className="flex gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                  Pin large files and share IPFS / Arweave hashes.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                  Include quick Loom or Figma walkthroughs for context.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-secondary-400"></span>
                  Document anything the verifier must confirm before release.
                </li>
              </ul>
            </div>
          )}
          
          {bounty.submissions && bounty.submissions.length > 0 && (
            <div className="glass-panel p-8">
              <h2 className="text-xl font-semibold text-white">Submissions</h2>
              <div className="mt-4 space-y-4">
                {bounty.submissions.map((submission, index) => (
                  <div key={index} className="glass-card rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.32em] text-white/40 mb-2">
                      Submission #{index + 1}
                    </p>
                    <p className="text-sm text-white/70 mb-3">{submission.description}</p>
                    {submission.links && submission.links.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-white/40 mb-2">Links</p>
                        <ul className="space-y-1">
                          {submission.links.map((link, linkIndex) => (
                            <li key={linkIndex}>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-300 hover:text-primary-200 underline"
                              >
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-white/40 mt-3">
                      Submitted by: {formatAddress(submission.freelancerAddress || bounty.freelancer)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default BountyDetail;

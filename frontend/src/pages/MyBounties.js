import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import apiService from '../utils/api';
import contractUtils from '../utils/contractUtils';

const statusStyles = {
  open: { label: 'Open', badge: 'bg-gradient-to-r from-secondary-400/25 to-secondary-500/40 text-secondary-100 border border-secondary-300/40' },
  accepted: { label: 'Accepted', badge: 'bg-gradient-to-r from-primary-500/20 to-primary-600/40 text-primary-100 border border-primary-300/40' },
  approved: { label: 'Approved', badge: 'bg-gradient-to-r from-accent-400/25 to-accent-500/45 text-accent-50 border border-accent-300/40' },
  claimed: { label: 'Claimed', badge: 'bg-white/10 text-white/80 border border-white/20' },
  refunded: { label: 'Refunded', badge: 'bg-red-500/20 text-red-100 border border-red-400/40' },
  rejected: { label: 'Rejected', badge: 'bg-orange-500/20 text-orange-100 border border-orange-400/40' },
};

const tabs = [
  {
    id: 'created',
    title: 'Creator view',
    description: 'Bounties you launched and currently oversee.',
  },
  {
    id: 'accepted',
    title: 'Contributor view',
    description: 'Bounties you accepted and are delivering.',
  },
];

const MyBounties = () => {
  const {
    isConnected,
    account,
    contractState,
    loadContractState,
    signTransaction,
    acceptBounty,
    approveBounty,
    rejectBounty,
    claimBounty,
    refundBounty,
    autoRefundBounty,
    canPerformAction,
  } = useWallet();

  const [bounties, setBounties] = useState({ created: [], accepted: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isConnected || !account) {
      setLoading(false);
      setBounties({ created: [], accepted: [] });
      setError('');
      return;
    }

    let isMounted = true;

    const loadUserBounties = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load contract state for smart contract interactions
        const state = await loadContractState();
        
        // Fetch bounties from backend API
        let createdBounties = [];
        let acceptedBounties = [];
        let apiError = false;
        
        try {
          console.log('🔍 Fetching bounties for account:', account);
          [createdBounties, acceptedBounties] = await Promise.all([
            apiService.getUserBounties(account, 'created'),
            apiService.getUserBounties(account, 'accepted')
          ]);
          
          console.log('📥 Raw API responses:', {
            created: createdBounties,
            accepted: acceptedBounties,
            createdType: typeof createdBounties,
            acceptedType: typeof acceptedBounties,
            createdIsArray: Array.isArray(createdBounties),
            acceptedIsArray: Array.isArray(acceptedBounties),
            createdConstructor: createdBounties?.constructor?.name,
            acceptedConstructor: acceptedBounties?.constructor?.name
          });
          
          // Handle different response formats
          // Sometimes the response might be wrapped in an object
          if (createdBounties && !Array.isArray(createdBounties)) {
            if (createdBounties.value && Array.isArray(createdBounties.value)) {
              console.log('📦 Unwrapping created bounties from value property');
              createdBounties = createdBounties.value;
            } else if (createdBounties.bounties && Array.isArray(createdBounties.bounties)) {
              console.log('📦 Unwrapping created bounties from bounties property');
              createdBounties = createdBounties.bounties;
            } else {
              console.warn('⚠️ Created bounties response is not an array:', createdBounties);
              createdBounties = [];
            }
          }
          
          if (acceptedBounties && !Array.isArray(acceptedBounties)) {
            if (acceptedBounties.value && Array.isArray(acceptedBounties.value)) {
              console.log('📦 Unwrapping accepted bounties from value property');
              acceptedBounties = acceptedBounties.value;
            } else if (acceptedBounties.bounties && Array.isArray(acceptedBounties.bounties)) {
              console.log('📦 Unwrapping accepted bounties from bounties property');
              acceptedBounties = acceptedBounties.bounties;
            } else {
              console.warn('⚠️ Accepted bounties response is not an array:', acceptedBounties);
              acceptedBounties = [];
            }
          }
          
          // Final check - ensure we have arrays
          if (!Array.isArray(createdBounties)) {
            console.error('❌ Created bounties is still not an array after unwrapping:', createdBounties);
            createdBounties = [];
          }
          if (!Array.isArray(acceptedBounties)) {
            console.error('❌ Accepted bounties is still not an array after unwrapping:', acceptedBounties);
            acceptedBounties = [];
          }
          
          console.log('✅ Fetched bounties from API:', {
            created: createdBounties.length,
            accepted: acceptedBounties.length,
            createdBounties: createdBounties,
            acceptedBounties: acceptedBounties
          });
        } catch (apiErr) {
          console.error('❌ API fetch failed:', apiErr);
          console.error('❌ Error details:', {
            message: apiErr.message,
            stack: apiErr.stack,
            response: apiErr.response
          });
          apiError = true;
          createdBounties = [];
          acceptedBounties = [];
        }

        if (!isMounted) return;

        // Transform API response to match component's expected format
        const transformBounty = (bounty) => ({
          id: bounty.contractId || bounty._id || bounty.id,
          title: bounty.title || 'Untitled Bounty',
          description: bounty.description || '',
          amount: typeof bounty.amount === 'number' ? bounty.amount : parseFloat(bounty.amount) || 0,
          deadline: bounty.deadline,
          status: bounty.status || 'open',
          client: bounty.clientAddress,
          freelancer: bounty.freelancerAddress,
          verifier: bounty.verifierAddress,
          createdAt: bounty.createdAt || new Date().toISOString(),
        });

        let transformedCreated = Array.isArray(createdBounties) 
          ? createdBounties.map(transformBounty)
          : [];
        let transformedAccepted = Array.isArray(acceptedBounties)
          ? acceptedBounties.map(transformBounty)
          : [];

        // Fallback: If API failed and we have contract state, use it
        if (apiError && state && state.bountyCount > 0) {
          console.log('📡 Using blockchain state as fallback');
          const status =
            state.status === 0 ? 'open'
            : state.status === 1 ? 'accepted'
            : state.status === 2 ? 'approved'
            : state.status === 3 ? 'claimed'
            : 'refunded';

          // Skip if claimed or refunded
          if (state.status !== 3 && state.status !== 4) {
            const taskDesc = state.taskDescription || '';
            const title = taskDesc.split('\n')[0] || 'Smart Contract Bounty';
            
            const blockchainBounty = {
              id: state.bountyCount,
              title: title.length > 50 ? title.slice(0, 47) + '...' : title,
              description: taskDesc || 'Automated escrow flow powered by Algorand smart contracts.',
              amount: typeof state.amount === 'number' ? state.amount / 1000000 : parseFloat(state.amount || 0) / 1000000,
              deadline: state.deadline ? new Date(state.deadline * 1000).toISOString() : new Date().toISOString(),
              status,
              client: state.clientAddress,
              freelancer: state.freelancerAddress,
              verifier: state.verifierAddress,
              createdAt: new Date().toISOString(),
            };

            // Add to appropriate list
            if (account === state.clientAddress) {
              transformedCreated = [blockchainBounty];
            }
            if (account === state.freelancerAddress) {
              transformedAccepted = [blockchainBounty];
            }
          }
        }

        const newBounties = {
          created: transformedCreated,
          accepted: transformedAccepted,
        };
        
        console.log('💾 Setting bounties state:', {
          created: transformedCreated.length,
          accepted: transformedAccepted.length,
          newBounties: newBounties
        });
        
        setBounties(newBounties);

        console.log('📊 Final bounties loaded:', {
          created: transformedCreated.length,
          accepted: transformedAccepted.length,
          createdBounties: transformedCreated,
          acceptedBounties: transformedAccepted
        });
        
        // Debug: Log each bounty to see what we have
        if (transformedCreated.length > 0) {
          console.log('📋 Created bounties details:');
          transformedCreated.forEach((bounty, index) => {
            console.log(`  Bounty ${index + 1}:`, {
              id: bounty.id,
              title: bounty.title,
              status: bounty.status,
              client: bounty.client,
              amount: bounty.amount
            });
          });
        }
        
        if (transformedAccepted.length > 0) {
          console.log('📋 Accepted bounties details:');
          transformedAccepted.forEach((bounty, index) => {
            console.log(`  Bounty ${index + 1}:`, {
              id: bounty.id,
              title: bounty.title,
              status: bounty.status,
              freelancer: bounty.freelancer,
              amount: bounty.amount
            });
          });
        }
      } catch (err) {
        console.error('❌ Error loading user bounties:', err);
        if (isMounted) {
          setError('Failed to load your bounties. Please check if the backend server is running.');
          setBounties({ created: [], accepted: [] });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserBounties();

    return () => {
      isMounted = false;
    };
  }, [isConnected, account, loadContractState, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setError('');
  };

  const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatAddress = (address) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

  const currentBounties = useMemo(() => {
    const result = bounties[activeTab] || [];
    console.log('🔄 currentBounties computed:', {
      activeTab,
      bountiesKeys: Object.keys(bounties),
      bountiesCreated: bounties.created?.length || 0,
      bountiesAccepted: bounties.accepted?.length || 0,
      resultLength: result.length,
      result: result
    });
    return result;
  }, [bounties, activeTab]);

  const handleAction = async (action, bounty = null) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!bounty || !bounty.contractId) {
      alert('Bounty information is missing. Please refresh the page.');
      return;
    }

    try {
      setActionLoading(true);
      const bountyId = parseInt(bounty.contractId);
      
      if (isNaN(bountyId)) {
        throw new Error('Invalid bounty ID');
      }

      let txId;
      let apiResponse;

      // Update backend first, then call contract
      if (action === 'accept') {
        apiResponse = await apiService.acceptBounty(bountyId);
        txId = await acceptBounty(bountyId);
      } else if (action === 'approve') {
        apiResponse = await apiService.approveBounty(bountyId);
        txId = await approveBounty(bountyId);
      } else if (action === 'reject') {
        apiResponse = await apiService.rejectBounty(bountyId);
        txId = await rejectBounty(bountyId);
      } else if (action === 'claim') {
        apiResponse = await apiService.claimBounty(bountyId);
        txId = await claimBounty(bountyId);
      } else if (action === 'refund') {
        apiResponse = await apiService.refundBounty(bountyId);
        txId = await refundBounty(bountyId);
      } else if (action === 'auto-refund') {
        txId = await autoRefundBounty(bountyId);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }

      if (txId) {
        alert(`Action completed successfully! Transaction ID: ${txId}`);
        // Refresh bounties after action
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error(`Failed to ${action} bounty:`, err);
      alert(`Failed to ${action} bounty: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-card mx-auto max-w-3xl p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-400 text-xl text-white shadow-glow">
          🔗
        </div>
        <h2 className="mt-6 text-3xl font-semibold text-white">Connect wallet to view your bounties</h2>
        <p className="mt-3 text-sm text-white/60">
          Track progress, approve submissions, and release funds instantly once you link your wallet.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card mx-auto max-w-3xl p-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-secondary-300"></div>
        <p className="mt-4 text-sm text-white/60">Syncing your bounty states…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card mx-auto max-w-3xl p-12 text-center text-white">
        <h2 className="text-2xl font-semibold">We hit a snag loading your bounties</h2>
        <p className="mt-3 text-sm text-white/60">{error}</p>
        <button className="btn-primary mt-6" onClick={() => window.location.reload()}>
          Retry sync
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4">
        <span className="chip">Your operational cockpit</span>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Manage active bounties</h1>
            <p className="mt-2 text-sm text-white/60 md:max-w-2xl">
              Switch between creator and contributor views to approve work, unlock escrow, or trigger refunds
              with full transparency.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh bounties"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/60">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">Connected wallet</p>
              <p className="mt-1 text-white">{formatAddress(account)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-white/5 p-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/80 via-secondary-400/80 to-primary-600/80 text-white shadow-glow'
                  : 'text-white/50 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.title}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-white/55">{tabs.find((tab) => tab.id === activeTab)?.description}</p>

      {currentBounties.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 p-12 text-center text-white/60">
          <svg className="h-12 w-12 text-white/35" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h.01M14.25 9.75h.01M8.25 13.5a4.5 4.5 0 007.5 0" />
          </svg>
          <h3 className="text-lg font-semibold text-white">No {activeTab === 'created' ? 'created' : 'accepted'} bounties yet</h3>
          <p className="text-sm">
            {activeTab === 'created'
              ? 'Launch your first bounty to automate escrow flows.'
              : 'Browse open bounties and accept one to start collaborating.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentBounties.map((bounty) => {
            const statusStyle = statusStyles[bounty.status] || statusStyles.open;
            return (
              <div key={bounty.id} className="tilt-card glass-card p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="tag">Bounty #{bounty.contractId || bounty.id || '—'}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${statusStyle.badge}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white">{bounty.title}</h2>
                    <p className="text-sm text-white/60">{bounty.description}</p>
                    <div className="grid gap-3 text-sm text-white/65 md:grid-cols-2">
                      {activeTab === 'created' ? (
                        <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Freelancer</p>
                          <p className="mt-2 font-medium text-white">
                            {bounty.freelancer ? formatAddress(bounty.freelancer) : 'Not assigned'}
                          </p>
                        </div>
                      ) : (
                        <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Client</p>
                          <p className="mt-2 font-medium text-white">{formatAddress(bounty.client)}</p>
                        </div>
                      )}
                      <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-white/40">Deadline</p>
                        <p className="mt-2 font-medium text-white">{formatDate(bounty.deadline)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-right">
                      <p className="text-xs uppercase tracking-[0.32em] text-white/40">Reward</p>
                      <p className="mt-2 text-3xl font-semibold text-white">
                        {typeof bounty.amount === 'number' ? bounty.amount.toFixed(2) : parseFloat(bounty.amount || 0).toFixed(2)} ALGO
                      </p>
                      <p className="text-xs text-white/45">Secured in escrow</p>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      {activeTab === 'created' && bounty.status === 'accepted' && account === bounty.verifierAddress && (
                        <>
                          <button
                            type="button"
                            className="btn-primary text-sm"
                            onClick={() => handleAction('approve', bounty)}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Processing…' : 'Approve work'}
                          </button>
                          <button
                            type="button"
                            className="btn-outline text-sm"
                            onClick={() => handleAction('reject', bounty)}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Processing…' : 'Reject work'}
                          </button>
                        </>
                      )}
                      {activeTab === 'accepted' && bounty.status === 'approved' && account === bounty.freelancerAddress && (
                        <button
                          type="button"
                          className="btn-secondary text-sm"
                          onClick={() => handleAction('claim', bounty)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing…' : 'Claim payout'}
                        </button>
                      )}
                      {activeTab === 'created' && bounty.status === 'open' && account === bounty.clientAddress && (
                        <button
                          type="button"
                          className="btn-outline text-sm"
                          onClick={() => handleAction('refund', bounty)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing…' : 'Cancel & Refund'}
                        </button>
                      )}
                      {/* Show refund button if user is client or verifier and bounty is not claimed/refunded/rejected */}
                      {((bounty.status === 'open' || bounty.status === 'accepted') &&
                        (account === bounty.clientAddress || account === bounty.verifierAddress)) && (
                        <button
                          type="button"
                          className="btn-outline text-sm"
                          onClick={() => handleAction('refund', bounty)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing…' : 'Trigger refund'}
                        </button>
                      )}
                      {/* Show auto-refund button if deadline has passed and bounty is not claimed/refunded/rejected */}
                      {((bounty.status === 'open' || bounty.status === 'accepted') &&
                        bounty.deadline &&
                        new Date(bounty.deadline) < new Date()) && (
                        <button
                          type="button"
                          className="btn-outline text-sm"
                          onClick={() => handleAction('auto-refund', bounty)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing…' : 'Auto refund'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-white/40">Created {formatDate(bounty.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBounties;


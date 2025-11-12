import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const statusStyles = {
  open: { label: 'Open', badge: 'bg-gradient-to-r from-secondary-400/25 to-secondary-500/40 text-secondary-100 border border-secondary-300/40' },
  accepted: { label: 'Accepted', badge: 'bg-gradient-to-r from-primary-500/20 to-primary-600/40 text-primary-100 border border-primary-300/40' },
  approved: { label: 'Approved', badge: 'bg-gradient-to-r from-accent-400/25 to-accent-500/45 text-accent-50 border border-accent-300/40' },
  claimed: { label: 'Claimed', badge: 'bg-white/10 text-white/80 border border-white/20' },
  refunded: { label: 'Refunded', badge: 'bg-red-500/20 text-red-100 border border-red-400/40' },
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
    acceptBounty,
    approveBounty,
    claimBounty,
    refundBounty,
    canPerformAction,
  } = useWallet();

  const [bounties, setBounties] = useState({ created: [], accepted: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
        await loadContractState();
      } catch (err) {
        console.error('Error loading user bounties:', err);
        if (isMounted) {
          setError('Failed to load your bounties. Please try again.');
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
  }, [isConnected, account, loadContractState]);

  useEffect(() => {
    console.log('=== MyBounties useEffect START ===');
    console.log('isConnected:', isConnected);
    console.log('account:', account);
    console.log('contractState:', contractState);
    console.log('=====================================');

    if (!isConnected || !account) {
      console.log('Not connected or no account, returning early');
      return;
    }

    if (!contractState) {
      console.log('No contractState, setting empty bounties');
      setBounties({ created: [], accepted: [] });
      return;
    }

    // Skip refunded or claimed bounties
    if (contractState.status === 3 || contractState.status === 4) {
      console.log('Skipping bounty with status:', contractState.status, '(claimed or refunded)');
      setBounties({ created: [], accepted: [] });
      return;
    }

    const status =
      contractState.status === 0
        ? 'open'
        : contractState.status === 1
        ? 'accepted'
        : contractState.status === 2
        ? 'approved'
        : contractState.status === 3
        ? 'claimed'
        : 'refunded';

    const bountyData = {
      id: contractState.bountyCount,
      title: contractState.taskDescription
        ? contractState.taskDescription.slice(0, 42) + (contractState.taskDescription.length > 42 ? '…' : '')
        : 'Smart Contract Bounty',
      description: contractState.taskDescription || 'Automated escrow flow powered by Algorand smart contracts.',
      amount: contractState.amount,
      deadline: contractState.deadline,
      status,
      client: contractState.clientAddress,
      freelancer: contractState.freelancerAddress,
      verifier: contractState.verifierAddress,
      createdAt: new Date().toISOString(),
    };

    // Debug logging
    console.log('=== MyBounties Address Comparison Debug ===');
    console.log('Wallet account:', account);
    console.log('Contract clientAddress:', contractState.clientAddress);
    console.log('Contract freelancerAddress:', contractState.freelancerAddress);
    console.log('Bounty status:', contractState.status, '(' + status + ')');
    console.log('Are they equal?', account === contractState.clientAddress);
    console.log('===========================================');

    const created = account === contractState.clientAddress ? [bountyData] : [];
    const accepted = account === contractState.freelancerAddress ? [bountyData] : [];

    setBounties({ created, accepted });
  }, [contractState, isConnected, account]);

  const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatAddress = (address) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

  const currentBounties = useMemo(() => bounties[activeTab] || [], [bounties, activeTab]);

  const handleAction = async (action) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setActionLoading(true);
      let txId;

      if (action === 'accept') txId = await acceptBounty();
      if (action === 'approve') txId = await approveBounty();
      if (action === 'claim') txId = await claimBounty();
      if (action === 'refund') txId = await refundBounty();

      if (txId) {
        alert(`Action completed successfully! Transaction ID: ${txId}`);
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
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/60">
            <p className="text-xs uppercase tracking-[0.32em] text-white/40">Connected wallet</p>
            <p className="mt-1 text-white">{formatAddress(account)}</p>
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
                      <span className="tag">Bounty #{bounty.id || '—'}</span>
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
                      <p className="mt-2 text-3xl font-semibold text-white">{bounty.amount} ALGO</p>
                      <p className="text-xs text-white/45">Secured in escrow</p>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      {activeTab === 'created' && bounty.status === 'accepted' && canPerformAction('approve') && (
                        <button
                          type="button"
                          className="btn-primary text-sm"
                          onClick={() => handleAction('approve')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing…' : 'Approve work'}
                        </button>
                      )}
                      {activeTab === 'accepted' && bounty.status === 'approved' && canPerformAction('claim') && (
                        <button
                          type="button"
                          className="btn-secondary text-sm"
                          onClick={() => handleAction('claim')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing…' : 'Claim payout'}
                        </button>
                      )}
                      {canPerformAction('refund') && (
                        <button
                          type="button"
                          className="btn-outline text-sm"
                          onClick={() => handleAction('refund')}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing…' : 'Trigger refund'}
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


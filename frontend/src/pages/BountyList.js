import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const statusStyles = {
  open: { label: 'Open', badge: 'bg-gradient-to-r from-secondary-400/25 to-secondary-500/40 text-secondary-100 border border-secondary-300/40' },
  accepted: { label: 'Accepted', badge: 'bg-gradient-to-r from-primary-500/20 to-primary-600/40 text-primary-100 border border-primary-300/40' },
  approved: { label: 'Approved', badge: 'bg-gradient-to-r from-accent-400/25 to-accent-500/45 text-accent-50 border border-accent-300/40' },
  claimed: { label: 'Claimed', badge: 'bg-white/10 text-white/80 border border-white/20' },
  refunded: { label: 'Refunded', badge: 'bg-red-500/20 text-red-100 border border-red-400/40' },
};

const filters = [
  { id: 'all', label: 'All states' },
  { id: 'open', label: 'Open' },
  { id: 'accepted', label: 'In Progress' },
  { id: 'approved', label: 'Approved' },
];

const BountyList = () => {
  const { contractState, loadContractState } = useWallet();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadBounties = async () => {
      try {
        setLoading(true);
        await loadContractState();

        if (contractState) {
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
              ? contractState.taskDescription.slice(0, 40) + (contractState.taskDescription.length > 40 ? '…' : '')
              : 'Smart Contract Bounty',
            description: contractState.taskDescription || 'Unlock escrow automation with Algorand smart contracts.',
            amount: contractState.amount,
            deadline: contractState.deadline,
            status,
            client: contractState.clientAddress,
            freelancer: contractState.freelancerAddress,
            verifier: contractState.verifierAddress,
            createdAt: new Date().toISOString(),
          };

          setBounties([bountyData]);
        } else {
          setBounties([]);
        }
      } catch (error) {
        console.error('Error loading bounties:', error);
        setBounties([]);
      } finally {
        setLoading(false);
      }
    };

    loadBounties();
  }, [contractState, loadContractState]);

  const filteredBounties = useMemo(() => {
    if (filter === 'all') return bounties;
    return bounties.filter((bounty) => bounty.status === filter);
  }, [bounties, filter]);

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

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="chip">Explore programmable escrows</span>
          <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">
            Live bounties ready for trusted collaboration
          </h1>
          <p className="mt-2 text-sm text-white/60 md:max-w-2xl">
            Each bounty is backed by Algorand smart contracts. Filter by state, drill into timelines, and connect
            your wallet to accept in seconds.
          </p>
        </div>
        <Link to="/create" className="btn-primary self-start">
          Launch bounty
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1">
        {filters.map(({ id, label }) => {
          const isActive = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/80 via-secondary-400/80 to-primary-600/80 text-white shadow-glow'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass-card flex flex-col items-center gap-4 p-12 text-white/60">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-secondary-300"></div>
          <p>Syncing on-chain data…</p>
        </div>
      ) : filteredBounties.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-4 p-12 text-center text-white/60">
          <svg className="h-12 w-12 text-white/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h.01M14.25 9.75h.01M8.25 13.5a4.5 4.5 0 007.5 0" />
          </svg>
          <h3 className="text-lg font-semibold text-white">No bounties in this state (yet)</h3>
          <p className="text-sm">
            {filter === 'all'
              ? 'Be the first to launch a bounty and automate your payouts.'
              : 'Switch filters or create a new bounty tailored to your workflow.'}
          </p>
          <Link to="/create" className="btn-outline mt-2">
            Create bounty
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBounties.map((bounty) => {
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
                    <p className="text-sm text-white/65">{bounty.description}</p>
                    <div className="grid gap-3 text-sm text-white/60 md:grid-cols-2">
                      <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-white/40">Client</p>
                        <p className="mt-2 font-medium text-white">{formatAddress(bounty.client)}</p>
                      </div>
                      <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-white/40">Deadline</p>
                        <p className="mt-2 font-medium text-white">{formatDate(bounty.deadline)}</p>
                      </div>
                      {bounty.freelancer && (
                        <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Freelancer</p>
                          <p className="mt-2 font-medium text-white">{formatAddress(bounty.freelancer)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-6">
                    <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-right">
                      <p className="text-xs uppercase tracking-[0.32em] text-white/40">Reward</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{bounty.amount} ALGO</p>
                      <p className="text-xs text-white/45">Locked in escrow</p>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <Link to={`/bounty/${bounty.id}`} className="btn-outline text-sm">
                        View details
                      </Link>
                      {bounty.status === 'open' && (
                        <button type="button" className="btn-primary text-sm">
                          Accept bounty
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

export default BountyList;

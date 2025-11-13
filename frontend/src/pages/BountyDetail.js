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

  useEffect(() => {
    let isMounted = true;

    const loadBountyData = async () => {
      try {
        setLoading(true);
        // Fetch bounty from API
        const bountyData = await apiService.getBounty(id);
        if (isMounted) {
          setBounty({
            ...bountyData,
            client: bountyData.clientAddress,
            freelancer: bountyData.freelancerAddress,
            verifier: bountyData.verifierAddress,
          });
        }
      } catch (error) {
        console.error('Failed to load bounty data:', error);
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
    const bountyId = bounty.contractId || parseInt(id);
    const isVerifier = account === bounty.verifier;
    const isClient = account === bounty.client;
    const isFreelancer = account === bounty.freelancer;
    
    return [
      bounty.status === 'open' && !isClient && {
        label: 'Accept bounty',
        action: 'accept',
        handler: async () => {
          // First update backend
          await apiService.acceptBounty(bountyId);
          // Then call contract
          return await acceptBounty(bountyId);
        },
        style: 'btn-primary',
      },
      bounty.status === 'accepted' && isVerifier && {
        label: 'Approve work',
        action: 'approve',
        handler: async () => {
          // First update backend
          await apiService.approveBounty(bountyId);
          // Then call contract
          return await approveBounty(bountyId);
        },
        style: 'btn-primary',
      },
      bounty.status === 'accepted' && isVerifier && {
        label: 'Reject work',
        action: 'reject',
        handler: async () => {
          // First update backend
          await apiService.rejectBounty(bountyId);
          // Then call contract (uses refund function)
          return await rejectBounty(bountyId);
        },
        style: 'btn-outline',
      },
      bounty.status === 'approved' && isFreelancer && {
        label: 'Claim payment',
        action: 'claim',
        handler: async () => {
          // First update backend
          await apiService.claimBounty(bountyId);
          // Then call contract
          return await claimBounty(bountyId);
        },
        style: 'btn-secondary',
      },
      (bounty.status === 'open' || bounty.status === 'accepted') && (isClient || isVerifier) && {
        label: 'Initiate refund',
        action: 'refund',
        handler: async () => {
          // First update backend
          await apiService.refundBounty(bountyId);
          // Then call contract
          return await refundBounty(bountyId);
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
      alert(`Failed to ${action} bounty: ${error.message}`);
    } finally {
      setActionLoading(false);
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
              {bounty.requirements.map((requirement, index) => (
                <li key={requirement} className="flex gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-secondary-400"></span>
                  <span>{requirement}</span>
                </li>
              ))}
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
        </aside>
      </section>
    </div>
  );
};

export default BountyDetail;

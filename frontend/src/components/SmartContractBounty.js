import React, { useEffect, useMemo, useState } from 'react';
import contractUtils, { BOUNTY_STATUS } from '../utils/contractUtils';

const statusStyles = {
  [BOUNTY_STATUS.OPEN]: { label: 'Open', badge: 'bg-gradient-to-r from-secondary-400/25 to-secondary-500/40 text-secondary-100 border border-secondary-300/40' },
  [BOUNTY_STATUS.ACCEPTED]: { label: 'Accepted', badge: 'bg-gradient-to-r from-primary-500/20 to-primary-600/40 text-primary-100 border border-primary-300/40' },
  [BOUNTY_STATUS.SUBMITTED]: { label: 'Submitted', badge: 'bg-gradient-to-r from-blue-500/20 to-blue-600/40 text-blue-100 border border-blue-300/40' },
  [BOUNTY_STATUS.APPROVED]: { label: 'Approved', badge: 'bg-gradient-to-r from-accent-400/25 to-accent-500/45 text-accent-50 border border-accent-300/40' },
  [BOUNTY_STATUS.REJECTED]: { label: 'Rejected', badge: 'bg-orange-500/20 text-orange-100 border border-orange-400/40' },
};

const actions = {
  accept: {
    label: 'Accept bounty',
    buttonClass: 'btn-primary',
    handler: (address) => contractUtils.acceptBounty(address),
  },
  submit: {
    label: 'Submit work',
    buttonClass: 'btn-primary',
    handler: (address) => contractUtils.submitBounty(address),
  },
  approve: {
    label: 'Approve work',
    buttonClass: 'btn-primary',
    handler: (address) => contractUtils.approveBounty(address),
  },
  reject: {
    label: 'Reject work',
    buttonClass: 'btn-outline',
    handler: (address) => contractUtils.rejectBounty(address),
  },
  // Note: V2 contract doesn't have claim/refund actions
  // Funds transfer automatically on approve/reject
};

const SmartContractBounty = ({ bounty, userAddress, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [contractState, setContractState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContractState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounty?.contractId]);

  const loadContractState = async () => {
    try {
      const state = await contractUtils.getContractState();
      setContractState(state);
    } catch (err) {
      console.error('Failed to load contract state:', err);
      setError('Unable to sync contract state right now.');
    }
  };

  const bountyInfo = useMemo(() => {
    if (!contractState) return null;
    return {
      status: contractState.status,
      clientAddress: contractState.client_addr,
      freelancerAddress: contractState.freelancer_addr,
      verifierAddress: null, // New contract doesn't have verifier - creator only
      deadline: null, // New contract doesn't have deadline
    };
  }, [contractState]);

  const canPerform = (actionKey) => {
    if (!bountyInfo) return false;
    return contractUtils.canPerformAction(userAddress, actionKey, bountyInfo);
  };

  const handleAction = async (actionKey) => {
    const action = actions[actionKey];
    if (!action) return;

    try {
      setLoading(true);
      setError('');
      const txn = await action.handler(userAddress);
      if (txn) {
        alert(`${action.label} transaction created. Sign and submit via your wallet.`);
        await loadContractState();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(`Failed to ${actionKey} bounty:`, err);
      setError(err.message || `Unable to ${action.label.toLowerCase()} right now.`);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not assigned');

  if (!contractState) {
    return (
      <div className="glass-card p-8">
        <div className="space-y-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10"></div>
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/10"></div>
        </div>
      </div>
    );
  }

  const statusStyle = statusStyles[contractState.status] || statusStyles[BOUNTY_STATUS.OPEN];

  return (
    <div className="tilt-card glass-card p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-white">Smart contract status</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${statusStyle.badge}`}>
              {statusStyle.label}
            </span>
          </div>
          <p className="text-sm text-white/60">
            AlgoEase keeps this bounty state synced with Algorand. Every update is immutable and verifiable.
          </p>
          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/15 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-right">
          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Escrowed reward</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {(contractState.amount / 1000000).toFixed(2)} ALGO
          </p>
          <p className="text-xs text-white/45">Locked until approval or refund</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 text-sm text-white/65 md:grid-cols-2">
        <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Creator</p>
          <p className="mt-2 text-white">{formatAddress(contractState.client_addr)}</p>
        </div>
        <div className="glass-panel rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Freelancer</p>
          <p className="mt-2 text-white">{formatAddress(contractState.freelancer_addr)}</p>
        </div>
      </div>

      {contractState.task_desc && (
        <div className="mt-6 glass-panel rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/65">
          <p className="text-xs uppercase tracking-[0.32em] text-white/40">Contract task description</p>
          <p className="mt-2 whitespace-pre-line text-white/70">{contractState.task_desc}</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {Object.keys(actions)
          .filter((key) => canPerform(key))
          .map((key) => {
            const action = actions[key];
            return (
              <button
                key={key}
                type="button"
                className={`${action.buttonClass} text-sm`}
                onClick={() => handleAction(key)}
                disabled={loading}
              >
                {loading ? 'Processing…' : action.label}
              </button>
            );
          })}
        {Object.keys(actions).filter((key) => canPerform(key)).length === 0 && (
          <span className="text-xs text-white/45">No contract actions available for your wallet at this stage.</span>
        )}
      </div>

      <div className="mt-6 text-xs text-white/35">
        <p>App ID: {contractUtils.getAppId()}</p>
        <p>
          Bounty Count: {contractState.bounty_count || '—'} • Raw status:{' '}
          {contractState.status}
        </p>
      </div>
    </div>
  );
};

export default SmartContractBounty;


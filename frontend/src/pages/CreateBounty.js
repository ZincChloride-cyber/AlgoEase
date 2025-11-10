import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

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
  const { isConnected, account, createBounty, contractState } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    deadline: '',
    verifier: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (contractState && contractState.status !== 3 && contractState.status !== 4) {
      alert('There is already an active bounty. Please wait for it to be completed or refunded.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const verifierAddress = formData.verifier || account;

      const txId = await createBounty(
        parseFloat(formData.amount),
        formData.deadline,
        formData.description,
        verifierAddress
      );

      setFormData({
        title: '',
        description: '',
        amount: '',
        deadline: '',
        verifier: '',
      });

      alert(`Bounty created successfully! Transaction ID: ${txId}`);
      window.location.href = '/bounties';
    } catch (error) {
      console.error('Error creating bounty:', error);
      setSubmitError(error.message || 'Failed to create bounty. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Deploy bounty'}
            </button>
            <button
              type="button"
              className="btn-outline flex-1"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
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

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CONTRACT_APP_ID = parseInt(process.env.REACT_APP_CONTRACT_APP_ID, 10) || 749570296;

const highlightStats = [
  { label: 'Avg settlement', value: '4.5s', detail: 'Payment confirmation on Algorand TestNet' },
  { label: 'Network fees', value: '<0.001 ALGO', detail: 'Typical cost per contract call' },
  { label: 'Automation', value: 'End-to-end', detail: 'State changes enforced by smart contracts' },
];

const featureBlocks = [
  {
    title: 'Launch in minutes',
    description: 'Define deliverables, stake ALGO, and choose a verifier with a guided, distraction-free flow.',
    iconPath: 'M5 12h14M12 5v14',
  },
  {
    title: 'Stay on top effortlessly',
    description: 'See every bounty at a glance with realtime status, completion progress, and recent actions.',
    iconPath: 'M12 6v6l3 3M5 12a7 7 0 1114 0 7 7 0 01-14 0z',
  },
  {
    title: 'Automate trust',
    description: 'Escrow logic lives on-chain. Approvals, refunds, and payouts execute exactly as defined.',
    iconPath: 'M12 4l7 4v8l-7 4-7-4V8l7-4z',
  },
];

const flowSteps = [
  {
    id: 'Step 01',
    title: 'Set the intent',
    detail: 'Share the brief, add acceptance criteria, and confirm reward and timeline in a single sitting.',
  },
  {
    id: 'Step 02',
    title: 'Invite wallets',
    detail: 'Contributors opt in with one click. Each action is tracked so everyone stays aligned.',
  },
  {
    id: 'Step 03',
    title: 'Approve and release',
    detail: 'Once requirements are met, confirm and let the contract release escrow instantly.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const container = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.1, staggerChildren: 0.12 },
  },
};

const Home = () => {
  return (
    <div className="space-y-24 pb-16">
      <motion.section
        className="glass-card relative overflow-hidden p-8 md:p-12"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-white/5" />
        <motion.div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
          <motion.div className="space-y-8 lg:flex-1" variants={fadeUp}>
            <span className="chip">Algorand-powered freelancing</span>
            <h1 className="headline text-balance text-4xl md:text-5xl lg:text-6xl">
              Build a freelance marketplace that pays out through trusted Algorand escrows.
            </h1>
            <p className="subheadline max-w-xl text-white/75">
              AlgoEase lets clients publish briefs, freelancers submit work, and smart contracts release rewards the
              moment approvals land—no middlemen, just transparent collaboration.
            </p>
            <motion.div className="flex flex-col gap-3 sm:flex-row" variants={fadeUp}>
              <Link to="/create" className="btn-primary sm:px-9 sm:py-3">
                Create a bounty
              </Link>
              <Link to="/bounties" className="btn-outline sm:px-9 sm:py-3">
                Browse live bounties
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative mt-6 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6"
            variants={fadeUp}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-indigo-500/10" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-white/45">
                <span>Snapshot</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/60">
                  Live sync
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Bounty · Launch new landing page</span>
                  <span>Active</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-white">Design refresh and content rollout</h3>
                <p className="mt-2 text-sm text-white/65">
                  Contributors collaborate in a shared checklist. Progress and approvals stay in sync automatically.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {highlightStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">{stat.label}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/65 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-white/40">Contract app id</p>
                  <p className="mt-1 text-lg font-semibold text-white">{CONTRACT_APP_ID}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-white/40">Network</p>
                  <p className="mt-1 font-semibold text-white/70">Algorand TestNet</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        className="space-y-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={container}
      >
        <div className="space-y-3">
          <span className="chip">Designed for flow</span>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">Everything you need, nothing you don’t.</h2>
          <p className="max-w-2xl text-sm text-white/65 md:text-base">
            The interface stays quiet so your team can focus. Each feature block does one job—launch, monitor, or close
            out bounties—without competing for attention.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featureBlocks.map((feature) => (
            <motion.div
              key={feature.title}
              className="glass-panel h-full space-y-5 p-6 transition-transform hover:-translate-y-1"
              variants={fadeUp}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={feature.iconPath} />
                </svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-white/65">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="glass-card flex flex-col gap-10 p-8 md:flex-row md:items-center md:justify-between md:p-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={container}
      >
        <motion.div className="space-y-4 md:max-w-xl" variants={fadeUp}>
          <span className="chip">Three clear steps</span>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">A calmer bounty lifecycle from start to payout.</h2>
          <p className="text-sm text-white/65 md:text-base">
            AlgoEase keeps the flow linear: draft the bounty, let contributors commit, then approve once the work meets
            expectations. Each stage is tracked, logged, and auditable.
          </p>
        </motion.div>
        <motion.div className="grid w-full gap-4 md:max-w-lg" variants={fadeUp}>
          {flowSteps.map((step) => (
            <div key={step.id} className="glass-panel flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              <span className="text-xs uppercase tracking-[0.32em] text-white/45">{step.id}</span>
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-white/65">{step.detail}</p>
            </div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className="glass-card relative overflow-hidden p-10 text-center md:p-14"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.45 }}
        variants={container}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/15 via-transparent to-indigo-500/20" />
        <motion.div className="relative space-y-6" variants={fadeUp}>
          <span className="chip mx-auto">Ready when you are</span>
          <h2 className="text-4xl font-semibold text-white md:text-5xl">
            Launch your first Algorand bounty with confidence.
          </h2>
          <p className="subheadline mx-auto max-w-2xl text-white/75">
            Connect a wallet, choose a verifier, and publish. From there, AlgoEase handles the ceremony—tracking
            participation, enforcing deadlines, and paying out instantly.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link to="/create" className="btn-primary sm:px-10 sm:py-3">
              Start a bounty
            </Link>
            <Link to="/bounties" className="btn-secondary sm:px-10 sm:py-3">
              See it in action
            </Link>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default Home;

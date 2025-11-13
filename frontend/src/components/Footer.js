import React from 'react';
import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Overview', to: '/' },
  { label: 'Browse Bounties', to: '/bounties' },
  { label: 'Create Bounty', to: '/create' },
  { label: 'My Bounties', to: '/my-bounties' },
];

const resources = [
  { label: 'Deployment Guide', href: 'https://github.com/' },
  { label: 'Smart Contract Docs', href: 'https://github.com/' },
  { label: 'Security Model', href: 'https://github.com/' },
  { label: 'Support', href: 'mailto:support@algoease.xyz' },
];

const Footer = () => {
  return (
    <footer className="relative z-10 mt-auto">
      <div className="glass-card overflow-hidden px-6 py-10 md:px-10 md:py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr,1fr] md:items-start">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                AE
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold text-white">AlgoEase</span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">Algorand Bounties</span>
              </div>
            </div>
            <p className="max-w-lg text-sm text-white/65">
              AlgoEase helps teams move faster with on-chain escrow. Launch bounties, invite contributors, and settle
              automatically—without adding operational overhead.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Product</h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
                {quickLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">Resources</h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
                {resources.map((resource) => (
                  <a
                    key={resource.label}
                    href={resource.href}
                    target={resource.href.startsWith('mailto:') ? '_self' : '_blank'}
                    rel="noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    {resource.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="divider-gradient my-8"></div>

        <div className="flex flex-col gap-4 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} AlgoEase. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
              GitHub
            </a>
            <a href="mailto:security@algoease.xyz" className="transition-colors hover:text-white">
              Responsible Disclosure
            </a>
            <a href="mailto:hello@algoease.xyz" className="transition-colors hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnection from './WalletConnection';

const navLinks = [
  { label: 'Overview', to: '/' },
  { label: 'Browse Bounties', to: '/bounties' },
  { label: 'Create Bounty', to: '/create' },
  { label: 'My Bounties', to: '/my-bounties' },
];

const Header = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-400 ${
        isScrolled ? 'backdrop-blur-xl bg-black/35 border-b border-white/10' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-5">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white transition-transform duration-300 group-hover:-translate-y-0.5">
              AE
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-white">AlgoEase</span>
              <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">Algorand Bounties</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/20 px-1 py-1 lg:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex">
            <WalletConnection />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/75 transition-all duration-300 hover:bg-white/10 lg:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 7h16M4 12h16M4 17h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="px-4 pb-6 pt-2 sm:px-6">
            <div className="glass-panel space-y-4 p-4">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'border-white/15 bg-white/10 text-white'
                          : 'border-white/5 bg-white/5 text-white/70 hover:border-white/15 hover:text-white'
                      }`}
                    >
                      {link.label}
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
              <div className="divider-gradient"></div>
              <div className="flex justify-center">
                <WalletConnection />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

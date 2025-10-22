import React from 'react';
import { Link } from 'react-router-dom';
import WalletConnection from './WalletConnection';

const Header = () => {

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AE</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AlgoEase</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                to="/bounties" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Browse Bounties
              </Link>
              <Link 
                to="/create" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Create Bounty
              </Link>
              <Link 
                to="/my-bounties" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                My Bounties
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <WalletConnection />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

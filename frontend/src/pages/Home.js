import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Trustless Escrow for
          <span className="text-primary-600"> Freelance Payments</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          AlgoEase replaces human middlemen with smart contracts, enabling fast, 
          secure, and transparent payments between clients and freelancers on Algorand.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create" className="btn-primary text-lg px-8 py-3">
            Create Your First Bounty
          </Link>
          <Link to="/bounties" className="btn-outline text-lg px-8 py-3">
            Browse Available Bounties
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 py-16">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3">Trustless Escrow</h3>
          <p className="text-gray-600">
            Funds are locked in smart contracts until predefined conditions are met. 
            No need to trust third parties.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3">Instant Settlement</h3>
          <p className="text-gray-600">
            Algorand's fast finality ensures payments are processed instantly 
            with minimal fees (~0.001 ALGO per transaction).
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3">Automatic Payouts</h3>
          <p className="text-gray-600">
            Smart contracts automatically release payments when work is approved 
            or refund clients if conditions aren't met.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2">Create Bounty</h3>
            <p className="text-gray-600 text-sm">
              Client creates a task with description, amount, and deadline. 
              Funds are deposited into escrow.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2">Accept Task</h3>
            <p className="text-gray-600 text-sm">
              Freelancer accepts the task and commits to completing it 
              by the specified deadline.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2">Submit Work</h3>
            <p className="text-gray-600 text-sm">
              Freelancer submits completed work for review by the 
              client or designated verifier.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2">Get Paid</h3>
            <p className="text-gray-600 text-sm">
              Upon approval, funds are automatically released to the freelancer. 
              If rejected, client gets refunded.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-8">Why Choose AlgoEase?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">~0.001 ALGO</div>
            <div className="text-gray-600">Transaction Fees</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">~4.5s</div>
            <div className="text-gray-600">Finality Time</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
            <div className="text-gray-600">Decentralized</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

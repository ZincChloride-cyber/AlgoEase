import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const BountyList = () => {
  const { contractState, loadContractState, isLoadingContract } = useWallet();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Load contract state and convert to bounty format
  useEffect(() => {
    const loadBounties = async () => {
      try {
        setLoading(true);
        await loadContractState();
        
        if (contractState) {
          const bountyData = {
            id: contractState.bountyCount,
            title: 'Smart Contract Bounty',
            description: contractState.taskDescription,
            amount: contractState.amount,
            deadline: contractState.deadline,
            status: contractState.status === 0 ? 'open' : 
                   contractState.status === 1 ? 'accepted' :
                   contractState.status === 2 ? 'approved' :
                   contractState.status === 3 ? 'claimed' : 'refunded',
            client: contractState.clientAddress,
            freelancer: contractState.freelancerAddress,
            verifier: contractState.verifierAddress,
            createdAt: new Date().toISOString()
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'claimed': return 'bg-gray-100 text-gray-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const filteredBounties = bounties.filter(bounty => {
    if (filter === 'all') return true;
    return bounty.status === filter;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bounties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Bounties</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'open' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'accepted' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            In Progress
          </button>
        </div>
      </div>

      {filteredBounties.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No bounties found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No bounties have been created yet.' 
              : `No bounties with status "${filter}" found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBounties.map((bounty) => (
            <div key={bounty.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{bounty.title}</h3>
                  <p className="text-gray-600 mb-4">{bounty.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {bounty.amount} ALGO
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bounty.status)}`}>
                    {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <div>
                  <span className="font-medium">Client:</span> {formatAddress(bounty.client)}
                </div>
                <div>
                  <span className="font-medium">Deadline:</span> {formatDate(bounty.deadline)}
                </div>
              </div>

              {bounty.freelancer && (
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium">Freelancer:</span> {formatAddress(bounty.freelancer)}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Created {formatDate(bounty.createdAt)}
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/bounty/${bounty.id}`}
                    className="btn-outline text-sm"
                  >
                    View Details
                  </Link>
                  {bounty.status === 'open' && (
                    <button className="btn-primary text-sm">
                      Accept Bounty
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BountyList;

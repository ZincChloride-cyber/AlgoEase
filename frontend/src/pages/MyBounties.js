import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

const MyBounties = () => {
  const { isConnected } = useWallet();
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created');

  // Mock data for demonstration
  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    const mockBounties = {
      created: [
        {
          id: 1,
          title: 'Build a React Dashboard Component',
          description: 'Create a responsive dashboard component with charts and data visualization.',
          amount: 15.5,
          deadline: '2024-02-15T23:59:59Z',
          status: 'accepted',
          freelancer: '0x1111...2222',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          title: 'Smart Contract Security Audit',
          description: 'Perform a comprehensive security audit of our PyTeal smart contract.',
          amount: 50.0,
          deadline: '2024-02-20T23:59:59Z',
          status: 'open',
          createdAt: '2024-01-10T14:30:00Z'
        }
      ],
      accepted: [
        {
          id: 3,
          title: 'Frontend Wallet Integration',
          description: 'Integrate Pera Wallet and WalletConnect into our React frontend.',
          amount: 25.0,
          deadline: '2024-02-10T23:59:59Z',
          status: 'approved',
          client: '0x5555...6666',
          createdAt: '2024-01-05T09:15:00Z'
        }
      ]
    };

    setTimeout(() => {
      setBounties(mockBounties);
      setLoading(false);
    }, 1000);
  }, [isConnected]);

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

  const handleAction = (bountyId, action) => {
    console.log(`Performing ${action} on bounty ${bountyId}`);
    // TODO: Implement smart contract interactions
    alert(`${action} action will be implemented with smart contract integration`);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            You need to connect your wallet to view your bounties.
          </p>
          <button className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bounties...</p>
        </div>
      </div>
    );
  }

  const currentBounties = bounties[activeTab] || [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Bounties</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'created'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Created by Me ({bounties.created?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'accepted'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Accepted by Me ({bounties.accepted?.length || 0})
        </button>
      </div>

      {/* Bounties List */}
      {currentBounties.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No {activeTab} bounties
          </h3>
          <p className="text-gray-500">
            {activeTab === 'created' 
              ? 'You haven\'t created any bounties yet.' 
              : 'You haven\'t accepted any bounties yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentBounties.map((bounty) => (
            <div key={bounty.id} className="card">
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
                  {activeTab === 'created' ? (
                    <>
                      <span className="font-medium">Freelancer:</span> {bounty.freelancer ? formatAddress(bounty.freelancer) : 'Not assigned'}
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Client:</span> {formatAddress(bounty.client)}
                    </>
                  )}
                </div>
                <div>
                  <span className="font-medium">Deadline:</span> {formatDate(bounty.deadline)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Created {formatDate(bounty.createdAt)}
                </div>
                <div className="flex space-x-2">
                  {activeTab === 'created' && bounty.status === 'accepted' && (
                    <>
                      <button
                        onClick={() => handleAction(bounty.id, 'approve')}
                        className="btn-secondary text-sm"
                      >
                        Approve Work
                      </button>
                      <button
                        onClick={() => handleAction(bounty.id, 'reject')}
                        className="btn-outline text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {activeTab === 'accepted' && bounty.status === 'approved' && (
                    <button
                      onClick={() => handleAction(bounty.id, 'claim')}
                      className="btn-primary text-sm"
                    >
                      Claim Payment
                    </button>
                  )}
                  {bounty.status === 'open' && activeTab === 'created' && (
                    <button
                      onClick={() => handleAction(bounty.id, 'cancel')}
                      className="btn-outline text-sm"
                    >
                      Cancel Bounty
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

export default MyBounties;

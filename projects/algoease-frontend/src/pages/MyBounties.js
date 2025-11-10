import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

const MyBounties = () => {
  const { 
    isConnected, 
    account, 
    contractState, 
    loadContractState, 
    isLoadingContract,
    acceptBounty,
    approveBounty,
    claimBounty,
    refundBounty,
    canPerformAction
  } = useWallet();
  const [bounties, setBounties] = useState({ created: [], accepted: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load contract state and organize bounties by user role
  useEffect(() => {
    const loadUserBounties = async () => {
      if (!isConnected || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
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

          // Organize bounties by user role
          const created = account === contractState.clientAddress ? [bountyData] : [];
          const accepted = account === contractState.freelancerAddress ? [bountyData] : [];

          setBounties({ created, accepted });
        } else {
          setBounties({ created: [], accepted: [] });
        }
      } catch (error) {
        console.error('Error loading user bounties:', error);
        setError('Failed to load your bounties. Please try again.');
        setBounties({ created: [], accepted: [] });
      } finally {
        setLoading(false);
      }
    };

    loadUserBounties();
  }, [isConnected, account, contractState, loadContractState]);

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

  const handleAction = async (bountyId, action) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setActionLoading(true);
      let txId;

      switch (action) {
        case 'accept':
          txId = await acceptBounty();
          break;
        case 'approve':
          txId = await approveBounty();
          break;
        case 'claim':
          txId = await claimBounty();
          break;
        case 'refund':
          txId = await refundBounty();
          break;
        default:
          throw new Error('Unknown action');
      }

      alert(`${action} action completed successfully! Transaction ID: ${txId}`);
    } catch (error) {
      console.error(`Failed to ${action} bounty:`, error);
      alert(`Failed to ${action} bounty: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Error Loading Bounties</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
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
                  {activeTab === 'created' && bounty.status === 'accepted' && canPerformAction('approve') && (
                    <button
                      onClick={() => handleAction(bounty.id, 'approve')}
                      className="btn-secondary text-sm"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Approve Work'}
                    </button>
                  )}
                  {activeTab === 'accepted' && bounty.status === 'approved' && canPerformAction('claim') && (
                    <button
                      onClick={() => handleAction(bounty.id, 'claim')}
                      className="btn-primary text-sm"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Claim Payment'}
                    </button>
                  )}
                  {canPerformAction('refund') && (
                    <button
                      onClick={() => handleAction(bounty.id, 'refund')}
                      className="btn-outline text-sm"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Refund Bounty'}
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

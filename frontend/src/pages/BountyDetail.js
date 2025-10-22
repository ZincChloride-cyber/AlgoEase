import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import contractUtils from '../utils/contractUtils';

const BountyDetail = () => {
  const { id } = useParams();
  const { 
    account, 
    isConnected, 
    contractState, 
    isLoadingContract,
    loadContractState,
    acceptBounty,
    approveBounty,
    claimBounty,
    refundBounty,
    canPerformAction
  } = useWallet();
  const [bounty, setBounty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Load contract state and set bounty data
  useEffect(() => {
    const loadBountyData = async () => {
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
            status: contractUtils.getStatusName(contractState.status),
            client: contractState.clientAddress,
            freelancer: contractState.freelancerAddress,
            verifier: contractState.verifierAddress,
            createdAt: new Date().toISOString(),
            requirements: [
              'Complete the task as described',
              'Submit work for verification',
              'Meet the deadline requirements'
            ],
            submissions: []
          };
          setBounty(bountyData);
        } else {
          setBounty(null);
        }
      } catch (error) {
        console.error('Failed to load bounty data:', error);
        setBounty(null);
      } finally {
        setLoading(false);
      }
    };

    loadBountyData();
  }, [id, contractState, loadContractState]);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleAcceptBounty = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!canPerformAction('accept')) {
      alert('You cannot accept this bounty at this time');
      return;
    }

    try {
      setActionLoading(true);
      const txId = await acceptBounty();
      alert(`Bounty accepted successfully! Transaction ID: ${txId}`);
    } catch (error) {
      console.error('Failed to accept bounty:', error);
      alert('Failed to accept bounty: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveBounty = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!canPerformAction('approve')) {
      alert('You cannot approve this bounty at this time');
      return;
    }

    try {
      setActionLoading(true);
      const txId = await approveBounty();
      alert(`Bounty approved successfully! Transaction ID: ${txId}`);
    } catch (error) {
      console.error('Failed to approve bounty:', error);
      alert('Failed to approve bounty: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimBounty = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!canPerformAction('claim')) {
      alert('You cannot claim this bounty at this time');
      return;
    }

    try {
      setActionLoading(true);
      const txId = await claimBounty();
      alert(`Bounty claimed successfully! Transaction ID: ${txId}`);
    } catch (error) {
      console.error('Failed to claim bounty:', error);
      alert('Failed to claim bounty: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundBounty = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!canPerformAction('refund')) {
      alert('You cannot refund this bounty at this time');
      return;
    }

    try {
      setActionLoading(true);
      const txId = await refundBounty();
      alert(`Bounty refunded successfully! Transaction ID: ${txId}`);
    } catch (error) {
      console.error('Failed to refund bounty:', error);
      alert('Failed to refund bounty: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bounty details...</p>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Bounty Not Found</h2>
        <p className="text-gray-600">The requested bounty could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{bounty.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Created by {formatAddress(bounty.client)}</span>
              <span>•</span>
              <span>Created {formatDate(bounty.createdAt)}</span>
              <span>•</span>
              <span>Deadline: {formatDate(bounty.deadline)}</span>
            </div>
          </div>
          <div className="text-right ml-6">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {bounty.amount} ALGO
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bounty.status)}`}>
              {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {bounty.status === 'open' && canPerformAction('accept') && (
            <button
              onClick={handleAcceptBounty}
              className="btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Accept Bounty'}
            </button>
          )}
          {bounty.status === 'accepted' && canPerformAction('approve') && (
            <button
              onClick={handleApproveBounty}
              className="btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Approve Work'}
            </button>
          )}
          {bounty.status === 'approved' && canPerformAction('claim') && (
            <button
              onClick={handleClaimBounty}
              className="btn-secondary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Claim Payment'}
            </button>
          )}
          {canPerformAction('refund') && (
            <button
              onClick={handleRefundBounty}
              className="btn-outline"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Refund Bounty'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-line">{bounty.description}</p>
        </div>
      </div>

      {/* Requirements */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Requirements</h2>
        <ul className="space-y-2">
          {bounty.requirements.map((requirement, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary-600 mr-2">•</span>
              <span className="text-gray-700">{requirement}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Timeline</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-600 rounded-full mr-3"></div>
            <div>
              <div className="font-medium">Bounty Created</div>
              <div className="text-sm text-gray-500">{formatDate(bounty.createdAt)}</div>
            </div>
          </div>
          
          {bounty.status !== 'open' && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
              <div>
                <div className="font-medium">Bounty Accepted</div>
                <div className="text-sm text-gray-500">By freelancer</div>
              </div>
            </div>
          )}
          
          {bounty.status === 'approved' && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
              <div>
                <div className="font-medium">Work Approved</div>
                <div className="text-sm text-gray-500">Ready for payment</div>
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
            <div>
              <div className="font-medium">Deadline</div>
              <div className="text-sm text-gray-500">{formatDate(bounty.deadline)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions (if any) */}
      {bounty.submissions && bounty.submissions.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Submissions</h2>
          <div className="space-y-4">
            {bounty.submissions.map((submission, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">Submission #{index + 1}</div>
                  <span className="text-sm text-gray-500">
                    {formatDate(submission.submittedAt)}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{submission.description}</p>
                <div className="flex space-x-2">
                  <a
                    href={submission.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    View Work
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BountyDetail;

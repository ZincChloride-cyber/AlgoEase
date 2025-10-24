import React, { useState, useEffect } from 'react';
import contractUtils from '../utils/contractUtils';
import { CONTRACT_METHODS, BOUNTY_STATUS } from '../utils/contractUtils';

const SmartContractBounty = ({ bounty, userAddress, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [contractState, setContractState] = useState(null);
  const [error, setError] = useState(null);

  // Load contract state on component mount
  useEffect(() => {
    loadContractState();
  }, [bounty.contractId]);

  const loadContractState = async () => {
    try {
      const state = await contractUtils.getContractState();
      setContractState(state);
    } catch (error) {
      console.error('Failed to load contract state:', error);
    }
  };

  const handleSmartContractAction = async (action) => {
    setLoading(true);
    setError(null);

    try {
      let transaction;

      switch (action) {
        case 'create_bounty':
          // This would be handled in the CreateBounty component
          break;

        case 'accept_bounty':
          transaction = await contractUtils.acceptBounty(userAddress);
          break;

        case 'approve_bounty':
          transaction = await contractUtils.approveBounty(userAddress);
          break;

        case 'claim':
          transaction = await contractUtils.claimBounty(userAddress);
          break;

        case 'refund':
          transaction = await contractUtils.refundBounty(userAddress);
          break;

        case 'auto_refund':
          transaction = await contractUtils.autoRefundBounty(userAddress);
          break;

        default:
          throw new Error('Unknown action');
      }

      if (transaction) {
        // Here you would integrate with Pera Wallet to sign and submit
        console.log('Transaction created:', transaction);
        
        // For now, just show success message
        alert(`${action} transaction created successfully!`);
        
        // Reload contract state
        await loadContractState();
        
        // Notify parent component
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const canPerformAction = (action) => {
    if (!contractState) return false;
    
    const bountyInfo = {
      status: contractState.status,
      clientAddress: contractState.client_addr,
      freelancerAddress: contractState.freelancer_addr,
      verifierAddress: contractState.verifier_addr,
      deadline: new Date(contractState.deadline * 1000)
    };

    return contractUtils.canPerformAction(userAddress, action, bountyInfo);
  };

  const getStatusName = (statusCode) => {
    switch (statusCode) {
      case BOUNTY_STATUS.OPEN: return 'Open';
      case BOUNTY_STATUS.ACCEPTED: return 'Accepted';
      case BOUNTY_STATUS.APPROVED: return 'Approved';
      case BOUNTY_STATUS.CLAIMED: return 'Claimed';
      case BOUNTY_STATUS.REFUNDED: return 'Refunded';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (statusCode) => {
    switch (statusCode) {
      case BOUNTY_STATUS.OPEN: return 'bg-green-100 text-green-800';
      case BOUNTY_STATUS.ACCEPTED: return 'bg-blue-100 text-blue-800';
      case BOUNTY_STATUS.APPROVED: return 'bg-purple-100 text-purple-800';
      case BOUNTY_STATUS.CLAIMED: return 'bg-gray-100 text-gray-800';
      case BOUNTY_STATUS.REFUNDED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!contractState) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Smart Contract Status
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contractState.status)}`}>
          {getStatusName(contractState.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-500">Amount</label>
          <p className="text-lg font-semibold text-gray-900">
            {(contractState.amount / 1000000).toFixed(2)} ALGO
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Deadline</label>
          <p className="text-sm text-gray-900">
            {new Date(contractState.deadline * 1000).toLocaleDateString()}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Client</label>
          <p className="text-sm text-gray-900 font-mono">
            {contractState.client_addr ? `${contractState.client_addr.slice(0, 6)}...${contractState.client_addr.slice(-4)}` : 'N/A'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Freelancer</label>
          <p className="text-sm text-gray-900 font-mono">
            {contractState.freelancer_addr ? `${contractState.freelancer_addr.slice(0, 6)}...${contractState.freelancer_addr.slice(-4)}` : 'N/A'}
          </p>
        </div>
      </div>

      {contractState.task_desc && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-500">Task Description</label>
          <p className="text-sm text-gray-900 mt-1">{contractState.task_desc}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canPerformAction('accept_bounty') && (
          <button
            onClick={() => handleSmartContractAction('accept_bounty')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Accept Bounty'}
          </button>
        )}

        {canPerformAction('approve_bounty') && (
          <button
            onClick={() => handleSmartContractAction('approve_bounty')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Approve Work'}
          </button>
        )}

        {canPerformAction('claim') && (
          <button
            onClick={() => handleSmartContractAction('claim')}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Claim Payment'}
          </button>
        )}

        {canPerformAction('refund') && (
          <button
            onClick={() => handleSmartContractAction('refund')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Refund'}
          </button>
        )}

        {canPerformAction('auto_refund') && (
          <button
            onClick={() => handleSmartContractAction('auto_refund')}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Auto Refund'}
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Contract Address: {contractUtils.getAppId()}</p>
        <p>Status: {contractState.status} | Count: {contractState.bounty_count}</p>
      </div>
    </div>
  );
};

export default SmartContractBounty;

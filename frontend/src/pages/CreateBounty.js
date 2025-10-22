import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const CreateBounty = () => {
  const { isConnected, account, createBounty, contractState } = useWallet();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    deadline: '',
    verifier: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    // Check if there's already an active bounty
    if (contractState && contractState.status !== 3 && contractState.status !== 4) {
      alert('There is already an active bounty. Please wait for it to be completed or refunded.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const verifierAddress = formData.verifier || account;
      
      const txId = await createBounty(
        parseFloat(formData.amount),
        formData.deadline,
        formData.description,
        verifierAddress
      );
      
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        amount: '',
        deadline: '',
        verifier: ''
      });
      
      alert(`Bounty created successfully! Transaction ID: ${txId}`);
      // Redirect to bounties list
      window.location.href = '/bounties';
      
    } catch (error) {
      console.error('Error creating bounty:', error);
      setSubmitError(error.message || 'Failed to create bounty. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            You need to connect your wallet to create a bounty.
          </p>
          <button className="btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Create New Bounty</h1>
        
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{submitError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Bounty Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Build a React component"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Task Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Describe the task in detail..."
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (ALGO)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="input-field"
              placeholder="10"
              min="0.001"
              step="0.001"
              required
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="verifier" className="block text-sm font-medium text-gray-700 mb-2">
              Verifier Address (Optional)
            </label>
            <input
              type="text"
              id="verifier"
              name="verifier"
              value={formData.verifier}
              onChange={handleChange}
              className="input-field"
              placeholder="Algorand address of verifier (leave empty to verify yourself)"
            />
            <p className="text-sm text-gray-500 mt-1">
              The verifier will approve or reject the completed work. 
              If empty, you will be the verifier.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Bounty'}
            </button>
            <button
              type="button"
              className="btn-outline flex-1"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBounty;

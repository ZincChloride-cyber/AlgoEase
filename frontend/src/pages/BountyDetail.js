import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const BountyDetail = () => {
  const { id } = useParams();
  const { account, isConnected } = useWallet();
  const [bounty, setBounty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockBounty = {
      id: parseInt(id),
      title: 'Build a React Dashboard Component',
      description: 'Create a responsive dashboard component with charts and data visualization using React and Tailwind CSS. The component should include:\n\n- Real-time data updates\n- Interactive charts using Chart.js\n- Responsive design for mobile and desktop\n- Dark/light theme toggle\n- Export functionality for reports\n\nPlease ensure the code is well-documented and follows React best practices.',
      amount: 15.5,
      deadline: '2024-02-15T23:59:59Z',
      status: 'open',
      client: '0x1234567890abcdef1234567890abcdef12345678',
      createdAt: '2024-01-15T10:00:00Z',
      requirements: [
        'React 18+ with TypeScript',
        'Tailwind CSS for styling',
        'Chart.js for data visualization',
        'Responsive design',
        'Clean, documented code'
      ],
      submissions: []
    };

    setTimeout(() => {
      setBounty(mockBounty);
      setLoading(false);
    }, 1000);
  }, [id]);

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

  const handleAcceptBounty = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    console.log('Accepting bounty:', id);
    alert('Bounty acceptance will be implemented with smart contract integration');
  };

  const handleSubmitWork = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    console.log('Submitting work for bounty:', id);
    alert('Work submission will be implemented with smart contract integration');
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
          {bounty.status === 'open' && (
            <button
              onClick={handleAcceptBounty}
              className="btn-primary"
            >
              Accept Bounty
            </button>
          )}
          {bounty.status === 'accepted' && account === bounty.freelancer && (
            <button
              onClick={handleSubmitWork}
              className="btn-primary"
            >
              Submit Work
            </button>
          )}
          {bounty.status === 'approved' && account === bounty.freelancer && (
            <button
              onClick={() => console.log('Claim payment')}
              className="btn-secondary"
            >
              Claim Payment
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

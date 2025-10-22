// API service for AlgoEase frontend-backend communication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Bounty endpoints
  async getBounties(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/bounties?${queryString}` : '/bounties';
    return this.request(endpoint);
  }

  async getBounty(id) {
    return this.request(`/bounties/${id}`);
  }

  async createBounty(bountyData) {
    return this.request('/bounties', {
      method: 'POST',
      body: JSON.stringify(bountyData),
    });
  }

  async updateBounty(id, updateData) {
    return this.request(`/bounties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async submitWork(bountyId, submissionData) {
    return this.request(`/bounties/${bountyId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getUserBounties(address, type = 'all') {
    return this.request(`/bounties/user/${address}?type=${type}`);
  }

  // Contract endpoints
  async getContractInfo(contractId) {
    return this.request(`/contracts/${contractId}`);
  }

  async getContractState(contractId) {
    return this.request(`/contracts/${contractId}/state`);
  }

  async getTransactionParams() {
    return this.request('/contracts/params');
  }

  async simulateTransaction(transaction) {
    return this.request('/contracts/simulate', {
      method: 'POST',
      body: JSON.stringify({ transaction }),
    });
  }

  // Authentication helpers
  setAuthToken(token) {
    localStorage.setItem('authToken', token);
  }

  removeAuthToken() {
    localStorage.removeItem('authToken');
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

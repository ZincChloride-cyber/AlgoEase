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
      console.log('🔐 Added auth token to request');
    } else {
      console.warn('⚠️ No auth token found in localStorage');
    }

    console.log(`🌐 Making API request to: ${url}`);
    console.log('📋 Request config:', {
      method: config.method || 'GET',
      headers: config.headers,
      hasBody: !!config.body
    });

    try {
      const response = await fetch(url, config);
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API error response:', errorData);
        const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.response = errorData;
        throw error;
      }

      const data = await response.json();
      console.log('✅ API response received:', data);
      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      if (error.message) {
        console.error('❌ Error message:', error.message);
      }
      throw error;
    }
  }

  // Health check (note: health endpoint is not under /api prefix)
  async healthCheck() {
    const baseUrl = this.baseURL.replace('/api', '');
    const url = `${baseUrl}/health`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }

  // Bounty endpoints
  async getBounties(params = {}) {
    // Remove undefined/null values from params to avoid sending them in query string
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = queryString ? `/bounties?${queryString}` : '/bounties';
    console.log('🔍 getBounties called with params:', params, '-> cleaned:', cleanParams, '-> endpoint:', endpoint);
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

  async acceptBounty(bountyId) {
    return this.request(`/bounties/${bountyId}/accept`, {
      method: 'POST',
    });
  }

  async approveBounty(bountyId) {
    return this.request(`/bounties/${bountyId}/approve`, {
      method: 'POST',
    });
  }

  async rejectBounty(bountyId) {
    return this.request(`/bounties/${bountyId}/reject`, {
      method: 'POST',
    });
  }

  async claimBounty(bountyId) {
    return this.request(`/bounties/${bountyId}/claim`, {
      method: 'POST',
    });
  }

  async refundBounty(bountyId) {
    return this.request(`/bounties/${bountyId}/refund`, {
      method: 'POST',
    });
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

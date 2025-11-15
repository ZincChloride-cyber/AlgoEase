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

    // Add auth token if available (set via setAuthToken)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Added auth token to request:', token.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ No auth token found in localStorage - request may fail if auth is required');
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
        // For 409 (Conflict) or 200 (already exists), include the response data
        // so the caller can use it instead of treating it as an error
        if (response.status === 409 || response.status === 200) {
          error.isConflict = true;
          error.existingData = errorData; // Include the existing bounty data
        }
        throw error;
      }

      let data;
      const text = await response.text();
      if (!text) {
        console.warn('⚠️ Empty response body');
        return null;
      }
      try {
        data = JSON.parse(text);
        console.log('✅ API response received:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.error('❌ Response text:', text);
        throw new Error('Invalid JSON response from server');
      }
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
    
    try {
      const response = await this.request(endpoint);
      // Ensure response has the expected format
      if (response && typeof response === 'object') {
        // If response has bounties array, return as-is
        if (Array.isArray(response.bounties)) {
          return response;
        }
        // If response is directly an array, wrap it
        if (Array.isArray(response)) {
          return {
            bounties: response,
            pagination: {
              page: 1,
              limit: response.length,
              total: response.length,
              pages: 1
            }
          };
        }
        // If response has data array, convert it
        if (Array.isArray(response.data)) {
          return {
            bounties: response.data,
            pagination: response.pagination || {
              page: 1,
              limit: response.data.length,
              total: response.data.length,
              pages: 1
            }
          };
        }
      }
      // Default: return empty array
      return {
        bounties: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    } catch (error) {
      console.error('❌ Error in getBounties:', error);
      // Return empty array on error to prevent frontend crashes
      return {
        bounties: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  async getBounty(id) {
    return this.request(`/bounties/${id}`);
  }

  async createBounty(bountyData) {
    console.log('📤 [apiService.createBounty] Creating bounty with data:', {
      title: bountyData.title,
      amount: bountyData.amount,
      clientAddress: bountyData.clientAddress,
      contractId: bountyData.contractId,
      hasTransactionId: !!bountyData.transactionId
    });
    
    try {
      const result = await this.request('/bounties', {
        method: 'POST',
        body: JSON.stringify(bountyData),
      });
      
      console.log('✅ [apiService.createBounty] Bounty created successfully:', {
        id: result.id,
        contractId: result.contractId,
        status: result.status
      });
      
      return result;
    } catch (error) {
      console.error('❌ [apiService.createBounty] Failed to create bounty:', error);
      console.error('❌ [apiService.createBounty] Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      throw error;
    }
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

  async updateBountyTransaction(bountyId, transactionId, action, contractId = null) {
    console.log('📤 Updating bounty transaction:', { bountyId, transactionId, action, contractId });
    try {
      const body = { transactionId, action };
      // Include contractId if provided (especially for 'create' action)
      if (contractId !== null && contractId !== undefined) {
        body.contractId = contractId;
      }
      const response = await this.request(`/bounties/${bountyId}/transaction`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      console.log('✅ Transaction ID update response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to update transaction ID:', error);
      throw error;
    }
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

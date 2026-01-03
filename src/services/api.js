const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = {
  async request(method, endpoint, data = null) {
    const url = `${API_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error(`API ${method} ${endpoint}:`, error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request('GET', endpoint);
  },

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  },

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  },

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
};

export default api;

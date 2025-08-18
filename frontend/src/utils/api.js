import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authApi = {
  // Auth operations
  checkUsers: () => api.get('/auth/check-users'),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getUser: (id) => api.get(`/auth/user/${id}`),
  updateUser: (id, data) => api.put(`/auth/user/${id}`, data),
  uploadAvatar: (id, formData) => api.post(`/auth/upload-avatar/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  deleteAvatar: (id) => api.delete(`/auth/avatar/${id}`)
};

export const pricelistApi = {
  // Pricelist operations
  getPricelists: () => api.get('/pricelists'),
  getPricelistById: (id) => api.get(`/pricelists/${id}`),
  createPricelist: (data) => api.post('/pricelists', data),
  deletePricelist: (id) => api.delete(`/pricelists/${id}`),

  // Item operations
  addItem: (pricelistId, data) => api.post(`/pricelists/${pricelistId}/items`, data),
  updateItem: (itemId, data) => api.put(`/items/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/items/${itemId}`),

  // Test operations
  testConnection: () => api.get('/test-db'),
  healthCheck: () => axios.get('http://localhost:3001/health'),
};

export default api;
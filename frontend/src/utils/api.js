import axios from 'axios';
import * as Sentry from '@sentry/react';
import { API_URL } from '../config/env';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to headers
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);

    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Add token to Authorization header if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle JWT errors and refresh token
api.interceptors.response.use(
  (response) => {
    // Başarılı response'larda da kontrol et
    if (response.data && response.data.success === false &&
        response.data.message === 'Kullanıcı bulunamadı') {
      console.warn('User not found in database (success:false), clearing localStorage');
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);

    // Capture API errors in Sentry (excluding auth errors)
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      Sentry.captureException(error, {
        tags: {
          api_endpoint: error.config?.url,
          http_status: error.response?.status,
        },
        contexts: {
          request: {
            method: error.config?.method,
            url: error.config?.url,
            data: error.config?.data,
          },
          response: {
            status: error.response?.status,
            data: error.response?.data,
          },
        },
      });
    }

    const originalRequest = error.config;

    // Handle 401 Unauthorized (invalid/expired token)
    if (error.response?.status === 401) {
      // Check if this is a token refresh request that failed
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.warn('Token refresh failed, logging out');
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Don't retry if we've already tried once
      if (originalRequest._retry) {
        console.warn('Token refresh retry failed, logging out');
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Try to refresh the token
      originalRequest._retry = true;
      const token = localStorage.getItem('token');

      if (token) {
        try {
          console.log('Attempting to refresh token...');
          const response = await axios.post(
            'http://localhost:3000/api/auth/refresh',
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (response.data.success && response.data.token) {
            // Update stored token and user
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Update the Authorization header for the original request
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;

            // Retry the original request
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('user');
          localStorage.removeItem('token');

          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }

      // No token available, redirect to login
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      console.warn('Access forbidden:', error.response.data?.message);
      // Could show a notification here
    }

    // Eğer kullanıcı bulunamadı hatası gelirse localStorage'ı temizle
    if (error.response?.status === 404 ||
        error.response?.data?.message === 'Kullanıcı bulunamadı' ||
        (error.response?.data?.success === false && error.response?.data?.message === 'Kullanıcı bulunamadı')) {

      console.warn('User not found in database (error), clearing localStorage');
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Eğer login sayfasında değilsek login sayfasına yönlendir
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

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
  healthCheck: () => axios.get('http://localhost:3000/health'),
};

export default api;
/**
 * Environment Configuration
 * Centralized configuration for environment variables
 */

// API Base URL (without /api suffix for avatar/upload URLs)
// In Docker, use relative paths (nginx proxy handles routing)
// In development, use full URL
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If explicitly set to empty string (Docker/production), use relative path
  if (envUrl === '') {
    return '';
  }
  
  // If explicitly set to a URL, use it
  if (envUrl && envUrl !== 'undefined') {
    return envUrl;
  }
  
  // Runtime check: if we're in browser
  if (typeof window === 'undefined') {
    return ''; // SSR or build time - use relative path
  }
  
  // Check if we're in development mode (Vite dev server runs on port 5173)
  // Production/Docker runs on port 80 or no port
  const port = window.location.port;
  const hostname = window.location.hostname;
  
  // Development: localhost with port 5173 or 3000
  const isDevelopment = hostname === 'localhost' && (port === '5173' || port === '3000');
  
  if (isDevelopment) {
    return 'http://localhost:3001';
  }
  
  // Production/Docker: use relative path (nginx proxy handles routing)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// API URL (with /api suffix for API calls)
export const API_URL = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

// Sentry Configuration
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
export const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
export const SENTRY_TRACES_SAMPLE_RATE = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '1.0');

// Export default config object
export default {
  API_BASE_URL,
  API_URL,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_TRACES_SAMPLE_RATE,
};

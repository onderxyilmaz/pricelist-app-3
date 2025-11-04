/**
 * Environment Configuration
 * Centralized configuration for environment variables
 */

// API Base URL (without /api suffix for avatar/upload URLs)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// API URL (with /api suffix for API calls)
export const API_URL = `${API_BASE_URL}/api`;

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

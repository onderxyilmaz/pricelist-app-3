/**
 * Logger Utility
 * Environment-aware logging that prevents sensitive data exposure
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

/**
 * Sanitize sensitive data from objects before logging
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = ['token', 'password', 'authorization', 'auth', 'secret', 'apiKey', 'api_key'];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Safe logger that only logs in development mode
 * and automatically sanitizes sensitive data
 */
export const logger = {
  /**
   * Log info messages (only in development)
   */
  info: (...args) => {
    if (isDevelopment) {
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? sanitizeData(arg) : arg
      );
      console.log(...sanitized);
    }
  },

  /**
   * Log warning messages (always, but sanitized)
   */
  warn: (...args) => {
    const sanitized = args.map(arg => 
      typeof arg === 'object' ? sanitizeData(arg) : arg
    );
    console.warn(...sanitized);
  },

  /**
   * Log error messages (always, but sanitized)
   */
  error: (...args) => {
    const sanitized = args.map(arg => 
      typeof arg === 'object' ? sanitizeData(arg) : arg
    );
    console.error(...sanitized);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? sanitizeData(arg) : arg
      );
      console.debug(...sanitized);
    }
  },
};

export default logger;


import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially unsafe HTML string
 * @param {Object} config - DOMPurify configuration options
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHTML(dirty, config = {}) {
  const defaultConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
    ...config,
  };

  return DOMPurify.sanitize(dirty, defaultConfig);
}

/**
 * Sanitize plain text (removes all HTML tags)
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized plain text
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';

  // Remove all HTML tags
  const cleaned = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Trim whitespace
  return cleaned.trim();
}

/**
 * Sanitize user input for display
 * Escapes HTML entities to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} - Safe string for display
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
}

/**
 * Sanitize URLs to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string} - Safe URL or empty string
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string') return '';

  // Remove whitespace
  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(trimmed)) {
    console.warn('Blocked dangerous URL protocol:', trimmed);
    return '';
  }

  // Only allow http, https, mailto
  const allowedProtocols = /^(https?|mailto):/i;
  if (!trimmed.startsWith('/') && !allowedProtocols.test(trimmed)) {
    console.warn('Blocked URL with invalid protocol:', trimmed);
    return '';
  }

  return trimmed;
}

/**
 * Validate and sanitize email addresses
 * @param {string} email - Email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return null;

  const trimmed = email.trim().toLowerCase();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @param {Function} sanitizer - Sanitizer function to apply
 * @returns {Object} - Sanitized object
 */
export function sanitizeObject(obj, sanitizer = sanitizeText) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sanitizer));
  }

  const sanitized = {};
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize form data before submission
 * @param {FormData|Object} formData - Form data to sanitize
 * @returns {Object} - Sanitized form data
 */
export function sanitizeFormData(formData) {
  const data = {};

  if (formData instanceof FormData) {
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        data[key] = sanitizeInput(value);
      } else {
        data[key] = value; // Keep files as-is
      }
    }
  } else if (typeof formData === 'object') {
    return sanitizeObject(formData, sanitizeInput);
  }

  return data;
}

// Export all functions as default
export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeInput,
  sanitizeURL,
  sanitizeEmail,
  sanitizeObject,
  sanitizeFormData,
};

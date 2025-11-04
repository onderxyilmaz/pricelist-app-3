const validator = require('validator');

/**
 * Joi validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} property - Property to validate ('body', 'params', 'query')
 */
function validate(schema, property = 'body') {
  return async (request, reply) => {
    try {
      const dataToValidate = request[property];

      // Validate with Joi
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Return all errors, not just the first one
        stripUnknown: true, // Remove unknown properties
        convert: true, // Type conversion (e.g., string to number)
      });

      if (error) {
        // Format Joi errors to user-friendly format
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        return reply.code(400).send({
          success: false,
          message: 'Validation hatası',
          errors,
        });
      }

      // Replace request data with validated and sanitized value
      request[property] = value;
    } catch (err) {
      return reply.code(500).send({
        success: false,
        message: 'Validation error',
        error: err.message,
      });
    }
  };
}

/**
 * Sanitize input to prevent XSS attacks
 * Escapes HTML entities and removes dangerous characters
 */
function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Escape HTML entities
    let sanitized = validator.escape(input);

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }

  return input;
}

/**
 * Middleware to sanitize all request inputs
 */
function sanitizeAllInputs() {
  return async (request, reply) => {
    // Skip sanitization for static file routes
    if (request.url.startsWith('/uploads/')) {
      return;
    }

    if (request.body) {
      request.body = sanitizeInput(request.body);
    }
    if (request.query) {
      request.query = sanitizeInput(request.query);
    }
    if (request.params) {
      request.params = sanitizeInput(request.params);
    }
  };
}

/**
 * SQL Injection prevention - checks for suspicious patterns
 */
function checkSqlInjection(input) {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /(\bOR\b|\bAND\b).*=.*=/gi,
    /('|('')|;|--|\/\*|\*\/)/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Middleware to detect SQL injection attempts
 */
function detectSqlInjection() {
  return async (request, reply) => {
    // Skip SQL injection check for static file routes
    if (request.url.startsWith('/uploads/')) {
      return;
    }

    const checkObject = (obj, path = '') => {
      for (const key in obj) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string' && checkSqlInjection(value)) {
          return reply.code(400).send({
            success: false,
            message: 'Geçersiz karakter veya pattern tespit edildi',
            field: currentPath,
          });
        }

        if (typeof value === 'object' && value !== null) {
          const result = checkObject(value, currentPath);
          if (result) return result;
        }
      }
    };

    if (request.body) checkObject(request.body, 'body');
    if (request.query) checkObject(request.query, 'query');
    if (request.params) checkObject(request.params, 'params');
  };
}

module.exports = {
  validate,
  sanitizeInput,
  sanitizeAllInputs,
  checkSqlInjection,
  detectSqlInjection,
};

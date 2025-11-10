const { test, describe, expect } = require('@jest/globals');
const authValidators = require('../validators/authValidators');
const pricelistValidators = require('../validators/pricelistValidators');
const { sanitizeInput, checkSqlInjection } = require('../middleware/validation');

describe('Auth Validators', () => {
  describe('Register Validation', () => {
    test('should accept valid registration data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
      };

      const { error } = authValidators.register.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject short first name', () => {
      const invalidData = {
        firstName: 'J',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123',
      };

      const { error } = authValidators.register.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('en az 2 karakter');
    });

    test('should reject weak password', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'weak',
      };

      const { error } = authValidators.register.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject invalid email', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'Password123',
      };

      const { error } = authValidators.register.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should normalize email to lowercase', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'John.Doe@Example.COM',
        password: 'Password123',
      };

      const { value } = authValidators.register.validate(data);
      expect(value.email).toBe('john.doe@example.com');
    });
  });

  describe('Login Validation', () => {
    test('should accept valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anyPassword',
      };

      const { error } = authValidators.login.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const { error } = authValidators.login.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});

describe('Pricelist Validators', () => {
  describe('Create Pricelist Validation', () => {
    test('should accept valid pricelist data', () => {
      const validData = {
        name: 'Standard Prices',
        description: 'Standard pricing list',
        currency: 'USD',
        color: '#1890ff',
      };

      const { error } = pricelistValidators.createPricelist.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should accept minimal pricelist data', () => {
      const minimalData = {
        name: 'Quick List',
      };

      const { error, value } = pricelistValidators.createPricelist.validate(minimalData);
      expect(error).toBeUndefined();
      expect(value.currency).toBe('TRY'); // Default currency
    });

    test('should reject short pricelist name', () => {
      const invalidData = {
        name: 'X',
      };

      const { error } = pricelistValidators.createPricelist.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject invalid currency code', () => {
      const invalidData = {
        name: 'Test List',
        currency: 'US', // Should be 3 characters
      };

      const { error } = pricelistValidators.createPricelist.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject invalid color format', () => {
      const invalidData = {
        name: 'Test List',
        color: 'blue', // Should be hex format
      };

      const { error } = pricelistValidators.createPricelist.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('Add Item Validation', () => {
    test('should accept valid item data', () => {
      const validData = {
        product_code: 'PRD-001',
        product_name: 'Sample Product',
        unit: 'pcs',
        price: 99.99,
        category: 'Electronics',
      };

      const { error } = pricelistValidators.addItem.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject negative price', () => {
      const invalidData = {
        product_code: 'PRD-001',
        product_name: 'Sample Product',
        unit: 'pcs',
        price: -10,
      };

      const { error } = pricelistValidators.addItem.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject missing required fields', () => {
      const invalidData = {
        product_name: 'Sample Product',
        // Missing product_code, unit, price
      };

      const { error } = pricelistValidators.addItem.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
    });
  });
});

describe('Sanitization', () => {
  test('should sanitize HTML entities', () => {
    const input = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(input);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;');
    expect(sanitized).toContain('&gt;');
  });

  test('should sanitize nested objects', () => {
    const input = {
      name: '<b>Test</b>',
      nested: {
        value: '<script>alert()</script>',
      },
    };

    const sanitized = sanitizeInput(input);
    expect(sanitized.name).not.toContain('<b>');
    expect(sanitized.nested.value).not.toContain('<script>');
  });

  test('should sanitize arrays', () => {
    const input = ['<script>test</script>', 'normal text'];
    const sanitized = sanitizeInput(input);

    expect(sanitized[0]).not.toContain('<script>');
    expect(sanitized[1]).toBe('normal text');
  });
});

describe('SQL Injection Detection', () => {
  test('should detect SQL injection patterns', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      'SELECT * FROM users WHERE id=1',
      "admin' OR '1'='1",
      'UNION SELECT password FROM users',
      '/**/SELECT/**/password',
    ];

    maliciousInputs.forEach((input) => {
      const isMalicious = checkSqlInjection(input);
      expect(isMalicious).toBe(true);
    });
  });

  test('should allow safe inputs', () => {
    const safeInputs = [
      'John Doe',
      'test@example.com',
      '1234567890',
      'Normal text with punctuation!',
    ];

    safeInputs.forEach((input) => {
      const isMalicious = checkSqlInjection(input);
      expect(isMalicious).toBe(false);
    });
  });
});

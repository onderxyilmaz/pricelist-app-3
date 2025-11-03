const Joi = require('joi');
const validator = require('validator');

// Custom email validator using validator.js for better validation
const emailValidator = (value, helpers) => {
  if (!validator.isEmail(value)) {
    return helpers.error('string.email');
  }
  // Normalize email (lowercase, trim)
  return validator.normalizeEmail(value);
};

// Auth Validation Schemas
const authValidators = {
  // Register validation
  register: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
      .required()
      .messages({
        'string.min': 'İsim en az 2 karakter olmalıdır',
        'string.max': 'İsim en fazla 50 karakter olabilir',
        'string.pattern.base': 'İsim sadece harf içerebilir',
        'any.required': 'İsim zorunludur',
      }),
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
      .required()
      .messages({
        'string.min': 'Soyisim en az 2 karakter olmalıdır',
        'string.max': 'Soyisim en fazla 50 karakter olabilir',
        'string.pattern.base': 'Soyisim sadece harf içerebilir',
        'any.required': 'Soyisim zorunludur',
      }),
    email: Joi.string()
      .custom(emailValidator)
      .required()
      .messages({
        'string.email': 'Geçerli bir email adresi giriniz',
        'any.required': 'Email zorunludur',
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Şifre en az 6 karakter olmalıdır',
        'string.max': 'Şifre en fazla 128 karakter olabilir',
        'string.pattern.base': 'Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir',
        'any.required': 'Şifre zorunludur',
      }),
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string()
      .custom(emailValidator)
      .required()
      .messages({
        'string.email': 'Geçerli bir email adresi giriniz',
        'any.required': 'Email zorunludur',
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Şifre zorunludur',
      }),
  }),

  // Token refresh validation
  refreshToken: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Token zorunludur',
      }),
  }),

  // Update user validation
  updateUser: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
      .messages({
        'string.min': 'İsim en az 2 karakter olmalıdır',
        'string.max': 'İsim en fazla 50 karakter olabilir',
        'string.pattern.base': 'İsim sadece harf içerebilir',
      }),
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
      .messages({
        'string.min': 'Soyisim en az 2 karakter olmalıdır',
        'string.max': 'Soyisim en fazla 50 karakter olabilir',
        'string.pattern.base': 'Soyisim sadece harf içerebilir',
      }),
    email: Joi.string()
      .custom(emailValidator)
      .messages({
        'string.email': 'Geçerli bir email adresi giriniz',
      }),
    role: Joi.string()
      .valid('user', 'admin', 'super_admin')
      .messages({
        'any.only': 'Geçersiz rol',
      }),
  }).min(1), // At least one field must be present

  // User ID param validation
  userId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Kullanıcı ID sayı olmalıdır',
        'number.integer': 'Kullanıcı ID tam sayı olmalıdır',
        'number.positive': 'Kullanıcı ID pozitif olmalıdır',
        'any.required': 'Kullanıcı ID zorunludur',
      }),
  }),
};

module.exports = authValidators;

const Joi = require('joi');

const pricelistValidators = {
  // Create pricelist validation
  createPricelist: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Fiyat listesi adı en az 2 karakter olmalıdır',
        'string.max': 'Fiyat listesi adı en fazla 100 karakter olabilir',
        'any.required': 'Fiyat listesi adı zorunludur',
      }),
    description: Joi.string()
      .trim()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Açıklama en fazla 500 karakter olabilir',
      }),
    currency: Joi.string()
      .trim()
      .uppercase()
      .length(3)
      .pattern(/^[A-Z]{3}$/)
      .default('TRY')
      .messages({
        'string.length': 'Para birimi 3 karakter olmalıdır (örn: TRY, USD, EUR)',
        'string.pattern.base': 'Para birimi büyük harflerden oluşmalıdır',
      }),
    color: Joi.string()
      .trim()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .default('#1890ff')
      .messages({
        'string.pattern.base': 'Renk hex formatında olmalıdır (örn: #1890ff)',
      }),
  }),

  // Update pricelist validation
  updatePricelist: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Fiyat listesi adı en az 2 karakter olmalıdır',
        'string.max': 'Fiyat listesi adı en fazla 100 karakter olabilir',
      }),
    description: Joi.string()
      .trim()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Açıklama en fazla 500 karakter olabilir',
      }),
    currency: Joi.string()
      .trim()
      .uppercase()
      .length(3)
      .pattern(/^[A-Z]{3}$/)
      .messages({
        'string.length': 'Para birimi 3 karakter olmalıdır',
        'string.pattern.base': 'Para birimi büyük harflerden oluşmalıdır',
      }),
    color: Joi.string()
      .trim()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .messages({
        'string.pattern.base': 'Renk hex formatında olmalıdır',
      }),
  }).min(1),

  // Add item to pricelist validation
  addItem: Joi.object({
    product_code: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'Ürün kodu en az 1 karakter olmalıdır',
        'string.max': 'Ürün kodu en fazla 50 karakter olabilir',
        'any.required': 'Ürün kodu zorunludur',
      }),
    product_name: Joi.string()
      .trim()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.min': 'Ürün adı en az 2 karakter olmalıdır',
        'string.max': 'Ürün adı en fazla 200 karakter olabilir',
        'any.required': 'Ürün adı zorunludur',
      }),
    unit: Joi.string()
      .trim()
      .min(1)
      .max(20)
      .required()
      .messages({
        'string.min': 'Birim en az 1 karakter olmalıdır',
        'string.max': 'Birim en fazla 20 karakter olabilir',
        'any.required': 'Birim zorunludur',
      }),
    price: Joi.number()
      .positive()
      .precision(2)
      .max(9999999.99)
      .required()
      .messages({
        'number.base': 'Fiyat sayı olmalıdır',
        'number.positive': 'Fiyat pozitif olmalıdır',
        'number.max': 'Fiyat çok yüksek',
        'any.required': 'Fiyat zorunludur',
      }),
    category: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Kategori en fazla 100 karakter olabilir',
      }),
    brand: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Marka en fazla 100 karakter olabilir',
      }),
    note: Joi.string()
      .trim()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Not en fazla 500 karakter olabilir',
      }),
  }),

  // Update item validation
  updateItem: Joi.object({
    product_code: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .messages({
        'string.min': 'Ürün kodu en az 1 karakter olmalıdır',
        'string.max': 'Ürün kodu en fazla 50 karakter olabilir',
      }),
    product_name: Joi.string()
      .trim()
      .min(2)
      .max(200)
      .messages({
        'string.min': 'Ürün adı en az 2 karakter olmalıdır',
        'string.max': 'Ürün adı en fazla 200 karakter olabilir',
      }),
    unit: Joi.string()
      .trim()
      .min(1)
      .max(20)
      .messages({
        'string.min': 'Birim en az 1 karakter olmalıdır',
        'string.max': 'Birim en fazla 20 karakter olabilir',
      }),
    price: Joi.number()
      .positive()
      .precision(2)
      .max(9999999.99)
      .messages({
        'number.base': 'Fiyat sayı olmalıdır',
        'number.positive': 'Fiyat pozitif olmalıdır',
        'number.max': 'Fiyat çok yüksek',
      }),
    category: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Kategori en fazla 100 karakter olabilir',
      }),
    brand: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Marka en fazla 100 karakter olabilir',
      }),
    note: Joi.string()
      .trim()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Not en fazla 500 karakter olabilir',
      }),
  }).min(1),

  // ID param validation
  pricelistId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Fiyat listesi ID sayı olmalıdır',
        'number.integer': 'Fiyat listesi ID tam sayı olmalıdır',
        'number.positive': 'Fiyat listesi ID pozitif olmalıdır',
        'any.required': 'Fiyat listesi ID zorunludur',
      }),
  }),

  itemId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Ürün ID sayı olmalıdır',
        'number.integer': 'Ürün ID tam sayı olmalıdır',
        'number.positive': 'Ürün ID pozitif olmalıdır',
        'any.required': 'Ürün ID zorunludur',
      }),
  }),
};

module.exports = pricelistValidators;

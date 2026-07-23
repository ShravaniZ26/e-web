'use strict';

const Joi = require('joi');

const createAddressSchema = Joi.object({
  full_name: Joi.string().trim().min(1).max(255).required().messages({
    'string.base': 'Full name must be a string.',
    'string.empty': 'Full name is required.',
    'string.max': 'Full name must not exceed 255 characters.',
    'any.required': 'Full name is required.',
  }),
  phone_number: Joi.string()
    .trim()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      'string.base': 'Phone number must be a string.',
      'string.empty': 'Phone number is required.',
      'string.pattern.base': 'Phone number must be a valid 10-digit number.',
      'any.required': 'Phone number is required.',
    }),
  address_line1: Joi.string().trim().min(1).max(500).required().messages({
    'string.base': 'Address line 1 must be a string.',
    'string.empty': 'Address line 1 is required.',
    'string.max': 'Address line 1 must not exceed 500 characters.',
    'any.required': 'Address line 1 is required.',
  }),
  address_line2: Joi.string().trim().max(500).allow('', null).optional().messages({
    'string.base': 'Address line 2 must be a string.',
    'string.max': 'Address line 2 must not exceed 500 characters.',
  }),
  city: Joi.string().trim().min(1).max(255).required().messages({
    'string.base': 'City must be a string.',
    'string.empty': 'City is required.',
    'string.max': 'City must not exceed 255 characters.',
    'any.required': 'City is required.',
  }),
  state: Joi.string().trim().min(1).max(255).required().messages({
    'string.base': 'State must be a string.',
    'string.empty': 'State is required.',
    'string.max': 'State must not exceed 255 characters.',
    'any.required': 'State is required.',
  }),
  pin_code: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.base': 'PIN code must be a string.',
      'string.empty': 'PIN code is required.',
      'string.pattern.base': 'PIN code must be a valid 6-digit number.',
      'any.required': 'PIN code is required.',
    }),
  country: Joi.string().trim().min(1).max(255).default('India').messages({
    'string.base': 'Country must be a string.',
    'string.empty': 'Country must not be empty.',
    'string.max': 'Country must not exceed 255 characters.',
  }),
  address_type: Joi.string().valid('home', 'work', 'other').default('home').messages({
    'any.only': 'Address type must be one of home, work, or other.',
  }),
  is_default: Joi.boolean().default(false).messages({
    'boolean.base': 'is_default must be a boolean.',
  }),
});

const updateAddressSchema = Joi.object({
  full_name: Joi.string().trim().min(1).max(255).messages({
    'string.base': 'Full name must be a string.',
    'string.empty': 'Full name must not be empty.',
    'string.max': 'Full name must not exceed 255 characters.',
  }),
  phone_number: Joi.string()
    .trim()
    .pattern(/^\d{10}$/)
    .messages({
      'string.base': 'Phone number must be a string.',
      'string.empty': 'Phone number must not be empty.',
      'string.pattern.base': 'Phone number must be a valid 10-digit number.',
    }),
  address_line1: Joi.string().trim().min(1).max(500).messages({
    'string.base': 'Address line 1 must be a string.',
    'string.empty': 'Address line 1 must not be empty.',
    'string.max': 'Address line 1 must not exceed 500 characters.',
  }),
  address_line2: Joi.string().trim().max(500).allow('', null).messages({
    'string.base': 'Address line 2 must be a string.',
    'string.max': 'Address line 2 must not exceed 500 characters.',
  }),
  city: Joi.string().trim().min(1).max(255).messages({
    'string.base': 'City must be a string.',
    'string.empty': 'City must not be empty.',
    'string.max': 'City must not exceed 255 characters.',
  }),
  state: Joi.string().trim().min(1).max(255).messages({
    'string.base': 'State must be a string.',
    'string.empty': 'State must not be empty.',
    'string.max': 'State must not exceed 255 characters.',
  }),
  pin_code: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .messages({
      'string.base': 'PIN code must be a string.',
      'string.empty': 'PIN code must not be empty.',
      'string.pattern.base': 'PIN code must be a valid 6-digit number.',
    }),
  country: Joi.string().trim().min(1).max(255).messages({
    'string.base': 'Country must be a string.',
    'string.empty': 'Country must not be empty.',
    'string.max': 'Country must not exceed 255 characters.',
  }),
  address_type: Joi.string().valid('home', 'work', 'other').messages({
    'any.only': 'Address type must be one of home, work, or other.',
  }),
  is_default: Joi.boolean().messages({
    'boolean.base': 'is_default must be a boolean.',
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update.',
  });

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    return next();
  };
}

module.exports = { createAddressSchema, updateAddressSchema, validateBody };

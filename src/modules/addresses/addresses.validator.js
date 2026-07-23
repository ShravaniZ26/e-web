const Joi = require('joi');

const pinCodePattern = /^[1-9][0-9]{5}$/;
const phonePattern = /^[6-9]\d{9}$/;

const addressFields = {
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.base': 'Name must be a string.',
    'string.empty': 'Name is required.',
    'string.min': 'Name must be at least 2 characters.',
    'string.max': 'Name must not exceed 100 characters.',
    'any.required': 'Name is required.',
  }),

  phone: Joi.string().pattern(phonePattern).required().messages({
    'string.base': 'Phone must be a string.',
    'string.empty': 'Phone number is required.',
    'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number.',
    'any.required': 'Phone number is required.',
  }),

  address_line1: Joi.string().trim().min(5).max(255).required().messages({
    'string.base': 'Address line 1 must be a string.',
    'string.empty': 'Address line 1 is required.',
    'string.min': 'Address line 1 must be at least 5 characters.',
    'string.max': 'Address line 1 must not exceed 255 characters.',
    'any.required': 'Address line 1 is required.',
  }),

  address_line2: Joi.string().trim().max(255).allow('', null).optional().messages({
    'string.base': 'Address line 2 must be a string.',
    'string.max': 'Address line 2 must not exceed 255 characters.',
  }),

  landmark: Joi.string().trim().max(100).allow('', null).optional().messages({
    'string.base': 'Landmark must be a string.',
    'string.max': 'Landmark must not exceed 100 characters.',
  }),

  city: Joi.string().trim().min(2).max(100).required().messages({
    'string.base': 'City must be a string.',
    'string.empty': 'City is required.',
    'string.min': 'City must be at least 2 characters.',
    'string.max': 'City must not exceed 100 characters.',
    'any.required': 'City is required.',
  }),

  state: Joi.string().trim().min(2).max(100).required().messages({
    'string.base': 'State must be a string.',
    'string.empty': 'State is required.',
    'string.min': 'State must be at least 2 characters.',
    'string.max': 'State must not exceed 100 characters.',
    'any.required': 'State is required.',
  }),

  pin_code: Joi.string().pattern(pinCodePattern).required().messages({
    'string.base': 'Pin code must be a string.',
    'string.empty': 'Pin code is required.',
    'string.pattern.base': 'Pin code must be a valid 6-digit Indian pin code.',
    'any.required': 'Pin code is required.',
  }),

  address_type: Joi.string().valid('home', 'work', 'other').default('home').messages({
    'string.base': 'Address type must be a string.',
    'any.only': 'Address type must be one of home, work, or other.',
  }),

  is_default: Joi.boolean().default(false).messages({
    'boolean.base': 'is_default must be a boolean.',
  }),
};

const createAddressSchema = Joi.object({
  name: addressFields.name,
  phone: addressFields.phone,
  address_line1: addressFields.address_line1,
  address_line2: addressFields.address_line2,
  landmark: addressFields.landmark,
  city: addressFields.city,
  state: addressFields.state,
  pin_code: addressFields.pin_code,
  address_type: addressFields.address_type,
  is_default: addressFields.is_default,
});

const updateAddressSchema = Joi.object({
  name: addressFields.name.optional(),
  phone: addressFields.phone.optional(),
  address_line1: addressFields.address_line1.optional(),
  address_line2: addressFields.address_line2,
  landmark: addressFields.landmark,
  city: addressFields.city.optional(),
  state: addressFields.state.optional(),
  pin_code: addressFields.pin_code.optional(),
  address_type: addressFields.address_type,
  is_default: addressFields.is_default,
}).min(1).messages({
  'object.min': 'At least one field must be provided for update.',
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
};

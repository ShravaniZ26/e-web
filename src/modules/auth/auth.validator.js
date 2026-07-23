'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const schemas = {
  register: Joi.object({
    firstName: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'First name is required.',
      'any.required': 'First name is required.',
      'string.max': 'First name must not exceed 100 characters.',
    }),
    lastName: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Last name is required.',
      'any.required': 'Last name is required.',
      'string.max': 'Last name must not exceed 100 characters.',
    }),
    email: Joi.string().email().lowercase().required().messages({
      'string.email': 'A valid email address is required.',
      'string.empty': 'Email is required.',
      'any.required': 'Email is required.',
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Password must be at least 8 characters long.',
      'string.max': 'Password must not exceed 128 characters.',
      'string.empty': 'Password is required.',
      'any.required': 'Password is required.',
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().required().messages({
      'string.email': 'A valid email address is required.',
      'string.empty': 'Email is required.',
      'any.required': 'Email is required.',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required.',
      'any.required': 'Password is required.',
    }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().required().messages({
      'string.email': 'A valid email address is required.',
      'string.empty': 'Email is required.',
      'any.required': 'Email is required.',
    }),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'string.empty': 'Reset token is required.',
      'any.required': 'Reset token is required.',
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Password must be at least 8 characters long.',
      'string.max': 'Password must not exceed 128 characters.',
      'string.empty': 'Password is required.',
      'any.required': 'Password is required.',
    }),
  }),

  guestRegister: Joi.object({
    firstName: Joi.string().trim().min(1).max(100).optional().messages({
      'string.max': 'First name must not exceed 100 characters.',
    }),
    lastName: Joi.string().trim().min(1).max(100).optional().messages({
      'string.max': 'Last name must not exceed 100 characters.',
    }),
    email: Joi.string().email().lowercase().optional().messages({
      'string.email': 'A valid email address is required.',
    }),
  }),
};

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Returns an Express middleware that validates req.body against the named schema.
 * On failure it responds immediately with HTTP 400 and a list of error messages.
 * On success req.body is replaced with the coerced, stripped value.
 *
 * @param {'register'|'login'|'forgotPassword'|'resetPassword'|'guestRegister'} schemaName
 * @returns {import('express').RequestHandler}
 */
function validate(schemaName) {
  const schema = schemas[schemaName];

  if (!schema) {
    throw new Error(`Unknown validation schema: "${schemaName}"`);
  }

  return function validationMiddleware(req, res, next) {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: error.details.map((detail) => detail.message),
      });
    }

    req.body = value;
    next();
  };
}

module.exports = { schemas, validate };

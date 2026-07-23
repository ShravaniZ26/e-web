'use strict';

const Joi = require('joi');

/**
 * Reusable field definitions.
 */
const fields = {
  firstName: Joi.string().min(1).max(100).trim(),
  lastName: Joi.string().min(1).max(100).trim(),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow(null, '')
    .optional(),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim(),
  role: Joi.string().valid('admin', 'customer'),
  password: Joi.string().min(8).max(128),
};

/**
 * PATCH /users/me — self-service profile update.
 * At least one field must be supplied.
 */
const updateProfileSchema = Joi.object({
  firstName: fields.firstName.optional(),
  lastName: fields.lastName.optional(),
  phone: fields.phone,
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update.',
  });

/**
 * POST /users/me/change-password
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required.',
    'string.empty': 'Current password is required.',
  }),

  newPassword: fields.password.required().messages({
    'any.required': 'New password is required.',
    'string.empty': 'New password is required.',
    'string.min': 'New password must be at least 8 characters.',
    'string.max': 'New password must be at most 128 characters.',
  }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.required': 'Password confirmation is required.',
      'string.empty': 'Password confirmation is required.',
      'any.only': 'Passwords do not match.',
    }),
});

/**
 * PATCH /users/:userId — admin user update (may include role and email).
 * At least one field must be supplied.
 */
const updateUserAdminSchema = Joi.object({
  firstName: fields.firstName.optional(),
  lastName: fields.lastName.optional(),
  phone: fields.phone,
  email: fields.email.optional(),
  role: fields.role.optional(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update.',
    'any.only': 'Role must be one of admin, customer.',
  });

/**
 * GET /users — admin paginated list query parameters.
 */
const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number.',
    'number.integer': 'Page must be an integer.',
    'number.min': 'Page must be at least 1.',
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number.',
    'number.integer': 'Limit must be an integer.',
    'number.min': 'Limit must be at least 1.',
    'number.max': 'Limit must not exceed 100.',
  }),

  search: Joi.string().trim().max(200).optional(),

  role: fields.role.optional().messages({
    'any.only': 'Role filter must be one of admin, customer.',
  }),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  updateUserAdminSchema,
  listUsersQuerySchema,
};

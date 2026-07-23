'use strict';

const Joi = require('joi');

/**
 * Shared field definitions.
 */
const firstName = Joi.string().trim().min(1).max(100);
const lastName = Joi.string().trim().min(1).max(100);
const phone = Joi.string().trim().max(30).allow('', null);
const password = Joi.string().min(8).max(128);

/**
 * PATCH /users/me
 * At least one of the permitted profile fields must be present.
 */
const updateProfile = Joi.object({
  firstName: firstName.optional(),
  lastName: lastName.optional(),
  phone: phone.optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided to update the profile.',
});

/**
 * POST /users/me/change-password
 */
const changePassword = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required.',
    'string.empty': 'Current password is required.',
  }),
  newPassword: password.required().messages({
    'any.required': 'New password is required.',
    'string.empty': 'New password is required.',
    'string.min': 'New password must be at least 8 characters.',
    'string.max': 'New password must not exceed 128 characters.',
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
 * GET /users  (query params)
 */
const listUsers = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(255).optional(),
  role: Joi.string().valid('user', 'admin').optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * PATCH /users/:userId  (admin)
 * Allows role and isActive in addition to profile fields.
 */
const adminUpdateUser = Joi.object({
  firstName: firstName.optional(),
  lastName: lastName.optional(),
  phone: phone.optional(),
  role: Joi.string().valid('user', 'admin').optional().messages({
    'any.only': 'Role must be one of: user, admin.',
  }),
  isActive: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided to update the user.',
});

module.exports = {
  updateProfile,
  changePassword,
  listUsers,
  adminUpdateUser,
};

'use strict';

const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(128).required(),
});

const guestRegisterSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional(),
});

/**
 * Returns an Express middleware that validates req.body against the given Joi schema.
 * On failure responds 422 with a structured errors array.
 * On success, replaces req.body with the sanitised value and calls next().
 *
 * @param {Joi.ObjectSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(422).json({
        success: false,
        errors: error.details.map((d) => ({
          field: d.context && d.context.key ? d.context.key : null,
          message: d.message,
        })),
      });
    }

    req.body = value;
    return next();
  };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  guestRegisterSchema,
};

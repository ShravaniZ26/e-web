'use strict';

const { Router } = require('express');
const authController = require('./auth.controller');
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  guestRegisterSchema,
} = require('./auth.validator');

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   POST /auth/logout
 * @desc    Logout the current user (client discards JWT)
 * @access  Public (token verification can be added via auth middleware if needed)
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /auth/forgot-password
 * @desc    Initiate password reset flow
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @route   POST /auth/reset-password
 * @desc    Complete password reset using token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @route   POST /auth/guest-register
 * @desc    Create an ephemeral guest user session
 * @access  Public
 */
router.post('/guest-register', validate(guestRegisterSchema), authController.guestRegister);

module.exports = router;

'use strict';

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { validate } = require('./auth.validator');

// POST /auth/register
router.post('/register', validate('register'), authController.register);

// POST /auth/login
router.post('/login', validate('login'), authController.login);

// POST /auth/logout
router.post('/logout', authController.logout);

// POST /auth/forgot-password
router.post('/forgot-password', validate('forgotPassword'), authController.forgotPassword);

// POST /auth/reset-password
router.post('/reset-password', validate('resetPassword'), authController.resetPassword);

// POST /auth/guest-register
router.post('/guest-register', validate('guestRegister'), authController.guestRegister);

module.exports = router;

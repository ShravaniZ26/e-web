'use strict';

const authService = require('./auth.service');

/**
 * POST /auth/register
 */
async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/login
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/logout
 * Expects the client to send a valid Bearer token (authentication enforced at route level if needed).
 */
async function logout(req, res, next) {
  try {
    const result = await authService.logout();
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /auth/guest-register
 */
async function guestRegister(req, res, next) {
  try {
    const result = await authService.guestRegister(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};

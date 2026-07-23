'use strict';

const authService = require('./auth.service');

/**
 * POST /auth/register
 */
async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/logout
 */
async function logout(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    await authService.logout(token);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/guest-register
 */
async function guestRegister(req, res, next) {
  try {
    const result = await authService.guestRegister(req.body);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
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

'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// UserModel must expose: findByEmail(email), create(data), updateById(id, data)
const UserModel = require('../../models/user.model');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * In-memory store for password-reset tokens.
 * Replace with a dedicated DB table (e.g. password_reset_tokens) for multi-process deployments.
 *
 * Structure: Map<token, { userId: string, expiresAt: number }>
 */
const resetTokenStore = new Map();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function issueJwt(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  // Remove sensitive fields before returning to caller.
  // Works with plain objects; if user is an ORM instance call .toObject() / .get({ plain: true }) first.
  const { passwordHash, password, ...safe } = user;
  return safe;
}

function createHttpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// ─── Service methods ──────────────────────────────────────────────────────────

/**
 * Register a new standard user account.
 *
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
async function register({ name, email, password }) {
  const existing = await UserModel.findByEmail(email);
  if (existing) {
    throw createHttpError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await UserModel.create({ name, email, passwordHash, role: 'user' });

  const token = issueJwt(user);
  return { token, user: sanitizeUser(user) };
}

/**
 * Authenticate a user and return a JWT.
 *
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
async function login({ email, password }) {
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw createHttpError('Invalid credentials', 401);
  }

  const passwordField = user.passwordHash || user.password;
  const valid = await bcrypt.compare(password, passwordField);
  if (!valid) {
    throw createHttpError('Invalid credentials', 401);
  }

  const token = issueJwt(user);
  return { token, user: sanitizeUser(user) };
}

/**
 * Logout the current user.
 * JWT is stateless; the client is responsible for discarding the token.
 * For hard revocation, add the token JTI to a blocklist here.
 *
 * @returns {Promise<{ message: string }>}
 */
async function logout() {
  return { message: 'Logged out successfully' };
}

/**
 * Initiate the forgot-password flow.
 * Always returns the same message to prevent user enumeration.
 *
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 */
async function forgotPassword(email) {
  const SAFE_RESPONSE = {
    message: 'If an account with that email exists, a reset link has been sent.',
  };

  const user = await UserModel.findByEmail(email);
  if (!user) {
    return SAFE_RESPONSE;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
  resetTokenStore.set(token, { userId: user.id, expiresAt });

  // TODO: dispatch email containing reset link with token
  // await emailService.sendPasswordResetEmail(user.email, token);

  return SAFE_RESPONSE;
}

/**
 * Complete the password-reset flow.
 *
 * @param {string} token  - The opaque reset token issued by forgotPassword
 * @param {string} newPassword - The new plain-text password
 * @returns {Promise<{ message: string }>}
 */
async function resetPassword(token, newPassword) {
  const entry = resetTokenStore.get(token);
  if (!entry || Date.now() > entry.expiresAt) {
    throw createHttpError('Invalid or expired password reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await UserModel.updateById(entry.userId, { passwordHash });
  resetTokenStore.delete(token);

  return { message: 'Password reset successfully' };
}

/**
 * Register an ephemeral guest user and return a JWT.
 *
 * @param {{ name?: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
async function guestRegister({ name } = {}) {
  const guestSuffix = crypto.randomBytes(8).toString('hex');
  const guestEmail = `guest_${guestSuffix}@guest.local`;
  const guestName = name || `Guest_${guestSuffix.slice(0, 6)}`;

  // Assign a random non-guessable password so the account is not accessible via login
  const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), SALT_ROUNDS);

  const user = await UserModel.create({
    name: guestName,
    email: guestEmail,
    passwordHash,
    role: 'guest',
  });

  const token = issueJwt(user);
  return { token, user: sanitizeUser(user) };
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  guestRegister,
};

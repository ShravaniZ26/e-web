'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Database connection is expected at src/db (exports a pg-compatible query method).
const db = require('../../db');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

/**
 * In-memory token blacklist for logout invalidation.
 * Replace with a Redis SET in production environments.
 */
const tokenBlacklist = new Set();

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

/**
 * Creates a new standard user account.
 * @param {{ firstName: string, lastName: string, email: string, password: string }} data
 * @returns {{ token: string, user: object }}
 */
async function register({ firstName, lastName, email, password }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [
    email,
  ]);
  if (existing.rows.length > 0) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.query(
    `INSERT INTO users
       (first_name, last_name, email, password_hash, role, is_guest, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'user', false, NOW(), NOW())
     RETURNING id, first_name, last_name, email, role`,
    [firstName, lastName, email, passwordHash],
  );

  const user = result.rows[0];
  const token = issueToken(user);

  return { token, user: sanitizeUser(user) };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * Authenticates a user with email and password.
 * @param {{ email: string, password: string }} credentials
 * @returns {{ token: string, user: object }}
 */
async function login({ email, password }) {
  const result = await db.query(
    `SELECT id, first_name, last_name, email, password_hash, role
     FROM users
     WHERE email = $1 AND is_guest = false`,
    [email],
  );

  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = issueToken(user);

  return { token, user: sanitizeUser(user) };
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * Blacklists the provided JWT so it cannot be reused.
 * @param {string|null} token
 */
async function logout(token) {
  if (token && typeof token === 'string') {
    tokenBlacklist.add(token);
  }
}

/**
 * Returns true if the given JWT has been invalidated via logout.
 * @param {string} token
 * @returns {boolean}
 */
function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

/**
 * Generates a password-reset token and persists its hash against the user.
 * The raw token must be delivered to the user out-of-band (email).
 * The response message is deliberately ambiguous to prevent email enumeration.
 * @param {{ email: string }} data
 * @returns {{ message: string }}
 */
async function forgotPassword({ email }) {
  const AMBIGUOUS_RESPONSE = {
    message:
      'If that email address is associated with an account you will receive a password reset link shortly.',
  };

  const result = await db.query(
    'SELECT id, email FROM users WHERE email = $1 AND is_guest = false',
    [email],
  );

  if (result.rows.length === 0) {
    // Return the same response regardless to prevent enumeration.
    return AMBIGUOUS_RESPONSE;
  }

  const user = result.rows[0];

  // Generate a cryptographically secure random token.
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);

  await db.query(
    `UPDATE users
     SET reset_token = $1, reset_token_expires = $2, updated_at = NOW()
     WHERE id = $3`,
    [tokenHash, expiresAt, user.id],
  );

  // TODO: Integrate with email service to deliver rawToken as a reset link.
  // e.g. emailService.sendPasswordReset(user.email, rawToken);

  return AMBIGUOUS_RESPONSE;
}

// ---------------------------------------------------------------------------
// Reset password
// ---------------------------------------------------------------------------

/**
 * Validates a reset token and updates the user's password.
 * @param {{ token: string, password: string }} data
 * @returns {{ message: string }}
 */
async function resetPassword({ token, password }) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const result = await db.query(
    `SELECT id FROM users
     WHERE reset_token = $1
       AND reset_token_expires > NOW()
       AND is_guest = false`,
    [tokenHash],
  );

  if (result.rows.length === 0) {
    const err = new Error('Password reset token is invalid or has expired.');
    err.statusCode = 400;
    throw err;
  }

  const user = result.rows[0];
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await db.query(
    `UPDATE users
     SET password_hash = $1,
         reset_token = NULL,
         reset_token_expires = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, user.id],
  );

  return { message: 'Your password has been reset successfully.' };
}

// ---------------------------------------------------------------------------
// Guest register
// ---------------------------------------------------------------------------

/**
 * Creates an anonymous guest user session.
 * @param {{ firstName?: string, lastName?: string, email?: string }} data
 * @returns {{ token: string, user: object }}
 */
async function guestRegister({ firstName, lastName, email } = {}) {
  const guestEmail =
    email ||
    `guest_${crypto.randomBytes(8).toString('hex')}@guest.local`;

  // Use a random placeholder hash — guest accounts cannot log in with a password.
  const placeholderHash = await bcrypt.hash(
    crypto.randomBytes(16).toString('hex'),
    SALT_ROUNDS,
  );

  const result = await db.query(
    `INSERT INTO users
       (first_name, last_name, email, password_hash, role, is_guest, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'guest', true, NOW(), NOW())
     RETURNING id, first_name, last_name, email, role`,
    [firstName || 'Guest', lastName || 'User', guestEmail, placeholderHash],
  );

  const user = result.rows[0];
  const token = issueToken(user);

  return { token, user: sanitizeUser(user) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Signs and returns a JWT for the given user record.
 * @param {{ id: number|string, email: string, role: string }} user
 * @returns {string}
 */
function issueToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

/**
 * Strips sensitive fields before exposing a user object to clients.
 * @param {object} user
 * @returns {object}
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
  };
}

module.exports = {
  register,
  login,
  logout,
  isTokenBlacklisted,
  forgotPassword,
  resetPassword,
  guestRegister,
};

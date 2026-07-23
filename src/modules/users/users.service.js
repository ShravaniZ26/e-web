'use strict';

const bcrypt = require('bcrypt');
const db = require('../../db');

const TABLE = 'users';
const SALT_ROUNDS = 12;

/** Columns safe to return to callers (never includes password_hash). */
const PUBLIC_COLUMNS = [
  'id',
  'email',
  'first_name',
  'last_name',
  'phone',
  'role',
  'created_at',
  'updated_at',
];

/**
 * Build an AppError-compatible error.
 * @param {string} message
 * @param {number} statusCode
 */
function createError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Fetch a single non-deleted user by primary key.
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getUserById(userId) {
  const user = await db(TABLE)
    .where({ id: userId })
    .whereNull('deleted_at')
    .select(PUBLIC_COLUMNS)
    .first();

  if (!user) {
    throw createError('User not found.', 404);
  }

  return user;
}

/**
 * Return a paginated list of non-deleted users.
 * @param {object} opts
 * @param {number} opts.page
 * @param {number} opts.limit
 * @param {string} [opts.search]
 * @param {string} [opts.role]
 * @returns {Promise<{ data: object[], meta: object }>}
 */
async function listUsers({ page = 1, limit = 20, search, role } = {}) {
  const offset = (page - 1) * limit;

  const baseQuery = db(TABLE).whereNull('deleted_at');

  if (search) {
    const term = `%${search}%`;
    baseQuery.where(function () {
      this.where('email', 'ilike', term)
        .orWhere('first_name', 'ilike', term)
        .orWhere('last_name', 'ilike', term);
    });
  }

  if (role) {
    baseQuery.where({ role });
  }

  const [{ count }] = await baseQuery.clone().count('id as count');
  const total = parseInt(count, 10);

  const data = await baseQuery
    .clone()
    .select(PUBLIC_COLUMNS)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update the profile fields of a user (self-service; no role change).
 * @param {string} userId
 * @param {object} payload
 * @returns {Promise<object>}
 */
async function updateProfile(userId, payload) {
  const { firstName, lastName, phone } = payload;

  const updates = { updated_at: db.fn.now() };
  if (firstName !== undefined) updates.first_name = firstName;
  if (lastName !== undefined) updates.last_name = lastName;
  if (phone !== undefined) updates.phone = phone;

  const [updated] = await db(TABLE)
    .where({ id: userId })
    .whereNull('deleted_at')
    .update(updates)
    .returning(PUBLIC_COLUMNS);

  if (!updated) {
    throw createError('User not found.', 404);
  }

  return updated;
}

/**
 * Change the password of the currently authenticated user.
 * Verifies the current password before applying the new hash.
 * @param {string} userId
 * @param {object} payload
 * @param {string} payload.currentPassword
 * @param {string} payload.newPassword
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await db(TABLE)
    .where({ id: userId })
    .whereNull('deleted_at')
    .select('id', 'password_hash')
    .first();

  if (!user) {
    throw createError('User not found.', 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw createError('Current password is incorrect.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db(TABLE)
    .where({ id: userId })
    .update({ password_hash: passwordHash, updated_at: db.fn.now() });
}

/**
 * Admin: update any mutable field (including email and role) of a user.
 * @param {string} userId
 * @param {object} payload
 * @returns {Promise<object>}
 */
async function updateUser(userId, payload) {
  const { firstName, lastName, phone, email, role } = payload;

  const updates = { updated_at: db.fn.now() };
  if (firstName !== undefined) updates.first_name = firstName;
  if (lastName !== undefined) updates.last_name = lastName;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;

  if (email) {
    const existing = await db(TABLE)
      .where({ email })
      .whereNot({ id: userId })
      .whereNull('deleted_at')
      .first();

    if (existing) {
      throw createError('Email address is already in use.', 409);
    }
  }

  const [updated] = await db(TABLE)
    .where({ id: userId })
    .whereNull('deleted_at')
    .update(updates)
    .returning(PUBLIC_COLUMNS);

  if (!updated) {
    throw createError('User not found.', 404);
  }

  return updated;
}

/**
 * Admin: soft-delete a user by setting deleted_at.
 * @param {string} userId
 */
async function deleteUser(userId) {
  const [deleted] = await db(TABLE)
    .where({ id: userId })
    .whereNull('deleted_at')
    .update({ deleted_at: db.fn.now() })
    .returning('id');

  if (!deleted) {
    throw createError('User not found.', 404);
  }
}

module.exports = {
  getUserById,
  listUsers,
  updateProfile,
  changePassword,
  updateUser,
  deleteUser,
};

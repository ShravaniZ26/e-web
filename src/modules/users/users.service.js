'use strict';

const bcrypt = require('bcrypt');
const db = require('../../db');
const AppError = require('../../errors/AppError');
const { HTTP_STATUS } = require('../../constants/http');

const SALT_ROUNDS = 12;

/** Columns returned to callers (never expose password_hash). */
const PUBLIC_COLUMNS = [
  'id',
  'email',
  'first_name',
  'last_name',
  'phone',
  'role',
  'is_active',
  'created_at',
  'updated_at',
];

/**
 * Fetch a single user by primary key.
 * Throws 404 when not found.
 */
const getUserById = async (userId) => {
  const user = await db('users')
    .select(PUBLIC_COLUMNS)
    .where({ id: userId, deleted_at: null })
    .first();

  if (!user) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

/**
 * Update the authenticated user's own profile (non-sensitive fields only).
 */
const updateProfile = async (userId, payload) => {
  const { firstName, lastName, phone } = payload;

  const updates = {};
  if (firstName !== undefined) updates.first_name = firstName;
  if (lastName !== undefined) updates.last_name = lastName;
  if (phone !== undefined) updates.phone = phone;

  if (Object.keys(updates).length === 0) {
    return getUserById(userId);
  }

  updates.updated_at = db.fn.now();

  await db('users').where({ id: userId, deleted_at: null }).update(updates);

  return getUserById(userId);
};

/**
 * Change the authenticated user's password after verifying the current one.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const row = await db('users')
    .select('id', 'password_hash')
    .where({ id: userId, deleted_at: null })
    .first();

  if (!row) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(currentPassword, row.password_hash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db('users')
    .where({ id: userId })
    .update({ password_hash: passwordHash, updated_at: db.fn.now() });
};

/**
 * Return a paginated list of users (admin only).
 */
const listUsers = async ({ page, limit, search, role, isActive }) => {
  const offset = (page - 1) * limit;

  const query = db('users')
    .select(PUBLIC_COLUMNS)
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const countQuery = db('users').whereNull('deleted_at').count('id as total');

  if (search) {
    const term = `%${search}%`;
    query.where((qb) =>
      qb
        .whereILike('email', term)
        .orWhereILike('first_name', term)
        .orWhereILike('last_name', term)
    );
    countQuery.where((qb) =>
      qb
        .whereILike('email', term)
        .orWhereILike('first_name', term)
        .orWhereILike('last_name', term)
    );
  }

  if (role !== undefined) {
    query.where({ role });
    countQuery.where({ role });
  }

  if (isActive !== undefined) {
    query.where({ is_active: isActive });
    countQuery.where({ is_active: isActive });
  }

  const [users, [{ total }]] = await Promise.all([query, countQuery]);

  return {
    data: users,
    meta: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
};

/**
 * Admin: update any field including role and isActive.
 */
const adminUpdateUser = async (userId, payload) => {
  const { firstName, lastName, phone, role, isActive } = payload;

  const updates = {};
  if (firstName !== undefined) updates.first_name = firstName;
  if (lastName !== undefined) updates.last_name = lastName;
  if (phone !== undefined) updates.phone = phone;
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.is_active = isActive;

  if (Object.keys(updates).length === 0) {
    return getUserById(userId);
  }

  updates.updated_at = db.fn.now();

  const count = await db('users')
    .where({ id: userId, deleted_at: null })
    .update(updates);

  if (count === 0) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  return getUserById(userId);
};

/**
 * Soft-delete a user account.
 */
const deleteUser = async (userId) => {
  const count = await db('users')
    .where({ id: userId, deleted_at: null })
    .update({ deleted_at: db.fn.now(), updated_at: db.fn.now() });

  if (count === 0) {
    throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
};

module.exports = {
  getUserById,
  updateProfile,
  changePassword,
  listUsers,
  adminUpdateUser,
  deleteUser,
};

'use strict';

const usersService = require('./users.service');
const { HTTP_STATUS } = require('../../constants/http');

/**
 * GET /users/me
 * Returns the authenticated user's own profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.user.id);
    return res.status(HTTP_STATUS.OK).json({ data: user });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /users/me
 * Updates the authenticated user's own profile fields.
 */
const updateMe = async (req, res, next) => {
  try {
    const updated = await usersService.updateProfile(req.user.id, req.body);
    return res.status(HTTP_STATUS.OK).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /users/me/change-password
 * Allows the authenticated user to change their own password.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await usersService.changePassword(req.user.id, currentPassword, newPassword);
    return res.status(HTTP_STATUS.OK).json({ message: 'Password updated successfully.' });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /users
 * Admin: Returns a paginated list of all users.
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const result = await usersService.listUsers({
      page: Number(page),
      limit: Number(limit),
      search,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /users/:userId
 * Admin: Returns a single user by ID.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.userId);
    return res.status(HTTP_STATUS.OK).json({ data: user });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /users/:userId
 * Admin: Updates any user's profile or role.
 */
const updateUser = async (req, res, next) => {
  try {
    const updated = await usersService.adminUpdateUser(req.params.userId, req.body);
    return res.status(HTTP_STATUS.OK).json({ data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /users/:userId
 * Admin: Soft-deletes a user account.
 */
const deleteUser = async (req, res, next) => {
  try {
    await usersService.deleteUser(req.params.userId);
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};

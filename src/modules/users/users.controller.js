'use strict';

const usersService = require('./users.service');

/**
 * GET /users/me
 * Returns the profile of the currently authenticated user.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.user.id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/me
 * Updates the profile of the currently authenticated user.
 */
const updateMe = async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user.id, req.body);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /users/me/change-password
 * Changes the password for the currently authenticated user.
 */
const changePassword = async (req, res, next) => {
  try {
    await usersService.changePassword(req.user.id, req.body);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

/**
 * GET /users
 * Admin: paginated list of all users.
 */
const listUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role } = req.query;
    const result = await usersService.listUsers({
      page: page !== undefined ? Number(page) : 1,
      limit: limit !== undefined ? Number(limit) : 20,
      search,
      role,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /users/:userId
 * Admin: fetch a single user by id.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.userId);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /users/:userId
 * Admin: update any field (including role) of a user.
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.userId, req.body);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /users/:userId
 * Admin: soft-delete a user account.
 */
const deleteUser = async (req, res, next) => {
  try {
    await usersService.deleteUser(req.params.userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  updateMe,
  changePassword,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};

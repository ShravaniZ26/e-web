'use strict';

const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const {
  updateProfileSchema,
  changePasswordSchema,
  updateUserAdminSchema,
  listUsersQuerySchema,
} = require('./users.validator');

const router = Router();

// ── Authenticated-user (self) routes ────────────────────────────────────────
router.get('/me', authenticate, usersController.getMe);

router.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema, 'body'),
  usersController.updateMe,
);

router.post(
  '/me/change-password',
  authenticate,
  validate(changePasswordSchema, 'body'),
  usersController.changePassword,
);

// ── Admin user-management routes ─────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(listUsersQuerySchema, 'query'),
  usersController.listUsers,
);

router.get(
  '/:userId',
  authenticate,
  authorize('admin'),
  usersController.getUserById,
);

router.patch(
  '/:userId',
  authenticate,
  authorize('admin'),
  validate(updateUserAdminSchema, 'body'),
  usersController.updateUser,
);

router.delete(
  '/:userId',
  authenticate,
  authorize('admin'),
  usersController.deleteUser,
);

module.exports = router;

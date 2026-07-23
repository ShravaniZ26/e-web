'use strict';

const { Router } = require('express');
const usersController = require('./users.controller');
const usersValidator = require('./users.validator');
const { authenticate, authorize } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const router = Router();

// ── Current-user (me) routes ─────────────────────────────────────────────────
router.get(
  '/me',
  authenticate,
  usersController.getMe
);

router.patch(
  '/me',
  authenticate,
  validate(usersValidator.updateProfile),
  usersController.updateMe
);

router.post(
  '/me/change-password',
  authenticate,
  validate(usersValidator.changePassword),
  usersController.changePassword
);

// ── Admin user-management routes ─────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(usersValidator.listUsers, 'query'),
  usersController.getUsers
);

router.get(
  '/:userId',
  authenticate,
  authorize('admin'),
  usersController.getUserById
);

router.patch(
  '/:userId',
  authenticate,
  authorize('admin'),
  validate(usersValidator.adminUpdateUser),
  usersController.updateUser
);

router.delete(
  '/:userId',
  authenticate,
  authorize('admin'),
  usersController.deleteUser
);

module.exports = router;

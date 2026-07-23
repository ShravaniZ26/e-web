const { Router } = require('express');
const rolesController = require('./roles.controller');

const router = Router();

// Role CRUD
router.get('/', rolesController.listRoles);
router.post('/', rolesController.createRole);
router.get('/:roleId', rolesController.getRole);
router.put('/:roleId', rolesController.updateRole);
router.delete('/:roleId', rolesController.deleteRole);

// User-role assignments
router.get('/:roleId/users', rolesController.listUsersForRole);
router.post('/:roleId/users', rolesController.assignRoleToUser);
router.delete('/:roleId/users/:userId', rolesController.removeRoleFromUser);

module.exports = router;

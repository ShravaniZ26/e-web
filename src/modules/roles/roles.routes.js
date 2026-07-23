const { Router } = require('express');
const rolesController = require('./roles.controller');

const router = Router();

// Role CRUD
router.get('/', rolesController.listRoles);
router.post('/', rolesController.createRole);
router.get('/:roleId', rolesController.getRole);
router.put('/:roleId', rolesController.updateRole);
router.delete('/:roleId', rolesController.deleteRole);

// User-role associations (nested under roles)
router.get('/:roleId/users', rolesController.getUsersByRole);

module.exports = router;

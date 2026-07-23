const rolesService = require('./roles.service');

/**
 * GET /admin/roles
 * List all roles.
 */
async function listRoles(req, res, next) {
  try {
    const roles = await rolesService.getAllRoles();
    return res.status(200).json({ data: roles });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/roles
 * Create a new role.
 */
async function createRole(req, res, next) {
  try {
    const { name, description } = req.body;
    const role = await rolesService.createRole({ name, description });
    return res.status(201).json({ data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/roles/:roleId
 * Get a single role by ID.
 */
async function getRole(req, res, next) {
  try {
    const { roleId } = req.params;
    const role = await rolesService.getRoleById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found.' });
    }
    return res.status(200).json({ data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/roles/:roleId
 * Update an existing role.
 */
async function updateRole(req, res, next) {
  try {
    const { roleId } = req.params;
    const { name, description } = req.body;
    const role = await rolesService.updateRole(roleId, { name, description });
    if (!role) {
      return res.status(404).json({ message: 'Role not found.' });
    }
    return res.status(200).json({ data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/roles/:roleId
 * Delete a role.
 */
async function deleteRole(req, res, next) {
  try {
    const { roleId } = req.params;
    const deleted = await rolesService.deleteRole(roleId);
    if (!deleted) {
      return res.status(404).json({ message: 'Role not found.' });
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/roles/:roleId/users
 * List users that have the given role.
 */
async function getUsersByRole(req, res, next) {
  try {
    const { roleId } = req.params;
    const users = await rolesService.getUsersByRoleId(roleId);
    return res.status(200).json({ data: users });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/users/:userId/roles
 * Assign a role to a user.
 */
async function assignRoleToUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    const userRole = await rolesService.assignRoleToUser(userId, roleId);
    return res.status(201).json({ data: userRole });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/users/:userId/roles/:roleId
 * Revoke a role from a user.
 */
async function revokeRoleFromUser(req, res, next) {
  try {
    const { userId, roleId } = req.params;
    const removed = await rolesService.revokeRoleFromUser(userId, roleId);
    if (!removed) {
      return res.status(404).json({ message: 'User role assignment not found.' });
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/users/:userId/roles
 * List all roles assigned to a user.
 */
async function getRolesForUser(req, res, next) {
  try {
    const { userId } = req.params;
    const roles = await rolesService.getRolesForUser(userId);
    return res.status(200).json({ data: roles });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRoles,
  createRole,
  getRole,
  updateRole,
  deleteRole,
  getUsersByRole,
  assignRoleToUser,
  revokeRoleFromUser,
  getRolesForUser,
};

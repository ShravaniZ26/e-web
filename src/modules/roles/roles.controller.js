const rolesService = require('./roles.service');

/**
 * GET /roles
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
 * POST /roles
 * Body: { name: string, description?: string }
 */
async function createRole(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Role name is required.' });
    }

    const role = await rolesService.createRole({ name: name.trim(), description });
    return res.status(201).json({ data: role });
  } catch (err) {
    if (err.code === 'DUPLICATE_ROLE') {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * GET /roles/:roleId
 */
async function getRole(req, res, next) {
  try {
    const role = await rolesService.getRoleById(req.params.roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' });
    }
    return res.status(200).json({ data: role });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /roles/:roleId
 * Body: { name?: string, description?: string }
 */
async function updateRole(req, res, next) {
  try {
    const { name, description } = req.body;
    const updated = await rolesService.updateRole(req.params.roleId, { name, description });
    if (!updated) {
      return res.status(404).json({ error: 'Role not found.' });
    }
    return res.status(200).json({ data: updated });
  } catch (err) {
    if (err.code === 'DUPLICATE_ROLE') {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * DELETE /roles/:roleId
 */
async function deleteRole(req, res, next) {
  try {
    const deleted = await rolesService.deleteRole(req.params.roleId);
    if (!deleted) {
      return res.status(404).json({ error: 'Role not found.' });
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /roles/:roleId/users
 */
async function listUsersForRole(req, res, next) {
  try {
    const role = await rolesService.getRoleById(req.params.roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' });
    }
    const users = await rolesService.getUsersForRole(req.params.roleId);
    return res.status(200).json({ data: users });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /roles/:roleId/users
 * Body: { userId: string }
 */
async function assignRoleToUser(req, res, next) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const role = await rolesService.getRoleById(req.params.roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' });
    }

    const assignment = await rolesService.assignRoleToUser({
      roleId: req.params.roleId,
      userId,
    });
    return res.status(201).json({ data: assignment });
  } catch (err) {
    if (err.code === 'DUPLICATE_ASSIGNMENT') {
      return res.status(409).json({ error: err.message });
    }
    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

/**
 * DELETE /roles/:roleId/users/:userId
 */
async function removeRoleFromUser(req, res, next) {
  try {
    const removed = await rolesService.removeRoleFromUser({
      roleId: req.params.roleId,
      userId: req.params.userId,
    });
    if (!removed) {
      return res.status(404).json({ error: 'User-role assignment not found.' });
    }
    return res.status(204).send();
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
  listUsersForRole,
  assignRoleToUser,
  removeRoleFromUser,
};

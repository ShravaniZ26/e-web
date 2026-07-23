const db = require('../../db');

const ROLES_TABLE = 'roles';
const USER_ROLES_TABLE = 'user_roles';
const USERS_TABLE = 'users';

/**
 * Retrieve all roles.
 * @returns {Promise<Array>}
 */
async function getAllRoles() {
  return db(ROLES_TABLE).select('id', 'name', 'description', 'created_at', 'updated_at').orderBy('name');
}

/**
 * Retrieve a single role by its primary key.
 * @param {number|string} roleId
 * @returns {Promise<object|null>}
 */
async function getRoleById(roleId) {
  const role = await db(ROLES_TABLE)
    .select('id', 'name', 'description', 'created_at', 'updated_at')
    .where({ id: roleId })
    .first();
  return role || null;
}

/**
 * Create a new role.
 * @param {{ name: string, description?: string }} payload
 * @returns {Promise<object>}
 */
async function createRole({ name, description = null }) {
  const [id] = await db(ROLES_TABLE).insert(
    { name, description },
    ['id'],
  );
  const insertedId = typeof id === 'object' ? id.id : id;
  return getRoleById(insertedId);
}

/**
 * Update an existing role.
 * @param {number|string} roleId
 * @param {{ name?: string, description?: string }} payload
 * @returns {Promise<object|null>}
 */
async function updateRole(roleId, { name, description }) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  updates.updated_at = db.fn.now();

  const count = await db(ROLES_TABLE).where({ id: roleId }).update(updates);
  if (!count) return null;
  return getRoleById(roleId);
}

/**
 * Delete a role and its user associations.
 * @param {number|string} roleId
 * @returns {Promise<boolean>}
 */
async function deleteRole(roleId) {
  const count = await db(ROLES_TABLE).where({ id: roleId }).delete();
  return count > 0;
}

/**
 * Retrieve all users that have been assigned the given role.
 * @param {number|string} roleId
 * @returns {Promise<Array>}
 */
async function getUsersByRoleId(roleId) {
  return db(USER_ROLES_TABLE)
    .join(USERS_TABLE, `${USERS_TABLE}.id`, '=', `${USER_ROLES_TABLE}.user_id`)
    .where(`${USER_ROLES_TABLE}.role_id`, roleId)
    .select(
      `${USERS_TABLE}.id`,
      `${USERS_TABLE}.email`,
      `${USERS_TABLE}.name`,
      `${USER_ROLES_TABLE}.assigned_at`,
    );
}

/**
 * Assign a role to a user. Silently ignores duplicate assignments.
 * @param {number|string} userId
 * @param {number|string} roleId
 * @returns {Promise<object>}
 */
async function assignRoleToUser(userId, roleId) {
  const existing = await db(USER_ROLES_TABLE)
    .where({ user_id: userId, role_id: roleId })
    .first();

  if (existing) {
    return existing;
  }

  const payload = {
    user_id: userId,
    role_id: roleId,
    assigned_at: db.fn.now(),
  };

  await db(USER_ROLES_TABLE).insert(payload);

  return db(USER_ROLES_TABLE)
    .where({ user_id: userId, role_id: roleId })
    .first();
}

/**
 * Revoke a role from a user.
 * @param {number|string} userId
 * @param {number|string} roleId
 * @returns {Promise<boolean>}
 */
async function revokeRoleFromUser(userId, roleId) {
  const count = await db(USER_ROLES_TABLE)
    .where({ user_id: userId, role_id: roleId })
    .delete();
  return count > 0;
}

/**
 * Retrieve all roles assigned to a user.
 * @param {number|string} userId
 * @returns {Promise<Array>}
 */
async function getRolesForUser(userId) {
  return db(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${ROLES_TABLE}.id`, '=', `${USER_ROLES_TABLE}.role_id`)
    .where(`${USER_ROLES_TABLE}.user_id`, userId)
    .select(
      `${ROLES_TABLE}.id`,
      `${ROLES_TABLE}.name`,
      `${ROLES_TABLE}.description`,
      `${USER_ROLES_TABLE}.assigned_at`,
    );
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRoleId,
  assignRoleToUser,
  revokeRoleFromUser,
  getRolesForUser,
};

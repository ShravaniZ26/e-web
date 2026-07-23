const db = require('../../db');

// ---------------------------------------------------------------------------
// Role CRUD
// ---------------------------------------------------------------------------

/**
 * Return all roles ordered by name.
 * @returns {Promise<Array>}
 */
async function getAllRoles() {
  const { rows } = await db.query(
    `SELECT id, name, description, created_at, updated_at
     FROM roles
     ORDER BY name ASC`,
  );
  return rows;
}

/**
 * Return a single role by primary key, or null if not found.
 * @param {string|number} roleId
 * @returns {Promise<object|null>}
 */
async function getRoleById(roleId) {
  const { rows } = await db.query(
    `SELECT id, name, description, created_at, updated_at
     FROM roles
     WHERE id = $1`,
    [roleId],
  );
  return rows[0] || null;
}

/**
 * Create a new role.
 * @param {{ name: string, description?: string }} payload
 * @returns {Promise<object>}
 */
async function createRole({ name, description = null }) {
  const existing = await _findRoleByName(name);
  if (existing) {
    const err = new Error(`A role with the name "${name}" already exists.`);
    err.code = 'DUPLICATE_ROLE';
    throw err;
  }

  const { rows } = await db.query(
    `INSERT INTO roles (name, description)
     VALUES ($1, $2)
     RETURNING id, name, description, created_at, updated_at`,
    [name, description],
  );
  return rows[0];
}

/**
 * Update an existing role. Returns null when the role is not found.
 * @param {string|number} roleId
 * @param {{ name?: string, description?: string }} payload
 * @returns {Promise<object|null>}
 */
async function updateRole(roleId, { name, description }) {
  const role = await getRoleById(roleId);
  if (!role) return null;

  const newName = name !== undefined ? name.trim() : role.name;
  const newDescription = description !== undefined ? description : role.description;

  if (newName !== role.name) {
    const existing = await _findRoleByName(newName);
    if (existing && String(existing.id) !== String(roleId)) {
      const err = new Error(`A role with the name "${newName}" already exists.`);
      err.code = 'DUPLICATE_ROLE';
      throw err;
    }
  }

  const { rows } = await db.query(
    `UPDATE roles
     SET name = $1, description = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id, name, description, created_at, updated_at`,
    [newName, newDescription, roleId],
  );
  return rows[0] || null;
}

/**
 * Delete a role and its user-role associations. Returns true when deleted,
 * false when the role did not exist.
 * @param {string|number} roleId
 * @returns {Promise<boolean>}
 */
async function deleteRole(roleId) {
  // Remove associations first to respect FK constraints if cascade is not set.
  await db.query('DELETE FROM user_roles WHERE role_id = $1', [roleId]);

  const { rowCount } = await db.query(
    'DELETE FROM roles WHERE id = $1',
    [roleId],
  );
  return rowCount > 0;
}

// ---------------------------------------------------------------------------
// User-role associations
// ---------------------------------------------------------------------------

/**
 * Return all users assigned to the given role.
 * @param {string|number} roleId
 * @returns {Promise<Array>}
 */
async function getUsersForRole(roleId) {
  const { rows } = await db.query(
    `SELECT u.id, u.email, u.name, ur.created_at AS assigned_at
     FROM user_roles ur
     JOIN users u ON u.id = ur.user_id
     WHERE ur.role_id = $1
     ORDER BY u.name ASC`,
    [roleId],
  );
  return rows;
}

/**
 * Assign a role to a user.
 * @param {{ roleId: string|number, userId: string|number }} param0
 * @returns {Promise<object>}
 */
async function assignRoleToUser({ roleId, userId }) {
  // Verify the user exists.
  const { rows: userRows } = await db.query(
    'SELECT id FROM users WHERE id = $1',
    [userId],
  );
  if (!userRows.length) {
    const err = new Error('User not found.');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // Check for an existing assignment.
  const { rows: existing } = await db.query(
    'SELECT id FROM user_roles WHERE role_id = $1 AND user_id = $2',
    [roleId, userId],
  );
  if (existing.length) {
    const err = new Error('User is already assigned to this role.');
    err.code = 'DUPLICATE_ASSIGNMENT';
    throw err;
  }

  const { rows } = await db.query(
    `INSERT INTO user_roles (role_id, user_id)
     VALUES ($1, $2)
     RETURNING id, role_id, user_id, created_at`,
    [roleId, userId],
  );
  return rows[0];
}

/**
 * Remove a role from a user. Returns true when removed, false when the
 * assignment did not exist.
 * @param {{ roleId: string|number, userId: string|number }} param0
 * @returns {Promise<boolean>}
 */
async function removeRoleFromUser({ roleId, userId }) {
  const { rowCount } = await db.query(
    'DELETE FROM user_roles WHERE role_id = $1 AND user_id = $2',
    [roleId, userId],
  );
  return rowCount > 0;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function _findRoleByName(name) {
  const { rows } = await db.query(
    'SELECT id, name FROM roles WHERE LOWER(name) = LOWER($1)',
    [name],
  );
  return rows[0] || null;
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersForRole,
  assignRoleToUser,
  removeRoleFromUser,
};

const db = require('../../db');

/**
 * Fetch all addresses belonging to a user.
 * Default address is returned first.
 */
const getAddressesByUserId = async (userId) => {
  return db('addresses')
    .where({ user_id: userId })
    .orderBy('is_default', 'desc')
    .orderBy('created_at', 'desc');
};

/**
 * Fetch a single address by id, scoped to the authenticated user.
 * Throws 404 if not found.
 */
const getAddressById = async (addressId, userId) => {
  const address = await db('addresses')
    .where({ id: addressId, user_id: userId })
    .first();

  if (!address) {
    const err = new Error('Address not found.');
    err.statusCode = 404;
    throw err;
  }

  return address;
};

/**
 * Create a new address for the user.
 * - Validates pin code serviceability.
 * - Automatically marks the new address as default if it is the first one
 *   or if is_default is explicitly requested.
 * - Unsets the previous default when a new default is set.
 */
const createAddress = async (userId, data) => {
  const { is_default: requestedDefault = false, ...rest } = data;

  await assertPinCodeServiceable(rest.pin_code);

  return db.transaction(async (trx) => {
    const [{ count }] = await trx('addresses')
      .where({ user_id: userId })
      .count('id as count');

    const isFirstAddress = parseInt(count, 10) === 0;
    const shouldBeDefault = isFirstAddress || requestedDefault;

    if (shouldBeDefault && !isFirstAddress) {
      await trx('addresses')
        .where({ user_id: userId })
        .update({ is_default: false, updated_at: db.fn.now() });
    }

    const [address] = await trx('addresses')
      .insert({
        user_id: userId,
        ...rest,
        is_default: shouldBeDefault,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    return address;
  });
};

/**
 * Update an existing address.
 * - Validates pin code serviceability when pin_code is changed.
 * - Handles default address promotion logic.
 */
const updateAddress = async (addressId, userId, data) => {
  await getAddressById(addressId, userId);

  const { is_default: requestedDefault, ...rest } = data;

  if (rest.pin_code !== undefined) {
    await assertPinCodeServiceable(rest.pin_code);
  }

  return db.transaction(async (trx) => {
    if (requestedDefault) {
      await trx('addresses')
        .where({ user_id: userId })
        .update({ is_default: false, updated_at: db.fn.now() });
    }

    const updatePayload = {
      ...rest,
      updated_at: db.fn.now(),
    };

    if (requestedDefault !== undefined) {
      updatePayload.is_default = requestedDefault;
    }

    const [updated] = await trx('addresses')
      .where({ id: addressId, user_id: userId })
      .update(updatePayload)
      .returning('*');

    return updated;
  });
};

/**
 * Delete an address.
 * - If the deleted address was the default, promote the most recently
 *   created remaining address to default.
 */
const deleteAddress = async (addressId, userId) => {
  const address = await getAddressById(addressId, userId);

  await db.transaction(async (trx) => {
    await trx('addresses').where({ id: addressId, user_id: userId }).delete();

    if (address.is_default) {
      const next = await trx('addresses')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .first();

      if (next) {
        await trx('addresses')
          .where({ id: next.id })
          .update({ is_default: true, updated_at: db.fn.now() });
      }
    }
  });
};

/**
 * Check whether a pin code exists in serviceable_pin_codes.
 * Throws 422 when not serviceable.
 */
const assertPinCodeServiceable = async (pinCode) => {
  const record = await db('serviceable_pin_codes')
    .where({ pin_code: pinCode, is_active: true })
    .first();

  if (!record) {
    const err = new Error('Delivery is not available for the provided pin code.');
    err.statusCode = 422;
    err.code = 'PIN_CODE_NOT_SERVICEABLE';
    throw err;
  }
};

module.exports = {
  getAddressesByUserId,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  assertPinCodeServiceable,
};

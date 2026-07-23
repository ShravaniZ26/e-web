'use strict';

const db = require('../../config/db');

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BadRequestError';
    this.statusCode = 400;
  }
}

async function isPinCodeServiceable(pinCode) {
  const record = await db('serviceable_pin_codes').where({ pin_code: pinCode }).first();
  return !!record;
}

async function getAddresses(userId) {
  return db('addresses')
    .where({ user_id: userId })
    .orderBy([
      { column: 'is_default', order: 'desc' },
      { column: 'created_at', order: 'desc' },
    ]);
}

async function getAddressById(userId, addressId) {
  const address = await db('addresses').where({ id: addressId, user_id: userId }).first();
  if (!address) {
    throw new NotFoundError('Address not found.');
  }
  return address;
}

async function createAddress(userId, data) {
  const isServiceable = await isPinCodeServiceable(data.pin_code);
  if (!isServiceable) {
    throw new BadRequestError('Delivery is not available for this PIN code.');
  }

  return db.transaction(async (trx) => {
    const existingCount = await trx('addresses')
      .where({ user_id: userId })
      .count('id as count')
      .first();
    const hasNoAddresses = parseInt(existingCount.count, 10) === 0;

    const makeDefault = hasNoAddresses || data.is_default === true;

    if (makeDefault) {
      await trx('addresses').where({ user_id: userId }).update({ is_default: false });
    }

    const [insertedId] = await trx('addresses').insert({
      user_id: userId,
      full_name: data.full_name,
      phone_number: data.phone_number,
      address_line1: data.address_line1,
      address_line2: data.address_line2 || null,
      city: data.city,
      state: data.state,
      pin_code: data.pin_code,
      country: data.country,
      address_type: data.address_type,
      is_default: makeDefault,
    });

    return trx('addresses').where({ id: insertedId }).first();
  });
}

async function updateAddress(userId, addressId, data) {
  const existing = await getAddressById(userId, addressId);

  const incomingPinCode = data.pin_code;
  if (incomingPinCode && incomingPinCode !== existing.pin_code) {
    const isServiceable = await isPinCodeServiceable(incomingPinCode);
    if (!isServiceable) {
      throw new BadRequestError('Delivery is not available for this PIN code.');
    }
  }

  return db.transaction(async (trx) => {
    if (data.is_default === true) {
      await trx('addresses')
        .where({ user_id: userId })
        .whereNot({ id: addressId })
        .update({ is_default: false });
    }

    const updatePayload = {};
    const allowedFields = [
      'full_name',
      'phone_number',
      'address_line1',
      'address_line2',
      'city',
      'state',
      'pin_code',
      'country',
      'address_type',
      'is_default',
    ];
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        updatePayload[field] = data[field];
      }
    }

    await trx('addresses').where({ id: addressId, user_id: userId }).update(updatePayload);

    return trx('addresses').where({ id: addressId }).first();
  });
}

async function deleteAddress(userId, addressId) {
  const address = await getAddressById(userId, addressId);

  await db.transaction(async (trx) => {
    await trx('addresses').where({ id: addressId, user_id: userId }).delete();

    if (address.is_default) {
      const nextAddress = await trx('addresses')
        .where({ user_id: userId })
        .orderBy('created_at', 'asc')
        .first();
      if (nextAddress) {
        await trx('addresses').where({ id: nextAddress.id }).update({ is_default: true });
      }
    }
  });
}

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  isPinCodeServiceable,
  NotFoundError,
  BadRequestError,
};

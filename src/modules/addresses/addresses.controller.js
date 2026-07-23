'use strict';

const addressesService = require('./addresses.service');

async function getAddresses(req, res, next) {
  try {
    const addresses = await addressesService.getAddresses(req.user.id);
    return res.status(200).json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

async function getAddress(req, res, next) {
  try {
    const address = await addressesService.getAddressById(req.user.id, req.params.addressId);
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function createAddress(req, res, next) {
  try {
    const address = await addressesService.createAddress(req.user.id, req.body);
    return res.status(201).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const address = await addressesService.updateAddress(
      req.user.id,
      req.params.addressId,
      req.body,
    );
    return res.status(200).json({ success: true, data: address });
  } catch (err) {
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    await addressesService.deleteAddress(req.user.id, req.params.addressId);
    return res.status(200).json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAddresses, getAddress, createAddress, updateAddress, deleteAddress };

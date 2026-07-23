'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const authenticate = require('../../middleware/authenticate');
const addressesController = require('./addresses.controller');
const { validateBody, createAddressSchema, updateAddressSchema } = require('./addresses.validator');

router.use(authenticate);

router.get('/', addressesController.getAddresses);
router.post('/', validateBody(createAddressSchema), addressesController.createAddress);
router.get('/:addressId', addressesController.getAddress);
router.put('/:addressId', validateBody(updateAddressSchema), addressesController.updateAddress);
router.delete('/:addressId', addressesController.deleteAddress);

module.exports = router;

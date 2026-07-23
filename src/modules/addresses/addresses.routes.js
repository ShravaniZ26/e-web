const express = require('express');
const router = express.Router({ mergeParams: true });
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const addressController = require('./addresses.controller');
const {
  createAddressSchema,
  updateAddressSchema,
} = require('./addresses.validator');

router.use(authenticate);

router.get('/', addressController.getAddresses);
router.get('/:addressId', addressController.getAddress);
router.post('/', validate(createAddressSchema), addressController.createAddress);
router.put('/:addressId', validate(updateAddressSchema), addressController.updateAddress);
router.delete('/:addressId', addressController.deleteAddress);

module.exports = router;

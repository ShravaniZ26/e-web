const addressService = require('./addresses.service');

const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await addressService.getAddressesByUserId(userId);
    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
};

const getAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressService.getAddressById(addressId, userId);
    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const address = await addressService.createAddress(userId, req.body);
    return res.status(201).json({
      success: true,
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const address = await addressService.updateAddress(addressId, userId, req.body);
    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    await addressService.deleteAddress(addressId, userId);
    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
};

const authService = require('../services/authService');
const { asyncHandler } = require('../utils/errorHandler');

const authController = {
  register: asyncHandler(async (req, res) => {
    const { email, phone, password, fullName } = req.body;

    const result = await authService.register(email, phone, password, fullName);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  }),

  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { User } = require('../models');
    const user = await User.findById(userId);

    res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        wallet_balance: user.wallet_balance,
        status: user.status
      }
    });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { fullName, phone } = req.body;
    const { User } = require('../models');

    const updates = {};
    if (fullName) updates.full_name = fullName;
    if (phone) updates.phone = phone;

    const user = await User.updateProfile(userId, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  })
};

module.exports = authController;

const { User } = require('../models');
const { pool } = require('../config/database');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const settingsController = {
  // Change password
  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }

    const isValid = await User.verifyPassword(userId, currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [hash, userId]
    );

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  }),

  // Update email
  updateEmail: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      throw new AppError('New email and password confirmation are required', 400);
    }

    const isValid = await User.verifyPassword(userId, password);
    if (!isValid) {
      throw new AppError('Password is incorrect', 400);
    }

    // Check if email is already taken
    const existing = await User.findByEmail(newEmail);
    if (existing && existing.user_id !== userId) {
      throw new AppError('Email is already in use', 400);
    }

    await pool.query(
      'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [newEmail, userId]
    );

    res.status(200).json({ success: true, message: 'Email updated successfully' });
  }),

  // Update profile (name, phone)
  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { fullName, phone } = req.body;

    const updates = {};
    if (fullName && fullName.trim().length >= 2) updates.full_name = fullName.trim();
    if (phone) updates.phone = phone.trim();

    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid updates provided', 400);
    }

    const user = await User.updateProfile(userId, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { full_name: user.full_name, phone: user.phone }
    });
  }),

  // Upload profile picture
  uploadProfilePicture: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
      throw new AppError('No image file provided', 400);
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    await pool.query(
      'UPDATE users SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [imageUrl, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile picture updated',
      data: { profile_picture_url: imageUrl }
    });
  }),

  // Get profile with picture
  getFullProfile: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT user_id, email, full_name, phone, role, status, wallet_balance, profile_picture_url, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (!result.rows[0]) throw new AppError('User not found', 404);

    res.status(200).json({ success: true, data: result.rows[0] });
  }),

  // ===== Admin Management =====

  // List all admins
  listAdmins: asyncHandler(async (req, res) => {
    const result = await pool.query(
      `SELECT user_id, email, full_name, role, status, created_at
       FROM users
       WHERE role IN ('ADMIN', 'STAFF')
       ORDER BY created_at DESC`
    );

    res.status(200).json({ success: true, data: result.rows });
  }),

  // Create new admin
  createAdmin: asyncHandler(async (req, res) => {
    const { email, fullName, password, role } = req.body;

    if (!email || !fullName || !password) {
      throw new AppError('Email, full name, and password are required', 400);
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const adminRole = role === 'STAFF' ? 'STAFF' : 'ADMIN';

    const existing = await User.findByEmail(email);
    if (existing) {
      throw new AppError('Email is already in use', 400);
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create(email, '', hash, fullName, adminRole);

    res.status(201).json({
      success: true,
      message: `${adminRole} account created successfully`,
      data: user
    });
  }),

  // Deactivate/activate admin
  toggleAdminStatus: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (parseInt(userId) === currentUserId) {
      throw new AppError('Cannot deactivate your own account', 400);
    }

    const user = await User.findById(parseInt(userId));
    if (!user) throw new AppError('User not found', 404);

    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [newStatus, parseInt(userId)]
    );

    res.status(200).json({
      success: true,
      message: `Account ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`
    });
  })
};

module.exports = settingsController;

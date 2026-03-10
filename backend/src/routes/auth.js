const express = require('express');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators');
const router = express.Router();

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

// Logout - client-side operation, just return success
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

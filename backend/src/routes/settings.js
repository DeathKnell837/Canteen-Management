const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');
const profileUpload = require('../middleware/profileUpload');
const {
	validateSettingsProfile,
	validateSettingsPassword,
	validateSettingsEmail,
	validateCreateAdmin,
	validateUserIdParam
} = require('../validators');
const router = express.Router();

router.use(authenticate);

// Profile & Account
router.get('/profile', settingsController.getFullProfile);
router.put('/profile', validateSettingsProfile, settingsController.updateProfile);
router.put('/password', validateSettingsPassword, settingsController.changePassword);
router.put('/email', validateSettingsEmail, settingsController.updateEmail);
router.post('/profile/picture', profileUpload.single('picture'), settingsController.uploadProfilePicture);

// Admin management (admin only)
router.get('/admins', authorize('ADMIN'), settingsController.listAdmins);
router.post('/admins', authorize('ADMIN'), validateCreateAdmin, settingsController.createAdmin);
router.put('/admins/:userId/toggle', authorize('ADMIN'), validateUserIdParam, settingsController.toggleAdminStatus);

module.exports = router;

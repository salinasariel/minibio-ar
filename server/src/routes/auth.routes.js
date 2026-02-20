
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
// Recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
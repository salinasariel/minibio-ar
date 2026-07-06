const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema, resetPasswordSchema } = require('../lib/validate');

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);

// Verificación de email
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;

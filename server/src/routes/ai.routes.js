const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const verifyToken = require('../middleware/auth');

// Asistente IA (beta, solo usuarios con ai_enabled)
router.post('/page', verifyToken, aiController.generatePage);

module.exports = router;

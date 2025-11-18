const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Obtener perfil público por username
// Ejemplo: GET /api/public/juan_perez
router.get('/:username', publicController.getPublicProfile);

// Obtener página pública por ID (alternativa - opcional)
// Ejemplo: GET /api/public/page/123
router.get('/page/:pageId', publicController.getPublicPage);

module.exports = router;
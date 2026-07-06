const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// Las rutas específicas van ANTES que /:username
// ========================================

// Página pública por slug (endpoint canónico del perfil)
// Ejemplo: GET /api/public/page-by-slug/mi-cafe
router.get('/page-by-slug/:slug', publicController.getPageBySlug);

// Parámetros públicos (i18n / textos)
router.get('/paramPublic/:paramCode/:language', publicController.getPublicParams);

// Perfil público por username (primera página del usuario)
// Ejemplo: GET /api/public/juan_perez
router.get('/:username', publicController.getPublicProfile);

module.exports = router;

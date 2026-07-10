const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Tracking de visitas: límite estricto por IP
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros de visitas' },
});

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// Las rutas específicas van ANTES que /:username
// ========================================

// Página pública por slug (endpoint canónico del perfil)
// Ejemplo: GET /api/public/page-by-slug/mi-cafe
router.get('/page-by-slug/:slug', publicController.getPageBySlug);

// Registrar visita de página (analítica)
const statsController = require('../controllers/stats.controller');
router.post('/track/view', trackLimiter, statsController.trackView);

// Parámetros públicos (i18n / textos)
router.get('/paramPublic/:paramCode/:language', publicController.getPublicParams);

// Perfil público por username (primera página del usuario)
// Ejemplo: GET /api/public/juan_perez
router.get('/:username', publicController.getPublicProfile);

module.exports = router;

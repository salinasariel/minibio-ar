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

// ========================================
// Reservas / turnero (público)
// ========================================
const bookingController = require('../controllers/booking.controller');
const { validate, bookingPublicSchema } = require('../lib/validate');

// Crear reserva: límite estricto (anti-farmeo de turnos)
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // 10 reservas/hora por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas reservas, probá más tarde' },
});

router.get('/booking/by-token/:token', bookingController.getByToken);
router.post('/booking/cancel/:token', bookingController.cancelByToken);
router.get('/booking/:slug', bookingController.getPublicInfo);
router.get('/booking/:slug/availability', bookingController.getPublicAvailability);
router.post('/booking/:slug', bookingLimiter, validate(bookingPublicSchema), bookingController.createPublicBooking);

// Perfil público por username (primera página del usuario)
// Ejemplo: GET /api/public/juan_perez
router.get('/:username', publicController.getPublicProfile);

module.exports = router;

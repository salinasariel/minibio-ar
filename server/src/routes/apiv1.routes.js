const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const bookingController = require('../controllers/booking.controller');
const pageController = require('../controllers/page.controller');
const statsController = require('../controllers/stats.controller');
const verifyToken = require('../middleware/auth');
const requireFeature = require('../middleware/feature');
const {
  validate,
  loginSchema,
  bookingManualSchema,
  bookingStatusSchema,
} = require('../lib/validate');

// ========================================
// API PÚBLICA v1 (documentada en minibio.ar/api)
//
// Solo lectura y gestión de turnos. La creación de páginas,
// turneros y recursos se hace únicamente desde la app.
// Los endpoints de turnos requieren plan con feature 'bookings';
// el de estadísticas, feature 'stats' (validada en el controller).
// ========================================

// Anti fuerza bruta en el login de la API
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, probá de nuevo más tarde' },
});

// ---------- Autenticación ----------
// POST /api/v1/auth/login  { email, password } → { token, user }
router.post('/auth/login', loginLimiter, validate(loginSchema), authController.login);

// ---------- Páginas (solo lectura) ----------
// GET /api/v1/pages → { pages: [{ id, title, slug, created_at }] }
router.get('/pages', verifyToken, pageController.getMyPagesSummary);

// ---------- Turnos ----------
// GET /api/v1/bookings?from&to&status&page_id → { bookings }
router.get('/bookings', verifyToken, requireFeature('bookings'), bookingController.listAllBookings);

// POST /api/v1/bookings → crear un turno (equivale a la carga manual de la app)
router.post(
  '/bookings',
  verifyToken,
  requireFeature('bookings'),
  validate(bookingManualSchema),
  bookingController.createManualBooking
);

// PATCH /api/v1/bookings/:id  { status } → confirmar / cancelar / no_show / done
router.patch(
  '/bookings/:id',
  verifyToken,
  requireFeature('bookings'),
  validate(bookingStatusSchema),
  bookingController.updateBookingStatus
);

// Recursos reservables de una página (solo lectura, para armar el POST)
// GET /api/v1/resources/:pageId → { resources, settings }
router.get('/resources/:pageId', verifyToken, requireFeature('bookings'), bookingController.listResources);

// ---------- Estadísticas (solo GET) ----------
// GET /api/v1/stats → mismas métricas que la app (visitas, clicks, reservas)
router.get('/stats', verifyToken, statsController.getMyStats);

module.exports = router;

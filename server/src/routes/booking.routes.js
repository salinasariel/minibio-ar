const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const verifyToken = require('../middleware/auth');
const {
  validate,
  bookingResourceSchema,
  bookingResourceUpdateSchema,
  bookingManualSchema,
  bookingStatusSchema,
  bookingSettingsSchema,
  bookingExceptionSchema,
} = require('../lib/validate');

// Todas las rutas de la centralita requieren autenticación
router.use(verifyToken);

// Recursos reservables (ABM)
router.get('/resources/:pageId', bookingController.listResources);
router.post('/resources', validate(bookingResourceSchema), bookingController.createResource);
router.put('/resources/:id', validate(bookingResourceUpdateSchema), bookingController.updateResource);
router.delete('/resources/:id', bookingController.deleteResource);

// Configuración de reservas de la página
router.put('/settings/:pageId', validate(bookingSettingsSchema), bookingController.updateSettings);

// Excepciones (feriados / bloqueos de fecha)
router.get('/exceptions/:pageId', bookingController.listExceptions);
router.post('/exceptions', validate(bookingExceptionSchema), bookingController.createException);
router.delete('/exceptions/:id', bookingController.deleteException);

// Agenda
router.get('/page/:pageId', bookingController.listBookings);
router.post('/manual', validate(bookingManualSchema), bookingController.createManualBooking);
router.patch('/:id', validate(bookingStatusSchema), bookingController.updateBookingStatus);

module.exports = router;

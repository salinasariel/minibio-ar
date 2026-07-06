const express = require('express');
const router = express.Router();
const pageController = require('../controllers/page.controller');
const verifyToken = require('../middleware/auth');
const { validate, pageCreateSchema, pageUpdateSchema } = require('../lib/validate');

// ========================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ========================================

// Obtener mis páginas (del usuario autenticado)
router.get('/', verifyToken, pageController.getMyPages);

// Crear nueva página
router.post('/create', verifyToken, validate(pageCreateSchema), pageController.createPage);

// Obtener una página específica por ID
router.get('/:pageId', verifyToken, pageController.getPageById);

// Actualizar página
router.put('/:pageId', verifyToken, validate(pageUpdateSchema), pageController.updatePage);

// Eliminar página
router.delete('/:pageId', verifyToken, pageController.deletePage);

module.exports = router;

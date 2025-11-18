const express = require('express');
const router = express.Router();
const pageController = require('../controllers/page.controller');
const verifyToken = require('../middleware/auth');

// ========================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ========================================

// Obtener todas las páginas (admin - opcional, puedes comentar esta línea si no la necesitas)
router.get('/all', verifyToken, pageController.getAllPages);

// Obtener mis páginas (del usuario autenticado)
router.get('/', verifyToken, pageController.getMyPages);

// Obtener una página específica por ID
router.get('/:pageId', verifyToken, pageController.getPageById);

// Crear nueva página
router.post('/create', verifyToken, pageController.createPage);

// Actualizar página
router.put('/:pageId', verifyToken, pageController.updatePage);

// Eliminar página
router.delete('/:pageId', verifyToken, pageController.deletePage);

module.exports = router;
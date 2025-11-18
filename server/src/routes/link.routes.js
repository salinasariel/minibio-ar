const express = require('express');
const router = express.Router();
const linkController = require('../controllers/link.controller');
const verifyToken = require('../middleware/auth');

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

// Crear nuevo link
router.post('/', verifyToken, linkController.createLink);

// Obtener links de una página específica
router.get('/page/:pageId', verifyToken, linkController.getLinksByPage);

// Actualizar un link
router.put('/:id', verifyToken, linkController.updateLink);

// Eliminar un link
router.delete('/:id', verifyToken, linkController.deleteLink);

// Reordenar links (drag & drop)
router.patch('/reorder', verifyToken, linkController.reorderLinks);

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Tracking de clicks
router.post('/:id/click', linkController.trackClick);

module.exports = router;
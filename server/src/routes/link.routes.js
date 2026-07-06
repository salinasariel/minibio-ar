const express = require('express');
const router = express.Router();
const linkController = require('../controllers/link.controller');
const verifyToken = require('../middleware/auth');
const { validate, linkCreateSchema, linkUpdateSchema, reorderSchema } = require('../lib/validate');

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

// Crear nuevo link
router.post('/', verifyToken, validate(linkCreateSchema), linkController.createLink);

// Obtener links de una página específica (solo el dueño)
router.get('/page/:pageId', verifyToken, linkController.getLinksByPage);

// Reordenar links (drag & drop) — antes de /:id para no colisionar
router.patch('/reorder', verifyToken, validate(reorderSchema), linkController.reorderLinks);

// Actualizar un link
router.put('/:id', verifyToken, validate(linkUpdateSchema), linkController.updateLink);

// Eliminar un link
router.delete('/:id', verifyToken, linkController.deleteLink);

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Tracking de clicks
router.post('/:id/click', linkController.trackClick);

module.exports = router;

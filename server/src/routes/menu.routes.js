const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const verifyToken = require('../middleware/auth');
const { validate, menuItemSchema, menuItemUpdateSchema } = require('../lib/validate');

// Todas las rutas de menú requieren autenticación
router.post('/', verifyToken, validate(menuItemSchema), menuController.createMenuItem);
router.get('/page/:pageId', verifyToken, menuController.getMenuByPage);
router.put('/:id', verifyToken, validate(menuItemUpdateSchema), menuController.updateMenuItem);
router.delete('/:id', verifyToken, menuController.deleteMenuItem);

module.exports = router;

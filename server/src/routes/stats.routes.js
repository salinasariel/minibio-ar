const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const verifyToken = require('../middleware/auth');

// Estadísticas del usuario autenticado (todas sus páginas)
router.get('/', verifyToken, statsController.getMyStats);

module.exports = router;

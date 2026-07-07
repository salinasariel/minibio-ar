const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const verifyToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const { validate, registerSchema } = require('../lib/validate');

// Todas las rutas: token válido + admin verificado contra la DB
router.use(verifyToken, requireAdmin);

router.get('/users', adminController.listUsers);
router.post('/users', validate(registerSchema), adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/pages', adminController.listUserPages);
router.post('/users/:id/impersonate', adminController.impersonateUser);
router.delete('/pages/:id', adminController.deletePage);
router.get('/plans', adminController.listPlans);
router.put('/plans/:id', adminController.updatePlan);

module.exports = router;

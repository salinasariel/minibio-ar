const express = require('express');
const router = express.Router();
const linkController = require('../controllers/link.controller');
const verifyToken = require('../middleware/auth');

router.post('/', verifyToken, linkController.createLink);

module.exports = router;
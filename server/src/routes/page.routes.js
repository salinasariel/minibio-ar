const express = require('express');
const router = express.Router();
const pageController = require('../controllers/page.controller');
const verifyToken = require('../middleware/auth'); 
router.get('/getAll',verifyToken ,pageController.getAllPages);

router.post('/create', verifyToken, pageController.createPage);

module.exports = router;
const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, referralController.getMyReferrals);

module.exports = router;

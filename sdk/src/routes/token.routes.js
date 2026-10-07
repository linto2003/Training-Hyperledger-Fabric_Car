const express = require('express');
const TokenController = require('../controllers/token.controller');

const router = express.Router();

router.post('/initialize', TokenController.initialize);
router.post('/mint', TokenController.mint);
router.get('/balance/:account', TokenController.balance);
router.post('/transfer', TokenController.transfer);
router.post('/approve', TokenController.approve);
router.get('/allowance/:owner/:spender', TokenController.allowance);

module.exports = router;

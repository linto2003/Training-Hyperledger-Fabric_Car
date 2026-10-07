const express = require('express');
const IdentityController = require('../controllers/identity.controller');

const router = express.Router();

router.post('/create', IdentityController.createIdentity);

module.exports = router;

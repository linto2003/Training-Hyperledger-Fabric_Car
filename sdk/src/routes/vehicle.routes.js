const express = require('express');
const VehicleController = require('../controllers/vehicle.controller');

const router = express.Router();

router.post('/register', VehicleController.register);
router.get('/:vehicleId', VehicleController.get);
router.post('/inspect', VehicleController.inspect);
router.post('/verify', VehicleController.verify);
router.post('/transfer', VehicleController.transfer);
router.post('/deal', VehicleController.createDeal);
router.get('/:vehicleId/deal', VehicleController.getDeal);

module.exports = router;

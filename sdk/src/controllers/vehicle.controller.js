const FabricService = require('../services/fabric.service');

class VehicleController {

    static async register(req, res) {
        try {
            const {
                user,
                vehicleId,
                manufacturer,
                model,
                year,
                vin
            } = req.body;

            const result = await FabricService.submit(
                'Org1',
                user,
                'vehicle',
                'RegisterVehicle',
                vehicleId,
                manufacturer,
                model,
                String(year),
                vin
            );

            return res.status(201).json({
                success: true,
                result: JSON.parse(result)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async get(req, res) {
        try {
            const {
                org = 'Org1',
                user = 'admin'
            } = req.query;

            const result = await FabricService.evaluate(
                org,
                user,
                'vehicle',
                'GetVehicle',
                req.params.vehicleId
            );

            return res.json({
                success: true,
                result: JSON.parse(result)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async inspect(req, res) {
        try {
            const { user, vehicleId, result } = req.body;

            const response = await FabricService.submit(
                'Org3',
                user,
                'vehicle',
                'InspectVehicle',
                vehicleId,
                result
            );

            return res.json({
                success: true,
                result: JSON.parse(response)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async verify(req, res) {
        try {
            const { user, vehicleId } = req.body;

            const response = await FabricService.submit(
                'Org1',
                user,
                'vehicle',
                'VerifyVehicle',
                vehicleId
            );

            return res.json({
                success: true,
                result: JSON.parse(response)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async transfer(req, res) {
        try {
            const {
                org = 'Org1',
                user,
                vehicleId,
                newOwner
            } = req.body;

            const response = await FabricService.submit(
                org,
                user,
                'vehicle',
                'TransferOwnership',
                vehicleId,
                newOwner
            );

            return res.json({
                success: true,
                result: JSON.parse(response)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async createDeal(req, res) {
        try {
            const {
                user,
                vehicleId,
                originalPrice,
                discount,
                finalPrice
            } = req.body;

            const response = await FabricService.submit(
                'Org1',
                user,
                'vehicle',
                'CreatePrivateDeal',
                vehicleId,
                String(originalPrice),
                String(discount),
                String(finalPrice)
            );

            return res.status(201).json({
                success: true,
                result: JSON.parse(response)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getDeal(req, res) {
        try {
            const {
                org = 'Org1',
                user
            } = req.query;

            const response = await FabricService.evaluate(
                org,
                user,
                'vehicle',
                'GetPrivateDeal',
                req.params.vehicleId
            );

            return res.json({
                success: true,
                result: JSON.parse(response)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = VehicleController;

const IdentityService = require('../services/identity.service');

class IdentityController {

    static async createIdentity(req, res) {
        try {
            const {
                org,
                identityName,
                role
            } = req.body;

            if (!org || !identityName || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'org, identityName, and role are required'
                });
            }

            const result =
                await IdentityService.createIdentity(
                    org,
                    identityName,
                    role
                );

            return res.status(201).json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('[IdentityController]', error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = IdentityController;

const FabricService = require('../services/fabric.service');

class TokenController {

    static async initialize(req, res) {
        try {
            const { user, name = 'AutoCoin', symbol = 'AUTO' } = req.body;

            const result = await FabricService.submit(
                'Org1',
                user,
                'erc20',
                'Initialize',
                name,
                symbol
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

    static async mint(req, res) {
        try {
            const { user, account, amount } = req.body;

            const result = await FabricService.submit(
                'Org1',
                user,
                'erc20',
                'Mint',
                account,
                String(amount)
            );

            const parsed = JSON.parse(result);

            return res.json({
                success: true,
                txId: parsed.txId,
                balance: Number(parsed.result)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async balance(req, res) {
        try {
            const {
                org = 'Org1',
                user = 'admin'
            } = req.query;

            const result = await FabricService.evaluate(
                org,
                user,
                'erc20',
                'BalanceOf',
                req.params.account
            );

            const parsed = JSON.parse(result);

            return res.json({
                success: true,
                txId: parsed.txId,
                balance: Number(parsed.result)
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
                org,
                user,
                to,
                amount
            } = req.body;

            const result = await FabricService.submit(
                org,
                user,
                'erc20',
                'Transfer',
                to,
                String(amount)
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

    static async approve(req, res) {
        try {
            const {
                org,
                user,
                spender,
                amount
            } = req.body;

            const result = await FabricService.submit(
                org,
                user,
                'erc20',
                'Approve',
                spender,
                String(amount)
            );

            const parsed = JSON.parse(result);

            return res.json({
                success: true,
                txId: parsed.txId,
                allowance: Number(parsed.result)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async allowance(req, res) {
        try {
            const {
                org = 'Org1',
                user = 'admin'
            } = req.query;

            const result = await FabricService.evaluate(
                org,
                user,
                'erc20',
                'Allowance',
                req.params.owner,
                req.params.spender
            );

            const parsed = JSON.parse(result);

            return res.json({
                success: true,
                txId: parsed.txId,
                allowance: Number(parsed.result)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = TokenController;

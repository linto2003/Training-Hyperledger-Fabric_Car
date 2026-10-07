'use strict';

const { Contract } = require('fabric-contract-api');

const COLLECTION = 'DealerBuyerPrivateCollection';

class VehicleContract extends Contract {

    async RegisterVehicle(ctx, vehicleId, manufacturer, model, year, vin) {
        this._requireRole(ctx, 'Dealer');

        const existing = await ctx.stub.getState(vehicleId);

        if (existing.length > 0) {
            throw new Error(`Vehicle ${vehicleId} already exists`);
        }

        const callerId = this._getUserId(ctx);

        const vehicle = {
            vehicleId,
            manufacturer,
            model,
            year: Number(year),
            vin,
            inspectionStatus: 'PENDING',
            verified: false,
            owner: callerId,
            status: 'AVAILABLE'
        };

        await ctx.stub.putState(
            vehicleId,
            Buffer.from(JSON.stringify(vehicle))
        );

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: vehicle });
    }

    async GetVehicle(ctx, vehicleId) {
        const data = await ctx.stub.getState(vehicleId);

        if (data.length === 0) {
            throw new Error(`Vehicle ${vehicleId} does not exist`);
        }

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: JSON.parse(data.toString()) });
    }

    async InspectVehicle(ctx, vehicleId, result) {
        this._requireRole(ctx, 'Inspector');

        if (result !== 'PASSED' && result !== 'FAILED') {
            throw new Error('Inspection result must be either PASSED or FAILED');
        }

        const vehicle = await this._getVehicle(ctx, vehicleId);
        vehicle.inspectionStatus = result;

        await this._putVehicle(ctx, vehicleId, vehicle);
        return JSON.stringify({ txId: ctx.stub.getTxID(), result: vehicle });
    }

    async VerifyVehicle(ctx, vehicleId) {
        this._requireRole(ctx, 'Dealer');

        const vehicle = await this._getVehicle(ctx, vehicleId);
        const callerId = this._getUserId(ctx);

        if (vehicle.owner !== callerId) {
            throw new Error(`Only the owner can verify vehicle ${vehicleId}`);
        }

        if (vehicle.inspectionStatus !== 'PASSED') {
            throw new Error('Vehicle must pass inspection before verification');
        }

        vehicle.verified = true;

        await this._putVehicle(ctx, vehicleId, vehicle);
        return JSON.stringify({ txId: ctx.stub.getTxID(), result: vehicle });
    }

    async TransferOwnership(ctx, vehicleId, newOwnerId) {
        const callerId = this._getUserId(ctx);
        const role = this._getRole(ctx);

        if (role !== 'Dealer' && role !== 'Buyer') {
            throw new Error('Only Dealer or Buyer can transfer ownership');
        }

        const vehicle = await this._getVehicle(ctx, vehicleId);

        if (vehicle.owner !== callerId) {
            throw new Error(`Caller ${callerId} does not own vehicle ${vehicleId}`);
        }

        if (!vehicle.verified) {
            throw new Error('Vehicle must be verified first');
        }

        vehicle.owner = newOwnerId;
        vehicle.status = 'SOLD';

        await this._putVehicle(ctx, vehicleId, vehicle);
        return JSON.stringify({ txId: ctx.stub.getTxID(), result: vehicle });
    }

    async GetVehicleHistory(ctx, vehicleId) {
        const iterator = await ctx.stub.getHistoryForKey(vehicleId);
        const history = [];

        try {
            while (true) {
                const item = await iterator.next();

                if (item.value && item.value.value) {
                    history.push({
                        txId: item.value.txId,
                        timestamp: item.value.timestamp,
                        isDelete: item.value.isDelete,
                        value: item.value.isDelete
                            ? null
                            : JSON.parse(item.value.value.toString('utf8'))
                    });
                }

                if (item.done) {
                    break;
                }
            }
        } finally {
            await iterator.close();
        }

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: history });
    }

    async CreatePrivateDeal(ctx, vehicleId, originalPrice, discount, finalPrice) {
        this._requirePrivateCollectionMember(ctx);

        const vehicle = await this._getVehicle(ctx, vehicleId);
        const callerId = this._getUserId(ctx);

        if (vehicle.owner !== callerId && this._getRole(ctx) !== 'Buyer') {
            throw new Error(`Only the owner or a Buyer can create a private deal for ${vehicleId}`);
        }

        const deal = {
            vehicleId,
            originalPrice: Number(originalPrice),
            discount: Number(discount),
            finalPrice: Number(finalPrice),
            currency: 'INR',
            dealCreator: callerId
        };

        await ctx.stub.putPrivateData(
            COLLECTION,
            vehicleId,
            Buffer.from(JSON.stringify(deal))
        );

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: deal });
    }

    async GetPrivateDeal(ctx, vehicleId) {
        this._requirePrivateCollectionMember(ctx);

        const data = await ctx.stub.getPrivateData(
            COLLECTION,
            vehicleId
        );

        if (data.length === 0) {
            throw new Error(`Private deal for ${vehicleId} does not exist`);
        }

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: JSON.parse(data.toString()) });
    }

    _getUserId(ctx) {
        const userId = ctx.clientIdentity.getAttributeValue('userId');
        if (!userId) {
            return ctx.clientIdentity.getID();
        }
        return userId;
    }

    _getRole(ctx) {
        return ctx.clientIdentity.getAttributeValue('appRole');
    }

    _requireRole(ctx, expectedRole) {
        const role = this._getRole(ctx);
        if (role !== expectedRole) {
            throw new Error(`Unauthorized: Requires role ${expectedRole}, but caller has ${role || 'none'}`);
        }
    }

    _requirePrivateCollectionMember(ctx) {
        const currentMsp = ctx.clientIdentity.getMSPID();

        // Still relying on MSP for private data collection routing since PDC is org-level
        if (currentMsp !== 'Org1MSP' && currentMsp !== 'Org2MSP') {
            throw new Error('Only Org1 and Org2 can access the private deal collection');
        }
    }

    async _getVehicle(ctx, vehicleId) {
        const data = await ctx.stub.getState(vehicleId);

        if (data.length === 0) {
            throw new Error(`Vehicle ${vehicleId} does not exist`);
        }

        return JSON.parse(data.toString());
    }

    async _putVehicle(ctx, vehicleId, vehicle) {
        await ctx.stub.putState(
            vehicleId,
            Buffer.from(JSON.stringify(vehicle))
        );
    }
}

module.exports = VehicleContract;

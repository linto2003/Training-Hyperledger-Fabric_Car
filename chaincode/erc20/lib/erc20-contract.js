'use strict';

const { Contract } = require('fabric-contract-api');

class ERC20Contract extends Contract {

    async Initialize(ctx, name, symbol) {
        const existing = await ctx.stub.getState('TOKEN_INFO');

        if (existing.length > 0) {
            throw new Error('Token is already initialized');
        }

        const token = {
            name,
            symbol,
            totalSupply: 0
        };

        await ctx.stub.putState(
            'TOKEN_INFO',
            Buffer.from(JSON.stringify(token))
        );

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: token });
    }

    async Mint(ctx, accountId, amount) {
        this._requireRole(ctx, 'Admin');

        const value = this._positiveAmount(amount);
        const token = await this._getToken(ctx);
        const balance = await this._getBalance(ctx, accountId);

        await this._putBalance(ctx, accountId, balance + value);

        token.totalSupply += value;

        await ctx.stub.putState(
            'TOKEN_INFO',
            Buffer.from(JSON.stringify(token))
        );

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: String(balance + value) });
    }

    async BalanceOf(ctx, accountId) {
        return JSON.stringify({ txId: ctx.stub.getTxID(), result: String(await this._getBalance(ctx, accountId)) });
    }

    async Transfer(ctx, toAccountId, amount) {
        const value = this._positiveAmount(amount);
        const callerId = this._getUserId(ctx);

        const fromBalance = await this._getBalance(ctx, callerId);

        if (fromBalance < value) {
            throw new Error(`Insufficient balance for ${callerId}`);
        }

        const toBalance = await this._getBalance(ctx, toAccountId);

        await this._putBalance(ctx, callerId, fromBalance - value);
        await this._putBalance(ctx, toAccountId, toBalance + value);

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: 'Transfer successful' });
    }

    async Approve(ctx, spenderId, amount) {
        const callerId = this._getUserId(ctx);

        const value = this._positiveAmount(amount);
        const key = `ALLOWANCE_${callerId}_${spenderId}`;

        await ctx.stub.putState(
            key,
            Buffer.from(String(value))
        );

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: String(value) });
    }

    async Allowance(ctx, ownerId, spenderId) {
        const key = `ALLOWANCE_${ownerId}_${spenderId}`;
        const data = await ctx.stub.getState(key);

        const result = data.length === 0 ? '0' : data.toString();
        return JSON.stringify({ txId: ctx.stub.getTxID(), result });
    }

    async TransferFrom(ctx, fromAccountId, toAccountId, amount) {
        const value = this._positiveAmount(amount);
        const spenderId = this._getUserId(ctx);
        
        const allowanceKey = `ALLOWANCE_${fromAccountId}_${spenderId}`;
        const allowanceData = await ctx.stub.getState(allowanceKey);
        const allowance = allowanceData.length === 0
            ? 0
            : Number(allowanceData.toString());

        if (allowance < value) {
            throw new Error(`Insufficient allowance for spender ${spenderId}`);
        }

        const fromBalance = await this._getBalance(ctx, fromAccountId);

        if (fromBalance < value) {
            throw new Error(`Insufficient balance for ${fromAccountId}`);
        }

        const toBalance = await this._getBalance(ctx, toAccountId);

        await this._putBalance(ctx, fromAccountId, fromBalance - value);
        await this._putBalance(ctx, toAccountId, toBalance + value);

        await ctx.stub.putState(
            allowanceKey,
            Buffer.from(String(allowance - value))
        );

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: 'TransferFrom successful' });
    }

    async Burn(ctx, amount) {
        const callerId = this._getUserId(ctx);

        const value = this._positiveAmount(amount);
        const balance = await this._getBalance(ctx, callerId);

        if (balance < value) {
            throw new Error('Insufficient balance');
        }

        await this._putBalance(ctx, callerId, balance - value);

        const token = await this._getToken(ctx);
        token.totalSupply -= value;

        await ctx.stub.putState(
            'TOKEN_INFO',
            Buffer.from(JSON.stringify(token))
        );

        return JSON.stringify({ txId: ctx.stub.getTxID(), result: String(balance - value) });
    }

    async TotalSupply(ctx) {
        const token = await this._getToken(ctx);
        return JSON.stringify({ txId: ctx.stub.getTxID(), result: String(token.totalSupply) });
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

    async _getToken(ctx) {
        const data = await ctx.stub.getState('TOKEN_INFO');

        if (data.length === 0) {
            throw new Error('Token is not initialized');
        }

        return JSON.parse(data.toString());
    }

    async _getBalance(ctx, accountId) {
        const data = await ctx.stub.getState(`BALANCE_${accountId}`);

        return data.length === 0
            ? 0
            : Number(data.toString());
    }

    async _putBalance(ctx, accountId, amount) {
        await ctx.stub.putState(
            `BALANCE_${accountId}`,
            Buffer.from(String(amount))
        );
    }

    _positiveAmount(amount) {
        const value = Number(amount);

        if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
            throw new Error('Amount must be a positive integer');
        }

        return value;
    }
}

module.exports = ERC20Contract;

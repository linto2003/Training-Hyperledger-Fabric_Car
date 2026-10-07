const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { normalizeOrg, getOrgConfig, getOrgPath } = require('../config/network.config');

class IdentityService {

    static getWalletPath(org) {
        return path.join(
            __dirname,
            '..',
            '..',
            'wallet',
            normalizeOrg(org)
        );
    }

    static async getCAClientAndWallet(org) {
        const normalizedOrg = normalizeOrg(org);
        const orgConfig = getOrgConfig(normalizedOrg);
        const orgPath = getOrgPath(normalizedOrg);

        if (!process.env.FABRIC_NETWORK_PATH) {
            throw new Error('FABRIC_NETWORK_PATH is required');
        }

        const connectionProfilePath = path.join(
            orgPath,
            `connection-${normalizedOrg.toLowerCase()}.json`
        );

        if (!fs.existsSync(connectionProfilePath)) {
            throw new Error(
                `Connection profile not found: ${connectionProfilePath}`
            );
        }

        const ccp = JSON.parse(
            fs.readFileSync(connectionProfilePath, 'utf8')
        );

        const caInfo = ccp.certificateAuthorities[orgConfig.ca];

        if (!caInfo) {
            throw new Error(
                `CA ${orgConfig.ca} not found in ${connectionProfilePath}`
            );
        }

        const caTls = Array.isArray(caInfo.tlsCACerts.pem)
            ? caInfo.tlsCACerts.pem[0]
            : caInfo.tlsCACerts.pem;

        const ca = new FabricCAServices(
            caInfo.url,
            {
                trustedRoots: caTls,
                verify: false
            },
            caInfo.caName
        );

        const wallet = await Wallets.newFileSystemWallet(
            this.getWalletPath(normalizedOrg)
        );

        return {
            ca,
            wallet,
            ccp,
            org: normalizedOrg,
            mspId: orgConfig.mspId
        };
    }

    static async createIdentity(org, identityName, role, adminId = 'admin') {
        const {
            ca,
            wallet,
            ccp,
            mspId
        } = await this.getCAClientAndWallet(org);

        const existing = await wallet.get(identityName);

        if (existing) {
            return {
                identityName,
                org: normalizeOrg(org),
                role,
                mspId,
                created: false,
                message: 'Identity already exists in wallet'
            };
        }

        await this.ensureAdmin(org, adminId);

        const adminIdentity = await wallet.get(adminId);

        if (!adminIdentity) {
            throw new Error(
                `Admin identity ${adminId} is not available`
            );
        }

        const provider = wallet
            .getProviderRegistry()
            .getProvider(adminIdentity.type);

        const adminUser = await provider.getUserContext(
            adminIdentity,
            adminId
        );

        const secret = await ca.register(
            {
                enrollmentID: identityName,
                role: 'client',
                attrs: [
                    { name: 'userId', value: identityName, ecert: true },
                    { name: 'appRole', value: role, ecert: true }
                ]
            },
            adminUser
        );

        const enrollment = await ca.enroll({
            enrollmentID: identityName,
            enrollmentSecret: secret,
            attr_reqs: [
                { name: 'userId', optional: false },
                { name: 'appRole', optional: false }
            ]
        });

        await wallet.put(identityName, {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes()
            },
            mspId,
            type: 'X.509'
        });

        return {
            identityName,
            org: normalizeOrg(org),
            role,
            mspId,
            created: true,
            message: 'Identity created and stored in wallet'
        };
    }

    static async ensureAdmin(org, adminId = 'admin') {
        const {
            ca,
            wallet,
            ccp,
            mspId
        } = await this.getCAClientAndWallet(org);

        const existing = await wallet.get(adminId);

        if (existing) {
            return existing;
        }

        const orgConfig = getOrgConfig(org);
        const secretKey = `${normalizeOrg(org).toUpperCase()}_ADMIN_SECRET`;
        const adminSecret =
            process.env[secretKey] ||
            process.env.ORG_ADMIN_SECRET ||
            'adminpw';

        const enrollment = await ca.enroll({
            enrollmentID:
                process.env[`${normalizeOrg(org).toUpperCase()}_ADMIN_ID`] ||
                adminId,
            enrollmentSecret: adminSecret
        });

        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes()
            },
            mspId,
            type: 'X.509'
        };

        await wallet.put(adminId, identity);

        return identity;
    }

    static async getIdentity(org, identityName) {
        const { wallet } =
            await this.getCAClientAndWallet(org);

        const identity = await wallet.get(identityName);

        if (!identity) {
            throw new Error(
                `Identity "${identityName}" does not exist in ${normalizeOrg(org)} wallet. Create it first.`
            );
        }

        return identity;
    }
}

module.exports = IdentityService;

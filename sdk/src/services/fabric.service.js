const fs = require('fs');
const crypto = require('crypto');
const grpc = require('@grpc/grpc-js');
const {
    connect,
    hash,
    signers
} = require('@hyperledger/fabric-gateway');

const IdentityService = require('./identity.service');
const {
    normalizeOrg,
    getOrgConfig,
    getOrgPath
} = require('../config/network.config');

const utf8Decoder = new TextDecoder();

class FabricService {

    static async createGateway(org, identityName) {
        const normalizedOrg = normalizeOrg(org);
        const orgConfig = getOrgConfig(normalizedOrg);
        const identity = await IdentityService.getIdentity(
            normalizedOrg,
            identityName
        );

        const peerTlsPath = this.getPeerTlsPath(normalizedOrg);

        const tlsRootCert = fs.readFileSync(peerTlsPath);

        const client = new grpc.Client(
            `localhost:${orgConfig.peerPort}`,
            grpc.credentials.createSsl(tlsRootCert),
            {
                'grpc.ssl_target_name_override': orgConfig.peer,
                'grpc.default_authority': orgConfig.peer
            }
        );

        const privateKey = crypto.createPrivateKey(
            identity.credentials.privateKey
        );

        const gateway = connect({
            client,
            identity: {
                mspId: identity.mspId,
                credentials: Buffer.from(
                    identity.credentials.certificate
                )
            },
            signer: signers.newPrivateKeySigner(privateKey),
            hash: hash.sha256
        });

        return { gateway, client };
    }

    static getPeerTlsPath(org) {
        const orgPath = getOrgPath(org);

        return pathJoin(
            orgPath,
            'tlsca',
            `tlsca.${getOrgConfig(org).domain}-cert.pem`
        );
    }

    static async submit(org, identityName, chaincode, functionName, ...args) {
        const { gateway, client } =
            await this.createGateway(org, identityName);

        try {
            const network = gateway.getNetwork(
                process.env.CHANNEL_NAME || 'cartrade-channel'
            );

            const contract = network.getContract(chaincode);

            const result = await contract.submitTransaction(
                functionName,
                ...args
            );

            return utf8Decoder.decode(result);
        } finally {
            gateway.close();
            client.close();
        }
    }

    static async evaluate(org, identityName, chaincode, functionName, ...args) {
        const { gateway, client } =
            await this.createGateway(org, identityName);

        try {
            const network = gateway.getNetwork(
                process.env.CHANNEL_NAME || 'cartrade-channel'
            );

            const contract = network.getContract(chaincode);

            const result = await contract.evaluateTransaction(
                functionName,
                ...args
            );

            return utf8Decoder.decode(result);
        } finally {
            gateway.close();
            client.close();
        }
    }
}

function pathJoin(...parts) {
    return require('path').join(...parts);
}

module.exports = FabricService;

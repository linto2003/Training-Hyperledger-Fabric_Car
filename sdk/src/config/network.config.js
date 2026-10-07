const path = require('path');

const ORGS = {
    Org1: {
        mspId: 'Org1MSP',
        domain: 'org1.example.com',
        peer: 'peer0.org1.example.com',
        peerPort: 7051,
        ca: 'ca.org1.example.com'
    },
    Org2: {
        mspId: 'Org2MSP',
        domain: 'org2.example.com',
        peer: 'peer0.org2.example.com',
        peerPort: 9051,
        ca: 'ca.org2.example.com'
    },
    Org3: {
        mspId: 'Org3MSP',
        domain: 'org3.example.com',
        peer: 'peer0.org3.example.com',
        peerPort: 11051,
        ca: 'ca.org3.example.com'
    }
};

function normalizeOrg(org) {
    const key = Object.keys(ORGS).find(
        item => item.toLowerCase() === String(org).toLowerCase()
    );

    if (!key) {
        throw new Error(`Unknown organization: ${org}`);
    }

    return key;
}

function getOrgConfig(org) {
    return ORGS[normalizeOrg(org)];
}

function getOrgPath(org) {
    const normalized = normalizeOrg(org);
    const config = getOrgConfig(normalized);

    return path.join(
        process.env.FABRIC_NETWORK_PATH,
        'organizations',
        'peerOrganizations',
        config.domain
    );
}

module.exports = {
    ORGS,
    normalizeOrg,
    getOrgConfig,
    getOrgPath
};

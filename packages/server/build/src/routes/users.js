"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyUsersRoutes = void 0;
const shared = __importStar(require("@waci-demo/shared"));
const base64url_1 = __importDefault(require("base64url"));
const verify_1 = require("jose/jwt/verify");
const sign_1 = require("jose/jwt/sign");
const parse_1 = require("jose/jwk/parse");
const uuid_1 = require("uuid");
const vc_common_1 = require("@affinidi/vc-common");
const vc_data_1 = require("@affinidi/vc-data");
const json_web_signature_2020_1 = require("@transmute/json-web-signature-2020");
const did_resolver_1 = require("did-resolver");
const ed25519 = __importStar(require("@transmute/did-key-ed25519"));
const x25519 = __importStar(require("@transmute/did-key-x25519"));
const bls12381 = __importStar(require("@transmute/did-key-bls12381"));
const secp256k1 = __importStar(require("@transmute/did-key-secp256k1"));
const webCrypto = __importStar(require("@transmute/did-key-web-crypto"));
const auth_1 = require("@server/auth");
const cookies_1 = require("@server/cookies");
const Users_1 = require("@server/entities/Users");
const socket_1 = require("@server/socket");
const UsedTokens_1 = require("@server/entities/UsedTokens");
const waciJose_1 = require("@server/waciJose");
class JsonWebSignature extends json_web_signature_2020_1.JsonWebSignature {
    constructor(options) {
        super(options);
        this.type = 'JsonWebSignature2020';
    }
    matchProof({ proof }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log({ proofType: proof.type });
            return proof.type === 'https://w3id.org/security#JsonWebSignature2020' || proof.type === 'JsonWebSignature2020';
        });
    }
    verifySignature({ verifyData, verificationMethod, proof }) {
        return __awaiter(this, void 0, void 0, function* () {
            let { verifier } = this;
            if (!verifier) {
                const key = yield json_web_signature_2020_1.JsonWebKey.from(verificationMethod);
                // this suite relies on detached JWS....
                // so we need to make sure thats the signature format we are verifying.
                verifier = key.verifier();
            }
            return verifier.verify({ data: verifyData, signature: proof.jws });
        });
    }
}
const applyUsersRoutes = (app) => {
    // *************************
    // Utils
    // *************************
    const getPublicJwkForKey = (did, keyId, didDoc) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const idchar = did.split('did:key:').pop();
        const encodedType = idchar.substring(0, 4);
        const verificationMethod = (_a = didDoc.verificationMethod) === null || _a === void 0 ? void 0 : _a.find(({ id }) => keyId.includes(id));
        if (typeof verificationMethod === 'undefined') {
            throw new Error('Could not find publicKey for given keyId');
        }
        if (typeof verificationMethod.publicKeyBase58 === 'undefined') {
            throw new Error('Could not find publicKey for given keyId');
        }
        switch (encodedType) {
            case 'z6Mk':
                return ed25519.Ed25519KeyPair.fromFingerprint({ fingerprint: idchar }).toJwk();
            case 'z6LS':
                return x25519.X25519KeyPair.fromFingerprint({ fingerprint: idchar });
            case 'zUC7':
                return (yield bls12381.Bls12381G2KeyPair.fromFingerprint({ fingerprint: idchar })).toJsonWebKeyPair().publicKeyJwk;
            case 'z3tE':
                return (yield bls12381.Bls12381G1KeyPair.fromFingerprint({ fingerprint: idchar })).toJsonWebKeyPair().publicKeyJwk;
            case 'z5Tc':
                throw new Error('Unsupported encoding type');
            case 'zQ3s':
                return secp256k1.Secp256k1KeyPair.fromFingerprint({ fingerprint: idchar }).toJwk();
            case 'zXwp':
            case 'zACH':
            case 'zJss':
                return (yield webCrypto.KeyPair.fromFingerprint({ fingerprint: idchar })).toJsonWebKeyPair().publicKeyJwk;
            default:
                throw new Error('Unsupported encoding type');
        }
    });
    const getResponseTokenKey = (header, token) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof token.payload !== 'string') {
            throw new Error('Only string payloads are supported');
        }
        const payload = JSON.parse(base64url_1.default.decode(token.payload));
        if (typeof payload.iss !== 'string') {
            throw new Error('No issuer on the payload');
        }
        if (typeof header.kid !== 'string') {
            throw new Error('No keyId on the header');
        }
        if (typeof header.alg !== 'string') {
            throw new Error('No alg on the header');
        }
        const { didDocument } = yield app.resolveDID(payload.iss);
        if (!didDocument) {
            throw new Error('Cannot resolve DID Doc for issuer');
        }
        if (didDocument.id.startsWith('did:key')) {
            return parse_1.parseJwk(yield getPublicJwkForKey(payload.iss, header.kid, didDocument), header.alg);
        }
        else {
            throw new Error('Unsupported DID Method');
        }
    });
    // *************************
    // Sign Up
    // *************************
    app.get(shared.api.users.signUp.challengeToken.path, {
        schema: shared.api.users.signUp.challengeToken.schema,
    }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const challengeToken = yield new waciJose_1.SignOfferChallengeJWT({
            credential_manifest: {
                id: uuid_1.v4(),
                issuer: {
                    id: app.key.keyPair.controller,
                    name: 'Bloom Protocol',
                    styles: {
                        thumbnail: {
                            uri: 'https://bloom.co/favicon.png',
                            alt: 'Bloom Logo',
                        },
                    },
                },
                output_descriptors: [
                    {
                        id: 'account_output',
                        schema: 'https://schema.affinity-project.org/AccountCredentialPersonV1',
                        display: {
                            title: {
                                text: 'WACI Demo Account',
                            },
                            description: {
                                text: req.query.username,
                                path: ['$.credentialSubject.data.hasAccount.identifier'],
                            },
                        },
                    },
                ],
            },
            callbackUrl: `${app.env.host}${shared.api.users.signUp.submit.path}`,
            username: req.query.username,
            version: '0.1'
        })
            .setProtectedHeader({ alg: 'EdDSA', kid: app.key.keyPair.id })
            .setSubject(req.query.token)
            .setJti(uuid_1.v4())
            .setExpirationTime('30m')
            .setIssuer(app.key.keyPair.controller)
            .sign(app.key.keyLike);
        return reply.status(200).send({
            success: true,
            challengeToken
        });
    }));
    app.post(shared.api.users.signUp.submit.path, {
        schema: shared.api.users.signUp.submit.schema,
    }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const isUsed = yield UsedTokens_1.isTokenUsed(req.body.responseToken);
        if (isUsed) {
            return reply.status(400).send({
                success: false,
                message: 'Token has already been used'
            });
        }
        let result;
        try {
            result = yield waciJose_1.offerResponseJwtVerify(req.body.responseToken, {
                key: getResponseTokenKey,
            }, {
                key: app.key.keyLike,
                options: {
                    issuer: app.key.keyPair.controller
                }
            });
            const { username, sub } = result.challenge.payload;
            if (typeof username !== 'string')
                throw new Error('Username not set');
            if (typeof sub !== 'string')
                throw new Error('Subject not set');
            if (typeof result.challenge.payload.exp !== 'number')
                throw new Error('Missing exp');
            yield UsedTokens_1.useToken(req.body.responseToken, new Date(result.challenge.payload.exp * 1000));
        }
        catch (e) {
            console.log({ e });
            return reply.status(401).send({
                success: false,
                message: 'Response token is not valid'
            });
        }
        const { username, credential_manifest, sub: webSocketToken } = result.challenge.payload;
        const usersRepo = Users_1.Users.getRepo();
        if ((yield usersRepo.count({ where: { username } })) > 0) {
            return reply.status(400).send({
                success: false,
                message: 'Username already exists'
            });
        }
        const user = new Users_1.Users();
        user.username = username;
        const { id: userId } = yield usersRepo.save(user);
        const credential = yield vc_common_1.buildVCV1({
            unsigned: vc_common_1.buildVCV1Unsigned({
                skeleton: vc_common_1.buildVCV1Skeleton({
                    context: ['https://w3id.org/security/jws/v1', vc_data_1.getVCAccountPersonV1Context()],
                    type: 'AccountCredentialPersonV1',
                    id: `urn:uuid:${uuid_1.v4()}`,
                    credentialSubject: {
                        data: {
                            "@type": ["Person", "AccountPersonV1"],
                            hasAccount: {
                                "@type": "Account",
                                identifier: username,
                            }
                        }
                    },
                    holder: {
                        id: result.response.payload.iss
                    }
                }),
                issuanceDate: new Date().toISOString()
            }),
            issuer: {
                did: app.key.keyPair.controller,
                keyId: app.key.keyPair.id,
                privateKey: '',
            },
            getSignSuite: ({ controller, keyId }) => __awaiter(void 0, void 0, void 0, function* () {
                return new JsonWebSignature({
                    key: yield json_web_signature_2020_1.JsonWebKey.from(app.key.keyPair.toJsonWebKeyPair(true)),
                });
            }),
            documentLoader: app.documentLoader,
        });
        console.log({ credential });
        const unsignedVP = Object.assign(Object.assign({}, vc_common_1.buildVPV1Unsigned({
            id: `urn:uuid:${uuid_1.v4()}`,
            vcs: [credential],
            holder: {
                id: result.response.payload.iss
            },
            context: [
                'https://w3id.org/security/jws/v1',
                {
                    '@version': 1.1,
                    CredentialFulfillment: {
                        '@id': 'https://identity.foundation/credential-manifest/#credential-fulfillment',
                        '@type': '@id',
                        '@context': {
                            '@version': 1.1,
                            credential_fulfillment: {
                                '@id': 'https://identity.foundation/credential-manifest/#credential-fulfillment',
                                '@type': '@json',
                            },
                        },
                    },
                }
            ],
            type: 'CredentialFulfillment',
        })), { credential_fulfillment: {
                id: uuid_1.v4(),
                manifest_id: credential_manifest.id,
                descriptor_map: [
                    {
                        id: 'account_output',
                        format: 'ldp_vc',
                        path: '$.verifiableCredential[0]'
                    }
                ],
            } });
        const vp = yield vc_common_1.buildVPV1({
            unsigned: unsignedVP,
            holder: {
                did: app.key.keyPair.controller,
                keyId: app.key.keyPair.id,
                privateKey: '',
            },
            getSignSuite: ({ controller, keyId }) => __awaiter(void 0, void 0, void 0, function* () {
                return new JsonWebSignature({
                    key: yield json_web_signature_2020_1.JsonWebKey.from(app.key.keyPair.toJsonWebKeyPair(true)),
                });
            }),
            documentLoader: app.documentLoader,
            getProofPurposeOptions: () => ({
                challenge: uuid_1.v4(),
                domain: 'https://waci-demo.com'
            })
        });
        console.log({ vp });
        let redirectUrl;
        const authToken = yield new sign_1.SignJWT({})
            .setProtectedHeader({ alg: 'EdDSA', kid: app.key.keyPair.id })
            .setSubject(userId)
            .setExpirationTime('30m')
            .setIssuer(app.key.keyPair.controller)
            .sign(app.key.keyLike);
        if (req.body.from === 'button') {
            redirectUrl = `${app.env.host}/authenticate/${authToken}`;
        }
        else {
            console.log('sedning message to', { webSocketToken });
            yield socket_1.sendSocketMessage({
                type: 'notif/sign-up-submit',
                token: webSocketToken,
                payload: JSON.stringify({ authToken })
            });
        }
        return reply.status(200).send({
            success: true,
            verifiable_presentation: vp,
            redirectUrl,
        });
    }));
    // *************************
    // Sign In
    // *************************
    app.get(shared.api.users.signIn.challengeToken.path, {
        schema: shared.api.users.signIn.challengeToken.schema,
    }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const challengeToken = yield new waciJose_1.SignRequestChallengeJWT({
            presentation_definition: {
                id: uuid_1.v4(),
                name: 'Bloom Interoperability Demo',
                purpose: "There's no real purpose. It's all about the demo.",
                input_descriptors: [
                    {
                        id: 'waci_demo_account',
                        // Note: this may be changing, being discussed: https://github.com/decentralized-identity/presentation-exchange/issues/134
                        schema: {
                            name: 'WACI Demo Account',
                            uri: 'https://schema.affinity-project.org/AccountCredentialPersonV1',
                            purpose: 'We need your verified account credential',
                        },
                        constraints: {
                            fields: [
                                {
                                    path: [`$.type[?(@ == 'AccountCredentialPersonV1')]`],
                                    purpose: `We need need your verifiable credential to have the 'AccountCredentialPersonV1' type.`,
                                    filter: {
                                        type: 'array',
                                    },
                                },
                            ],
                        },
                    }
                ],
            },
            callbackUrl: `${app.env.host}${shared.api.users.signIn.submit.path}`,
            version: '1'
        })
            .setProtectedHeader({ alg: 'EdDSA', kid: app.key.keyPair.id })
            .setSubject(req.query.token)
            .setJti(uuid_1.v4())
            .setExpirationTime('30m')
            .setIssuer(app.key.keyPair.controller)
            .sign(app.key.keyLike);
        return reply.status(200).send({
            success: true,
            challengeToken,
        });
    }));
    app.post(shared.api.users.signIn.submit.path, {
        schema: shared.api.users.signIn.submit.schema,
    }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c;
        const isUsed = yield UsedTokens_1.isTokenUsed(req.body.responseToken);
        if (isUsed) {
            return reply.status(400).send({
                success: false,
                message: 'Token has already been used'
            });
        }
        let result;
        try {
            result = yield waciJose_1.requestResponseJwtVerify(req.body.responseToken, {
                key: getResponseTokenKey,
            }, {
                key: app.key.keyLike,
                options: {
                    issuer: app.key.keyPair.controller
                }
            });
            const { sub } = result.challenge.payload;
            if (typeof sub !== 'string')
                throw new Error('Subject not set');
            if (typeof result.challenge.payload.exp !== 'number')
                throw new Error('Missing exp');
            yield UsedTokens_1.useToken(req.body.responseToken, new Date(result.challenge.payload.exp * 1000));
        }
        catch (_d) {
            return reply.status(401).send({
                success: false,
                message: 'Response token is not valid'
            });
        }
        const presentation = result.response.payload['verifiable_presentation'];
        const validationResult = yield vc_common_1.validateVPV1({
            documentLoader: app.documentLoader,
            getVerifySuite: ({ controller, verificationMethod }) => __awaiter(void 0, void 0, void 0, function* () {
                const { didDocument } = yield app.resolveDID(controller);
                if (!didDocument) {
                    throw new Error('Cannot resolve DID Doc for controller');
                }
                const publicKeyJwk = yield getPublicJwkForKey(controller, verificationMethod, didDocument);
                return new JsonWebSignature({
                    key: yield json_web_signature_2020_1.JsonWebKey.from({
                        id: verificationMethod,
                        controller,
                        type: 'JsonWebKey2020',
                        privateKeyJwk: publicKeyJwk,
                        publicKeyJwk: publicKeyJwk,
                    }),
                });
            }),
        })(presentation);
        if (validationResult.kind === 'invalid') {
            console.log({ validationResult });
            validationResult.errors.forEach((e) => console.log({ errorMessage: e.message, errorKind: e.kind }));
            return reply.status(400).send({
                success: false,
                message: 'Invalid Presentation Submission'
            });
        }
        let userId;
        try {
            const credential = validationResult.data.verifiableCredential[0];
            const issuerDid = (_b = did_resolver_1.parse(credential.issuer)) === null || _b === void 0 ? void 0 : _b.did;
            const ourDid = (_c = did_resolver_1.parse(app.key.keyPair.controller)) === null || _c === void 0 ? void 0 : _c.did;
            if (!issuerDid || !ourDid || issuerDid !== ourDid) {
                throw new Error('Not issued by WACI Demo');
            }
            const username = credential.credentialSubject.data.hasAccount.identifier;
            const user = yield Users_1.Users.getRepo().findOneOrFail({ where: { username } });
            userId = user.id;
        }
        catch (_e) {
            return reply.status(400).send({
                success: false,
                message: 'Account credential not found in submission'
            });
        }
        const authToken = yield new sign_1.SignJWT({})
            .setProtectedHeader({ alg: 'EdDSA', kid: app.key.keyPair.id })
            .setSubject(userId)
            .setExpirationTime('30m')
            .setIssuer(app.key.keyPair.controller)
            .sign(app.key.keyLike);
        let redirectUrl;
        if (req.body.from === 'button') {
            redirectUrl = `${app.env.host}/authenticate/${authToken}`;
        }
        else {
            const { sub: webSocketToken } = result.challenge.payload;
            yield socket_1.sendSocketMessage({
                type: 'notif/sign-in-submit',
                token: webSocketToken,
                payload: JSON.stringify({ authToken })
            });
        }
        return reply.status(200).send({
            success: true,
            redirectUrl,
        });
    }));
    app.post(shared.api.users.signIn.authenticate.path, {
        schema: shared.api.users.signIn.authenticate.schema,
    }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const isUsed = yield UsedTokens_1.isTokenUsed(req.body.token);
        if (isUsed) {
            return reply.status(400).send({
                success: false,
                message: 'Token has already been used'
            });
        }
        let result;
        try {
            result = yield verify_1.jwtVerify(req.body.token, app.key.keyLike, { issuer: app.key.keyPair.controller });
            if (typeof result.payload.exp !== 'number')
                throw new Error('Expiration not set');
            if (typeof result.payload.sub === 'undefined')
                throw new Error('Subject not set');
            yield UsedTokens_1.useToken(req.body.token, new Date(result.payload.exp * 1000));
        }
        catch (_f) {
            return cookies_1.clearWebSocketCookie(reply).status(400).send({
                success: false,
                message: 'Token is invalid'
            });
        }
        return cookies_1.setUserCookie(reply, result.payload.sub).status(200).send({
            success: true
        });
    }));
    // *************************
    // Available
    // *************************
    app.post(shared.api.users.available.path, {
        schema: shared.api.users.available.schema,
    }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const count = yield Users_1.Users.getRepo().count({ where: { username: req.body.username } });
        return reply.status(200).send({
            available: count >= 1 ? false : true,
            success: true,
        });
    }));
    // *************************
    // Me
    // *************************
    app.get(shared.api.users.me.path, {
        schema: shared.api.users.me.schema,
        preHandler: app.auth([auth_1.verifyUser]),
    }, (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const user = auth_1.getUser(req);
        return reply.status(200).send({
            user: user.toView(),
            success: true,
        });
    }));
    // *************************
    // Log Out
    // *************************
    app.get(shared.api.users.logOut.path, {
        schema: shared.api.users.logOut.schema,
    }, (_, reply) => __awaiter(void 0, void 0, void 0, function* () {
        cookies_1.clearUserCookie(reply);
        return reply.status(200).send({
            success: true
        });
    }));
};
exports.applyUsersRoutes = applyUsersRoutes;
//# sourceMappingURL=users.js.map
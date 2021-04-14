"use strict";
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
exports.requestResponseJwtVerify = exports.SignRequestResponseJWT = exports.requestChallengeJwtVerify = exports.SignRequestChallengeJWT = exports.offerResponseJwtVerify = exports.SignOfferResponseJWT = exports.offerChallengeJwtVerify = exports.SignOfferChallengeJWT = void 0;
const sign_1 = __importDefault(require("jose/jwt/sign"));
const verify_1 = __importDefault(require("jose/jwt/verify"));
const errors_1 = require("jose/util/errors");
class SignOfferChallengeJWT extends sign_1.default {
    constructor(payload) {
        super(Object.assign(Object.assign({}, payload), { purpose: 'offer' }));
    }
    sign(key, options) {
        const _super = Object.create(null, {
            sign: { get: () => super.sign }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._payload['jti'] !== 'string')
                throw new errors_1.JWTInvalid('OfferChallengeJWT MUST have a jti claim');
            if (typeof this._payload['iss'] !== 'string')
                throw new errors_1.JWTInvalid('OfferChallengeJWT MUST have an iss claim');
            return _super.sign.call(this, key, options);
        });
    }
}
exports.SignOfferChallengeJWT = SignOfferChallengeJWT;
const offerChallengeJwtVerifyV1 = (result) => {
    if (typeof result.payload.iss !== 'string') {
        throw new errors_1.JWTClaimValidationFailed('"iss" claim check failed', 'iss', 'check_failed');
    }
    if (result.payload['purpose'] !== 'offer') {
        throw new errors_1.JWTClaimValidationFailed('"purpose" claim check failed', 'purpose', 'check_failed');
    }
    if (typeof result.payload['credential_manifest'] !== 'object') {
        throw new errors_1.JWTClaimValidationFailed('"credential_manifest" claim check failed', 'credential_manifest', 'check_failed');
    }
};
const offerChallengeJwtVerify = (jwt, key, options) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield verify_1.default(jwt, key, options);
    switch (result.payload['version']) {
        case '0.1':
        case '1':
            offerChallengeJwtVerifyV1(result);
            break;
        default:
            throw new errors_1.JWTClaimValidationFailed('"version" is an unknown value', 'version', 'invalid');
    }
    return result;
});
exports.offerChallengeJwtVerify = offerChallengeJwtVerify;
class SignOfferResponseJWT extends sign_1.default {
    constructor(payload) {
        super(payload);
    }
    sign(key, options) {
        const _super = Object.create(null, {
            sign: { get: () => super.sign }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._payload['iss'] !== 'string')
                throw new errors_1.JWTInvalid('OfferResponseJWT MUST have an iss claim');
            if (typeof this._payload['aud'] !== 'string')
                throw new errors_1.JWTInvalid('OfferResponseJWT MUST have an aud claim');
            return _super.sign.call(this, key, options);
        });
    }
}
exports.SignOfferResponseJWT = SignOfferResponseJWT;
const offerResponseJwtVerifyV1 = (responseResult, challengeResult) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof responseResult.payload.iss !== 'string') {
        throw new errors_1.JWTClaimValidationFailed('"iss" claim check failed', 'iss', 'check_failed');
    }
    if (typeof challengeResult.payload.aud === 'string' && challengeResult.payload.aud !== responseResult.payload.iss) {
        throw new errors_1.JWTClaimValidationFailed('"iss" claim check failed, the "iss" of the response does not match the "aud" of the challenge', 'iss', 'check_failed');
    }
    if (typeof responseResult.payload.aud !== 'string') {
        throw new errors_1.JWTClaimValidationFailed('"aud" claim check failed', 'aud', 'check_failed');
    }
    if (challengeResult.payload.iss !== responseResult.payload.aud) {
        throw new errors_1.JWTClaimValidationFailed('"aud" claim check failed, the "aud" of the response does not match the "iss" of the challenge', 'aud', 'check_failed');
    }
    // `offerChallengeJwtVerifyV1` throws an error if challengeResult.payload['credential_manifest'] is not an object
    if (typeof challengeResult.payload['credential_manifest'] === 'object' && challengeResult.payload['credential_manifest'] !== null) {
        if ("presentation_definition" in challengeResult.payload['credential_manifest'] && !responseResult.payload['verifiable_presentation']) {
            throw new errors_1.JWTClaimValidationFailed('"verifiable_presentation" claim check failed, no "verifiable_presentation" in the response but a "presentation_definition" is defined in the challenge', 'verifiable_presentation', 'check_failed');
        }
    }
});
const offerResponseJwtVerify = (jwt, response, challenge) => __awaiter(void 0, void 0, void 0, function* () {
    const responseResult = yield verify_1.default(jwt, response.key, response.options);
    if (typeof responseResult.payload['challenge'] !== 'string') {
        throw new errors_1.JWTClaimValidationFailed('"challenge" claim check failed', 'challenge', 'check_failed');
    }
    const challengeResult = yield exports.offerChallengeJwtVerify(responseResult.payload['challenge'], challenge.key, challenge.options);
    // Verify the response based on the challenge's version
    switch (challengeResult.payload['version']) {
        case '0.1':
        case '1':
            offerResponseJwtVerifyV1(responseResult, challengeResult);
            break;
        default:
            throw new errors_1.JWTClaimValidationFailed('"version" is an unknown value', 'version', 'invalid');
    }
    return { response: responseResult, challenge: challengeResult };
});
exports.offerResponseJwtVerify = offerResponseJwtVerify;
class SignRequestChallengeJWT extends sign_1.default {
    constructor(payload) {
        super(Object.assign(Object.assign({}, payload), { purpose: 'request' }));
    }
    sign(key, options) {
        const _super = Object.create(null, {
            sign: { get: () => super.sign }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._payload['jti'] !== 'string')
                throw new errors_1.JWTInvalid('RequestChallengeJWT MUST have a jti claim');
            if (typeof this._payload['iss'] !== 'string')
                throw new errors_1.JWTInvalid('RequestChallengeJWT MUST have an iss claim');
            return _super.sign.call(this, key, options);
        });
    }
}
exports.SignRequestChallengeJWT = SignRequestChallengeJWT;
const requestChallengeJwtVerifyV1 = (result) => {
    if (typeof result.payload.iss !== 'string') {
        throw new errors_1.JWTClaimValidationFailed('"iss" claim check failed', 'iss', 'check_failed');
    }
    if (result.payload['purpose'] !== 'request') {
        throw new errors_1.JWTClaimValidationFailed('"purpose" claim check failed', 'purpose', 'check_failed');
    }
    if (typeof result.payload['presentation_definition'] !== 'object') {
        throw new errors_1.JWTClaimValidationFailed('"presentation_definition" claim check failed', 'presentation_definition', 'check_failed');
    }
};
const requestChallengeJwtVerify = (jwt, key, options) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield verify_1.default(jwt, key, options);
    switch (result.payload['version']) {
        case '0.1':
        case '1':
            requestChallengeJwtVerifyV1(result);
            break;
        default:
            throw new errors_1.JWTClaimValidationFailed('"version" is an unknown value', 'version', 'invalid');
    }
    return result;
});
exports.requestChallengeJwtVerify = requestChallengeJwtVerify;
class SignRequestResponseJWT extends sign_1.default {
    constructor(payload) {
        super(payload);
    }
    sign(key, options) {
        const _super = Object.create(null, {
            sign: { get: () => super.sign }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this._payload['iss'] !== 'string')
                throw new errors_1.JWTInvalid('RequestResponseJWT MUST have an iss claim');
            if (typeof this._payload['aud'] !== 'string')
                throw new errors_1.JWTInvalid('RequestResponseJWT MUST have an aud claim');
            return _super.sign.call(this, key, options);
        });
    }
}
exports.SignRequestResponseJWT = SignRequestResponseJWT;
const requestResponseJwtVerifyV1 = (responseResult, challengeResult) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof responseResult.payload.iss !== 'string') {
        throw new errors_1.JWTClaimValidationFailed('"iss" claim check failed', 'iss', 'check_failed');
    }
    if (typeof challengeResult.payload.aud === 'string' && challengeResult.payload.aud !== responseResult.payload.iss) {
        throw new errors_1.JWTClaimValidationFailed('"iss" claim check failed, the "iss" of the response does not match the "aud" of the challenge', 'iss', 'check_failed');
    }
    if (typeof responseResult.payload.aud !== 'string') {
        throw new errors_1.JWTClaimValidationFailed('"aud" claim check failed', 'aud', 'check_failed');
    }
    if (challengeResult.payload.iss !== responseResult.payload.aud) {
        throw new errors_1.JWTClaimValidationFailed('"aud" claim check failed, the "aud" of the response does not match the "iss" of the challenge', 'aud', 'check_failed');
    }
    if (typeof responseResult.payload['verifiable_presentation'] !== 'object') {
        throw new errors_1.JWTClaimValidationFailed('"verifiable_presentation" claim check failed', 'verifiable_presentation', 'check_failed');
    }
});
const requestResponseJwtVerify = (jwt, response, challenge) => __awaiter(void 0, void 0, void 0, function* () {
    const responseResult = yield verify_1.default(jwt, response.key, response.options);
    if (typeof responseResult.payload['challenge'] !== 'string') {
        throw new errors_1.JWTClaimValidationFailed('"challenge" claim check failed', 'challenge', 'check_failed');
    }
    const challengeResult = yield exports.requestChallengeJwtVerify(responseResult.payload['challenge'], challenge.key, challenge.options);
    // Verify the response based on the challenge's version
    switch (challengeResult.payload['version']) {
        case '0.1':
        case '1':
            requestResponseJwtVerifyV1(responseResult, challengeResult);
            break;
        default:
            throw new errors_1.JWTClaimValidationFailed('"version" is an unknown value', 'version', 'invalid');
    }
    return { response: responseResult, challenge: challengeResult };
});
exports.requestResponseJwtVerify = requestResponseJwtVerify;
//# sourceMappingURL=index.js.map
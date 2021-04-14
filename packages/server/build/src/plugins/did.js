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
exports.didPlugin = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const did_key_ed25519_1 = require("@transmute/did-key-ed25519");
const parse_1 = require("jose/jwk/parse");
const did_key_js_1 = require("@transmute/did-key.js");
const did_resolver_1 = require("did-resolver");
const jsonld = require('jsonld');
const pluginCallback = (fastify, { controller, id, publicKeyBase58, privateKeyBase58 }, done) => __awaiter(void 0, void 0, void 0, function* () {
    const keyPair = did_key_ed25519_1.Ed25519KeyPair.from({
        controller,
        id,
        type: 'Ed25519VerificationKey2018',
        publicKeyBase58,
        privateKeyBase58,
    });
    const resolveKeyDID = (did) => __awaiter(void 0, void 0, void 0, function* () {
        const { didDocument, didDocumentMetadata } = yield did_key_js_1.resolver.resolve(did);
        return {
            didResolutionMetadata: {},
            didDocument,
            didDocumentMetadata,
        };
    });
    const resolveDID = (did) => {
        return new did_resolver_1.Resolver({ key: resolveKeyDID }).resolve(did);
    };
    const documentLoader = (url) => __awaiter(void 0, void 0, void 0, function* () {
        if (url.startsWith('did:')) {
            console.log({ url });
            const { didDocument } = yield resolveDID(url);
            console.log({ didDocument });
            return {
                contextUrl: null,
                document: didDocument,
                documentUrl: url,
            };
        }
        return jsonld.documentLoaders.node()(url);
    });
    fastify.decorate('documentLoader', documentLoader);
    fastify.decorate('resolveDID', resolveDID);
    fastify.decorate('key', {
        keyPair,
        keyLike: yield parse_1.parseJwk(yield keyPair.toJwk(true), 'EdDSA')
    });
    done();
});
exports.didPlugin = fastify_plugin_1.default(pluginCallback, '3.x');
//# sourceMappingURL=did.js.map
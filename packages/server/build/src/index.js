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
const path = __importStar(require("path"));
const fastify_1 = __importDefault(require("fastify"));
const fastify_cors_1 = __importDefault(require("fastify-cors"));
const fastify_cookie_1 = __importDefault(require("fastify-cookie"));
const fastify_helmet_1 = __importDefault(require("fastify-helmet"));
const fastify_auth_1 = __importDefault(require("fastify-auth"));
const fastify_static_1 = __importDefault(require("fastify-static"));
const fastify_compress_1 = __importDefault(require("fastify-compress"));
const routes_1 = require("@server/routes");
const database_1 = require("@server/database");
const socket_1 = require("@server/socket");
const did_1 = require("./plugins/did");
const environment_1 = require("./environment");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const app = fastify_1.default({
        logger: true,
    });
    socket_1.applySocket(app);
    yield database_1.databaseManager.createDatabaseConnection(app.log.debug);
    const env = environment_1.getEnv();
    app.decorateRequest('user', undefined);
    app.decorateRequest('wsToken', undefined);
    app.decorate('env', env);
    app.register(fastify_compress_1.default);
    app.register(fastify_cors_1.default);
    // CSP will be handled on the client
    app.register(fastify_helmet_1.default, { contentSecurityPolicy: false });
    app.register(fastify_cookie_1.default, { secret: env.sessionSecret });
    app.register(fastify_auth_1.default);
    app.register(fastify_static_1.default, {
        root: path.join(__dirname, '..', 'public'),
        wildcard: false,
    });
    app.register(did_1.didPlugin, env.did);
    app.register(routes_1.routes);
    app.get('*', (_, reply) => __awaiter(void 0, void 0, void 0, function* () {
        return reply.sendFile('index.html');
    }));
    app.listen({ port: env.port }).then((address) => {
        app.log.info(`server listening on ${address}`);
    });
    app.ready(() => {
        console.log(app.printRoutes());
    });
});
main()
    .then(() => console.log('WACI Demo instance started'))
    .catch((error) => console.log('WACI Demo instance failed to start', error));
//# sourceMappingURL=index.js.map
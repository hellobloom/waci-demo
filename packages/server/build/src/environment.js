"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = void 0;
const fluent_json_schema_1 = __importDefault(require("fluent-json-schema"));
const env_schema_1 = __importDefault(require("env-schema"));
const getEnv = () => {
    const env = env_schema_1.default({
        schema: fluent_json_schema_1.default.object()
            .prop('PORT', fluent_json_schema_1.default.number().default(3000).required())
            .prop('SESSION_SECRET', fluent_json_schema_1.default.string().required())
            .prop('DATABASE_URL', fluent_json_schema_1.default.string().required())
            .prop('HOST', fluent_json_schema_1.default.string())
            .prop('DID_CONTROLLER', fluent_json_schema_1.default.string().required())
            .prop('DID_ID', fluent_json_schema_1.default.string().required())
            .prop('DID_PUBLIC_KEY_BASE_58', fluent_json_schema_1.default.string().required())
            .prop('DID_PRIVATE_KEY_BASE_58', fluent_json_schema_1.default.string().required()),
        dotenv: true,
    });
    return {
        port: env.PORT,
        sessionSecret: env.SESSION_SECRET,
        dbUrl: env.DATABASE_URL,
        host: env.NGROK_HOST || env.HOST || `http://localhost:${env.PORT}`,
        did: {
            controller: env.DID_CONTROLLER,
            id: env.DID_ID,
            publicKeyBase58: env.DID_PUBLIC_KEY_BASE_58,
            privateKeyBase58: env.DID_PRIVATE_KEY_BASE_58,
        }
    };
};
exports.getEnv = getEnv;
//# sourceMappingURL=environment.js.map
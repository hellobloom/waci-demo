"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('base64');
};
exports.hashToken = hashToken;
//# sourceMappingURL=util.js.map
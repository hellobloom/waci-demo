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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebsocketToken = exports.verifyWebsocketToken = exports.getUser = exports.verifyUser = void 0;
const Users_1 = require("@server/entities/Users");
const cookies_1 = require("@server/cookies");
const verifyUser = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const signedCookie = req.cookies[cookies_1.userCookieKey];
    if (!signedCookie)
        throw new Error('User not signed in');
    const { valid, value: userId } = reply.unsignCookie(signedCookie);
    if (!valid)
        throw new Error('Cookie is invalid');
    if (!userId)
        throw new Error('User not signed in');
    const user = yield Users_1.Users.getRepo().findOne({ where: { id: userId } });
    if (!user)
        throw new Error('User does not exist');
    req.user = user;
});
exports.verifyUser = verifyUser;
const getUser = (req) => {
    const { user } = req;
    if (typeof user === 'undefined')
        throw new Error('User not attached to request');
    return user;
};
exports.getUser = getUser;
const verifyWebsocketToken = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const signedCookie = req.cookies[cookies_1.webSocketCookieKey];
    if (!signedCookie)
        throw new Error('No websocket token');
    const { valid, value: wsToken } = reply.unsignCookie(signedCookie);
    if (!valid)
        throw new Error('Cookie is invalid');
    if (!wsToken)
        throw new Error('No websocket token');
    req.wsToken = wsToken;
});
exports.verifyWebsocketToken = verifyWebsocketToken;
const getWebsocketToken = (req) => {
    const { wsToken } = req;
    if (typeof wsToken === 'undefined')
        throw new Error('Web socket token not attached to request');
    return wsToken;
};
exports.getWebsocketToken = getWebsocketToken;
//# sourceMappingURL=auth.js.map
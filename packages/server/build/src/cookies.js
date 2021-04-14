"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearWebSocketCookie = exports.clearUserCookie = exports.setWebSocketCookie = exports.setUserCookie = exports.webSocketCookieKey = exports.userCookieKey = void 0;
exports.userCookieKey = 'wd_user';
const userCookieKeyMaxAge = 365 * 24 * 60 * 60 * 1000;
exports.webSocketCookieKey = 'wd_ws';
const webSocketCookieKeyMaxAge = 365 * 24 * 60 * 60 * 1000;
const setCookie = (cookieKey, maxAge) => (reply, value) => reply.setCookie(cookieKey, value, {
    maxAge,
    signed: true,
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: true,
});
exports.setUserCookie = setCookie(exports.userCookieKey, userCookieKeyMaxAge);
exports.setWebSocketCookie = setCookie(exports.webSocketCookieKey, webSocketCookieKeyMaxAge);
const clearCookie = (cookieKey) => (reply) => reply.clearCookie(cookieKey);
exports.clearUserCookie = clearCookie(exports.userCookieKey);
exports.clearWebSocketCookie = clearCookie(exports.userCookieKey);
//# sourceMappingURL=cookies.js.map
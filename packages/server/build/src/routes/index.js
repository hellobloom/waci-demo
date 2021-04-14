"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const did_1 = require("./did");
const users_1 = require("./users");
const websocket_1 = require("./websocket");
const routes = (app, _, done) => {
    did_1.applyDIDRoutes(app);
    users_1.applyUsersRoutes(app);
    websocket_1.applyWebsocketRoutes(app);
    done();
};
exports.routes = routes;
//# sourceMappingURL=index.js.map
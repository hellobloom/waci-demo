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
exports.databaseManager = exports.DatabaseManager = void 0;
const typeorm_1 = require("typeorm");
const ormconfig = require('../ormconfig.js');
class DatabaseManager {
    constructor() {
        this.getRepository = (target) => {
            if (this.connection) {
                return this.connection.getRepository(target);
            }
            else {
                throw new Error('Must call `createDatabaseConnection` before connecting to a repository');
            }
        };
        this.createDatabaseConnection = (logger) => __awaiter(this, void 0, void 0, function* () {
            logger('Trying to create db connection');
            try {
                // Do not include migrations when starting the service.
                // It tries to evaluate/import the TS files, and that breaks.
                const newConnection = yield typeorm_1.createConnection(Object.assign(Object.assign({}, ormconfig), { migrations: undefined, migrationsRun: false }));
                logger('Made a DB connection');
                this.connection = newConnection;
            }
            catch (error) {
                logger('Encountered an error');
                logger(error);
                throw error;
            }
        });
    }
}
exports.DatabaseManager = DatabaseManager;
exports.databaseManager = new DatabaseManager();
//# sourceMappingURL=database.js.map
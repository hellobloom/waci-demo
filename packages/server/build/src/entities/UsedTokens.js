"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
var UsedTokens_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenUsed = exports.useToken = exports.UsedTokens = void 0;
const typeorm_1 = require("typeorm");
const database_1 = require("@server/database");
const util_1 = require("@server/util");
let UsedTokens = UsedTokens_1 = class UsedTokens {
};
UsedTokens.getRepo = () => database_1.databaseManager.getRepository(UsedTokens_1);
__decorate([
    typeorm_1.PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], UsedTokens.prototype, "id", void 0);
__decorate([
    typeorm_1.Column({ name: 'token_sha', type: 'text', unique: true }),
    __metadata("design:type", String)
], UsedTokens.prototype, "tokenSha", void 0);
__decorate([
    typeorm_1.Column({ name: 'expires_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], UsedTokens.prototype, "expiresAt", void 0);
__decorate([
    typeorm_1.CreateDateColumn({ name: 'created_at' }),
    __metadata("design:type", Date)
], UsedTokens.prototype, "createdAt", void 0);
__decorate([
    typeorm_1.UpdateDateColumn({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UsedTokens.prototype, "updatedAt", void 0);
UsedTokens = UsedTokens_1 = __decorate([
    typeorm_1.Entity({ name: 'used_tokens' })
], UsedTokens);
exports.UsedTokens = UsedTokens;
// Expires token, marking it as having been used/consumed.
const useToken = (token, expiresAt) => __awaiter(void 0, void 0, void 0, function* () {
    const usedToken = new UsedTokens();
    usedToken.tokenSha = util_1.hashToken(token);
    usedToken.expiresAt = expiresAt;
    yield UsedTokens.getRepo().save(usedToken);
});
exports.useToken = useToken;
const isTokenUsed = (token) => __awaiter(void 0, void 0, void 0, function* () { return typeof (yield UsedTokens.getRepo().findOne({ where: { tokenSha: util_1.hashToken(token) } })) !== 'undefined'; });
exports.isTokenUsed = isTokenUsed;
//# sourceMappingURL=UsedTokens.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseConfig = createDatabaseConfig;
const observability_1 = require("@squirrell/observability");
function createDatabaseConfig() {
    return {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [...observability_1.observabilityEntities],
        synchronize: false,
        autoLoadEntities: false
    };
}
//# sourceMappingURL=database.config.js.map
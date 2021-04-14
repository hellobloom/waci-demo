"use strict";
const SnakeNamingStrategy = require("typeorm-naming-strategies").SnakeNamingStrategy;
require('dotenv').config();
const path = require('path');
const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
    type: 'postgres',
    namingStrategy: new SnakeNamingStrategy(),
    url: process.env.DATABASE_URL,
    synchronize: false,
    entities: [path.resolve('build', 'src', 'entities', '*.js')],
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    migrations: ['db/migrations/*.ts'],
    cli: {
        migrationsDir: 'db/migrations',
    },
};
//# sourceMappingURL=ormconfig.js.map
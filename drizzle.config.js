"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    driver: 'better-sqlite',
    dbCredentials: {
        url: "./db.sqlite",
    }
};

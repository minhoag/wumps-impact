"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db_discord = exports.db_user = exports.db_config = void 0;
require("dotenv/config");
const mysql2_1 = require("drizzle-orm/mysql2");
const URL = process.env.DATABASE_URL;
const TABLE = {
    CONFIG: `${URL}/db_hk4e_config_gio`,
    USER: `${URL}/db_hk4e_user_gio`,
    DISCORD: `${URL}/db_hk4e_discord_gio`
};
if (!URL)
    throw Error("DATABASE_URL is not defined");
exports.db_config = (0, mysql2_1.drizzle)(TABLE.CONFIG);
exports.db_user = (0, mysql2_1.drizzle)(TABLE.USER);
exports.db_discord = (0, mysql2_1.drizzle)(TABLE.DISCORD);

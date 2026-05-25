import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";

const URL = process.env.DATABASE_URL;
const TABLE: Record<string, string> = {
	CONFIG: `${URL}/db_hk4e_config_gio`,
	USER: `${URL}/db_hk4e_user_gio`,
	DISCORD: `${URL}/db_hk4e_discord_gio`
}
if (!URL) throw Error("DATABASE_URL is not defined");
export const db_config = drizzle(TABLE.CONFIG);
export const db_user = drizzle(TABLE.USER);
export const db_discord = drizzle(TABLE.DISCORD);

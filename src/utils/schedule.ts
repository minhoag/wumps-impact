import { db_config } from "../core/database"
import { sql } from "drizzle-orm"
import fs from "fs"
import path from "path"

const COST_ITEM_ID = 223;
const COST_ITEM_NUM = 1;
const GACHA_POOL_ID = 201;
const GACHA_RULE_CONFIG = "{}";
const GACHA_PROB_URL = "http://103.195.188.90:21000/static/hk4e/event/e20190909gacha/index.html?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&gacha_id=fecafa7b6560db5f3182222395d88aaa6aaac1bc";
const GACHA_RECORD_URL = "http://103.195.188.90:21000/static/hk4e/event/e20190909gacha/index.html?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&init_type=302&gacha_id=fecafa7b6560db5f3182222395d88aaa6aaac1bc";
const SCHEDULE_CSV_PATH = path.resolve(__dirname, "../data/schedule.csv");

type GACHA_TYPE = 301 | 302 | 400;

type Input = {
	gachaType: GACHA_TYPE;
	select5: string | string[],
  beginTime: Date;
  endTime: Date;
}

type ScheduleRow = {
    name: string;
    vi_name: string;
    value: number;
    prefabPath: string;
    previewprefabPath: string;
    titlePath: string;
    up4ids: string;
};

class Schedule {
	async create(input: Input) {
        const gachaType: GACHA_TYPE = input.gachaType;
        const begin: Date = input.beginTime;
        const end: Date = input.endTime;
        if (begin.getTime() >= end.getTime()) {
            return "End time must be after begin time";
        }
        const overlapRows = await db_config.execute(sql`
            SELECT schedule_id
            FROM t_gacha_schedule_config
            WHERE gacha_type = ${gachaType} AND end_time >= ${begin}
        `);
        if (overlapRows.length > 0) {
            return "Overlapping schedule found";
				}
				let data;
        // query data from csv
        if (typeof input.select5 === "string") {
            data = this.getRow(input.select5);
        } else {
        	data = input.select5.map((name) => this.getRow(name));
				}
				if (!data) {
					return "No data found";
				}
				console.log(data)
    }

    async delete(_scheduleId: number): Promise<void> {
        throw new Error("Not implemented");
		}

		public getRow(name: string): ScheduleRow | undefined {
			const content = fs.readFileSync(SCHEDULE_CSV_PATH, "utf8");
			const lines = content.split(/\r?\n/);
			const keyword = name.toLowerCase();

			for (let i = 1; i < lines.length; i++) {
				const line = lines[i];
				const cols: string[] = [];
				let current = "";
				let inQuotes = false;
				for (let j = 0; j < line.length; j++) {
					const ch = line[j];
					if (ch === '"') {
						inQuotes = !inQuotes;
						continue;
					}
					if (ch === "," && !inQuotes) {
						cols.push(current);
						current = "";
						continue;
					}
					current += ch;
				}
				cols.push(current);
				const row: ScheduleRow = {
					name: cols[0],
					prefabPath: cols[3],
					previewprefabPath: cols[4],
					titlePath: cols[5],
					up4ids: cols[6],
				};
				if (row.name.toLowerCase() === keyword) {
					return row;
				}
			}
			return undefined;
    }

    private randomUp(pool: Array<string | number>, count: number): Array<string | number> {
        const unique = [...new Set(pool.map((x) => String(x)))];
        const copy = [...unique];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy.slice(0, count);
    }
}

export { Schedule, type Input };

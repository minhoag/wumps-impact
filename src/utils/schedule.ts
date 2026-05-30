import fs from "node:fs";
import path from "node:path";
import csvParser from "csv-parser";
import { sql } from "drizzle-orm";
import { db_config } from "../core/database";
import { normalizeName } from "./utils";

export type Input = {
	gachaType: number;
	beginTime: Date;
	endTime: Date;
	select: string[];
};
type GachaScheduleRow = {
	name: string;
	vi_name: string;
	value: string;
	prefabPath: string;
	previewprefabPath: string;
	titlePath: string;
	up4ids: string;
};
const FILE = "../data/schedule.csv";
export const GACHA_TYPE = {
	Primary: 303,
	Weapon: 304,
	Secondary: 401,
} as const;
const GACHA_COST_ITEM_ID = 223;
const GACHA_COST_ITEM_NUM = 1;
const GACHA_POOL_ID = 201;
const GACHA_PROB_RULE_ID = 2;
const GACHA_RULE_CONFIG = "{}";
const GACHA_PROB_URL =
	"http://103.195.188.90:21000/static/hk4e/event/e20190909gacha/index.html?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&gacha_id=fecafa7b6560db5f3182222395d88aaa6aaac1bc";
const GACHA_RECORD_URL =
	"http://103.195.188.90:21000/static/hk4e/event/e20190909gacha/index.html?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&init_type=302&gacha_id=fecafa7b6560db5f3182222395d88aaa6aaac1bc";

export class Schedule {
	async create(input: Input) {
		const { gachaType, beginTime, endTime, select } = input;
		// check if database have active gachaType of the same date range
		// this query should not return any value because same gacha_type has to end before start a new one
		let query_result: string[];
		const check = await db_config.execute(sql`
			SELECT
				gacha_type,
				end_time
			FROM t_gacha_schedule_config
			WHERE
				gacha_type = ${gachaType}
				AND end_time > ${beginTime};`);
		if (check[0].length > 0) {
			query_result = check[0].map(
				(c) =>
					`Already active gacha. Type: ${c.gacha_type}, End time: ${c.end_time}`,
			);
			return query_result;
		}
		// if valid to add then browse for data
		const result = await this.browse(select);
		// TODO: handle if no result
		query_result = [];
		await Promise.all(
			result.map(async (r) => {
				let up4ids = r.up4ids;
				if (up4ids.length > 3) {
					up4ids = this.randomPick(up4ids);
				} else {
					up4ids = up4ids.split(",").map(Number);
				}
				const gacha_up_config = {
					gacha_up_list: [
						{
							item_parent_type: 2,
							prob: 500,
							item_list: up4ids,
						},
						{ item_parent_type: 1, prob: 500, item_list: [Number(r.value)] },
					],
				};
				const gacha_sort_id = gachaType === 302 ? 1003 : 1005;
				const res = await db_config.execute(sql`
					INSERT INTO t_gacha_schedule_config (
						gacha_type,
						begin_time,
						end_time,
						cost_item_id,
						cost_item_num,
						gacha_pool_id,
						gacha_prob_rule_id,
						gacha_up_config,
						gacha_rule_config,
						gacha_prefab_path,
						gacha_preview_prefab_path,
						gacha_prob_url,
						gacha_record_url,
						gacha_prob_url_oversea,
						gacha_record_url_oversea,
						gacha_sort_id,
						enabled,
						title_textmap,
						display_up4_item_list
					)
					VALUES (
						${gachaType},
						${beginTime},
						${endTime},
						${GACHA_COST_ITEM_ID},
						${GACHA_COST_ITEM_NUM},
						${GACHA_POOL_ID},
						${GACHA_PROB_RULE_ID},
						${JSON.stringify(gacha_up_config)},
						${GACHA_RULE_CONFIG},
						${r.prefabPath},
						${r.previewprefabPath},
						${GACHA_PROB_URL},
						${GACHA_RECORD_URL},
						${GACHA_PROB_URL},
						${GACHA_RECORD_URL},
						${gacha_sort_id},
						${1},
						${r.titlePath},
						${r.up4ids}
					);`);
				query_result.push(
					`Added gacha schedule: ${gachaType} ${r.name}. Time: ${beginTime}-${endTime}`,
				);
			}),
		);
		if (query_result.length === 0) return "No gacha schedules added.";
		return `Done added ${query_result.join(", ")} gacha schedules`;
	}

	// randomly pick 3 ids
	private randomPick(up4ids: string): number[] {
		const ids = up4ids.split(",").map(Number);
		const result: number[] = [];
		for (let i = 0; i < 3; i++) {
			const index = Math.floor(Math.random() * ids.length);
			result.push(ids[index]);
		}
		return result;
	}

	//--- Browse the select 5 star given
	private browse(select: string[]): Promise<GachaScheduleRow[]> {
		// search in csv
		const results: GachaScheduleRow[] = [];
		const normalizedSelect = new Set(select.map((s) => normalizeName(s)));
		const filepath = path.join(__dirname, FILE);
		const data = fs.createReadStream(filepath);
		return new Promise((resolve, reject) => {
			data
				.pipe(csvParser())
				.on("data", (row) => {
					if (normalizedSelect.has(normalizeName(row.name))) results.push(row);
				})
				.on("end", () => {
					resolve(results);
				})
				.on("error", (err) => {
					reject(err);
				});
		});
	}
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const COST_ITEM_ID = 223;
const COST_ITEM_NUM = 1;
const GACHA_POOL_ID = 201;
const GACHA_RULE_CONFIG = "{}";
const GACHA_PROB_URL = "http://103.195.188.90:21000/static/hk4e/event/e20190909gacha/index.html?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&gacha_id=fecafa7b6560db5f3182222395d88aaa6aaac1bc";
const GACHA_RECORD_URL = "http://103.195.188.90:21000/static/hk4e/event/e20190909gacha/index.html?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&init_type=302&gacha_id=fecafa7b6560db5f3182222395d88aaa6aaac1bc";
const SCHEDULE_CSV_PATH = path_1.default.resolve(__dirname, "../data/schedule.csv");
class Schedule {
    async create(input) {
        void input;
        return "Not implemented";
    }
    async delete(_scheduleId) {
        throw new Error("Not implemented");
    }
    getRow(name) {
        const content = fs_1.default.readFileSync(SCHEDULE_CSV_PATH, "utf8");
        const lines = content.split(/\r?\n/);
        const keyword = name.toLowerCase();
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line)
                continue;
            const cols = [];
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
            const row = {
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
    randomUp(pool, count) {
        const unique = [...new Set(pool.map((x) => String(x)))];
        const copy = [...unique];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy.slice(0, count);
    }
}
exports.default = new Schedule();

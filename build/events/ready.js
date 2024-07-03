"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const cron_1 = require("cron");
const function_1 = require("../function");
const discord_js_1 = require("discord.js");
const prisma_1 = __importDefault(require("../prisma/prisma"));
const event = {
    name: 'ready',
    once: true,
    execute: async (client) => {
        console.table({
            users: client.user?.tag,
            online: await (0, function_1.getPlayerOnline)(),
        });
        const job = new cron_1.CronJob('* * 0 * * *', // cronTime
        async function () {
            try {
                const data = await (0, function_1.getGachaScheduleConfig)();
                if (!data)
                    return;
                data.forEach(async (e) => {
                    const compare = (0, moment_1.default)(e.end_time).isBefore((0, moment_1.default)());
                    if (e.enabled === 1 && compare) {
                        await prisma_1.default.t_gacha_schedule_config.update({
                            where: { schedule_id: e.schedule_id },
                            data: { enabled: 0 },
                        });
                    }
                });
            }
            catch { }
        }, null, // onComplete
        true, // start
        'Asia/Ho_Chi_Minh' // timeZone
        );
        setInterval(async () => {
            try {
                const onlinePlayer = await (0, function_1.getPlayerOnline)();
                const start = Date.now();
                await fetch('http://37.114.63.115:2888');
                const ping = Date.now() - start;
                if (onlinePlayer === 'down') {
                    client.user?.setActivity(`Bảo trì.`, {
                        type: discord_js_1.ActivityType.Listening,
                    });
                }
                else {
                    client.user?.setActivity(` với ${onlinePlayer} người. Ping ${Math.ceil(ping / 2)}ms`, {
                        type: discord_js_1.ActivityType.Playing,
                    });
                }
            }
            catch (error) { }
        }, 60000);
    },
};
exports.default = event;

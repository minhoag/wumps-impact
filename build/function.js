"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerOnline = exports.pagination = exports.extractSubstats = exports.getGachadata = exports.fetchUsers = exports.getPlayerData = exports.getUsers = exports.updateEventScheduleConfig = exports.deleteEventScheduleConfig = exports.getEventScheduleConfig = exports.deleteGachaScheduleConfig = exports.updateGachaScheduleConfig = exports.getGachaScheduleConfig = exports.sendTimedMessage = exports.checkPermissions = void 0;
const discord_js_1 = require("discord.js");
const schedule_1 = require("./data/schedule");
const prisma_1 = __importDefault(require("./prisma/prisma"));
const prisma_second_1 = __importDefault(require("./prisma/prisma-second"));
const checkPermissions = (member, permissions) => {
    const neededPermissions = [];
    permissions.forEach((permission) => {
        if (!member.permissions.has(permission))
            neededPermissions.push(permission);
    });
    if (neededPermissions.length === 0)
        return null;
    return neededPermissions.map((p) => {
        if (typeof p === 'string')
            return p.split(/(?=[A-Z])/).join(' ');
        else
            return Object.keys(discord_js_1.PermissionFlagsBits)
                .find((k) => Object(discord_js_1.PermissionFlagsBits)[k] === p)
                ?.split(/(?=[A-Z])/)
                .join(' ');
    });
};
exports.checkPermissions = checkPermissions;
const sendTimedMessage = (message, channel, duration) => {
    channel.send(message).then((m) => setTimeout(async () => (await channel.messages.fetch(m)).delete(), duration));
    return;
};
exports.sendTimedMessage = sendTimedMessage;
async function getGachaScheduleConfig() {
    try {
        const banners = await prisma_1.default.t_gacha_schedule_config.findMany();
        return banners;
    }
    catch (err) {
        console.log('Error: ' + err.message);
    }
}
exports.getGachaScheduleConfig = getGachaScheduleConfig;
/* Update sự kiện ước nguyện lên SQL */
const updateGachaScheduleConfig = async ({ scheduleId, gachaType, gachaPropRuleId, start, end, 
/* Weapon */
weapon, }) => {
    try {
        const _schedule = schedule_1.schedule.find((e) => e.scheduleId === scheduleId) ?? schedule_1.schedule[0];
        const rateUpItems5 = !weapon ? _schedule.rateUpItems5.toString() : weapon;
        const rateUpItems4 = _schedule.rateUpItems4.toString();
        const prob = gachaPropRuleId === 1 ? 500 : 750;
        await prisma_1.default.$connect();
        const scheduleSchema = {
            schedule_id: scheduleId,
            gacha_type: gachaType,
            begin_time: start,
            end_time: end,
            cost_item_id: 223,
            cost_item_num: 1,
            gacha_pool_id: 201,
            gacha_prob_rule_id: gachaPropRuleId,
            gacha_up_config: `{\"gacha_up_list\":[{\"item_parent_type\":1,\"prob\":${prob},\"item_list\":[${rateUpItems5}]},{\"item_parent_type\":2,\"prob\":500,\"item_list\":[${rateUpItems4}]}]}`,
            gacha_rule_config: '{}',
            gacha_prefab_path: _schedule.prefabPath,
            gacha_preview_prefab_path: _schedule.previewprefabPath,
            gacha_prob_url: '',
            gacha_record_url: '',
            gacha_prob_url_oversea: '',
            gacha_record_url_oversea: '',
            gacha_sort_id: _schedule.sortId,
            enabled: 1,
            title_textmap: _schedule.titlePath,
            display_up4_item_list: _schedule.rateUpItems4.toString(),
        };
        await prisma_1.default.t_gacha_schedule_config.create({
            data: scheduleSchema,
        });
    }
    catch (err) {
        return err;
    }
    finally {
        await prisma_1.default.$disconnect();
    }
};
exports.updateGachaScheduleConfig = updateGachaScheduleConfig;
const deleteGachaScheduleConfig = async (schedule_id) => {
    try {
        await prisma_1.default.t_gacha_schedule_config.delete({
            where: { schedule_id: schedule_id },
        });
    }
    catch (err) {
        console.log(err.message);
        return err.message;
    }
};
exports.deleteGachaScheduleConfig = deleteGachaScheduleConfig;
/* Update sự kiện lên SQL */
const getEventScheduleConfig = async () => {
    try {
        const data = await prisma_1.default.t_activity_schedule_config.findMany();
        return data;
    }
    catch (err) {
        return err.message;
    }
};
exports.getEventScheduleConfig = getEventScheduleConfig;
/* Update sự kiện lên SQL */
const deleteEventScheduleConfig = async (schedule_id) => {
    try {
        const data = await prisma_1.default.t_activity_schedule_config.delete({
            where: { schedule_id: schedule_id },
        });
        return data;
    }
    catch (err) {
        return err.message;
    }
};
exports.deleteEventScheduleConfig = deleteEventScheduleConfig;
/* Update sự kiện lên SQL */
const updateEventScheduleConfig = async (event, start, end) => {
    const uploadData = {
        schedule_id: Number(event),
        begin_time: start,
        end_time: end,
        desc: '',
    };
    try {
        await prisma_1.default.t_activity_schedule_config.create({ data: uploadData });
    }
    catch (err) {
        return err.message;
    }
};
exports.updateEventScheduleConfig = updateEventScheduleConfig;
const getUsers = async () => {
    try {
        const user = process.env.USER_URL;
        const data = await prisma_second_1.default.t_player_uid.findMany();
        return data;
    }
    catch (err) {
        return err.message;
    }
};
exports.getUsers = getUsers;
/* Function Data Users */
/* http://wumpus.site:14861/api?cmd=1004&region=dev_gio&ticket=GM&uid=${uid} : Lấy thông tin tower */
/* http://wumpus.site:14861/api?cmd=1004&region=dev_gio&ticket=GM&uid=${uid} : Lấy thông tin tower */
const getPlayerData = async (uid, char) => {
    const userData = await fetch(`http://wumpus.site:14861/api?cmd=1004&region=dev_gio&ticket=GM&uid=${uid}`);
    const itemData = await fetch(`http://wumpus.site:14861/api?cmd=1016&region=dev_gio&ticket=GM&uid=${uid}`);
    const player = await userData.json();
    const item = await itemData.json();
    // Player Data
    const player_data = player?.data?.bin_data?.avatar_bin?.avatar_list;
    const player_found_data = player_data.find((e) => e.avatar_id == Number(char));
    // Item Data
    const item_data = item?.data?.item_bin_data?.pack_store?.item_list;
    if (player_found_data?.formal_avatar) {
        const item_list = player_found_data?.formal_avatar?.equip_guid_list;
        const item_finding = item_list.map((item) => {
            const found_item = item_data.find((requilary) => requilary?.guid == item);
            return found_item?.equip?.reliquary;
        });
        if (!item_finding)
            return undefined;
    }
    else {
        const item_list = player_found_data?.equip_list;
    }
};
exports.getPlayerData = getPlayerData;
const fetchUsers = async (ip, sender, title, description, item, seconds, uuid) => {
    const users = await (0, exports.getUsers)();
    users.map(async (user) => {
        await fetch(`http://${ip}:14861/api?sender=${sender}&title=${title}&content=${description}&item_list=${item}&expire_time=${seconds}&is_collectible=False&uid=${user.uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`);
    });
    return;
};
exports.fetchUsers = fetchUsers;
/* Function tìm database */
const getGachadata = (name) => schedule_1.schedule.filter((data) => data.value.includes(name));
exports.getGachadata = getGachadata;
/* Function substats */
const extractSubstats = (substatsString) => {
    const substatsArray = substatsString.split(' ');
    const substats = substatsArray.flatMap((substat) => {
        const parts = substat.split(',');
        if (parts.length === 2) {
            return new Array(parseInt(parts[1])).fill(parts[0]);
        }
        return [];
    });
    return substats;
};
exports.extractSubstats = extractSubstats;
/* Function Pagination */
const pagination = async (interaction, pages, time) => {
    if (pages.length === 1) {
        const page = await interaction.editReply({
            embeds: [pages[0]],
            components: [],
        });
        return page;
    }
    //@ts-ignore
    const prev = new discord_js_1.ButtonBuilder().setCustomId('prev').setLabel('Previous').setStyle(discord_js_1.ButtonStyle.Primary).setDisabled(true);
    //@ts-ignore
    const next = new discord_js_1.ButtonBuilder().setCustomId('next').setStyle(discord_js_1.ButtonStyle.Primary).setLabel('Next');
    const buttonRow = new discord_js_1.ActionRowBuilder().addComponents([prev, next]);
    let index = 0;
    const currentPage = await interaction.editReply({
        embeds: [pages[index]],
        components: [buttonRow],
    });
    const collector = await currentPage.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time,
    });
    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({
                content: 'Bạn không có quyền sử dụng lệnh này.',
                ephemeral: true,
            });
        }
        await i.deferUpdate();
        if (i.customId === 'prev') {
            index--;
            prev.setDisabled(index === 0);
            next.setDisabled(false);
        }
        else if (i.customId === 'next') {
            index++;
            prev.setDisabled(false);
            next.setDisabled(index === pages.length - 1);
        }
        await currentPage.edit({
            embeds: [pages[index]],
            components: [buttonRow],
        });
        collector.resetTimer();
    });
    collector.on('end', async () => {
        await currentPage.edit({
            embeds: [pages[index]],
            components: [],
        });
    });
    return currentPage;
};
exports.pagination = pagination;
async function getPlayerOnline() {
    try {
        const ip = process.env.IP;
        const res = await fetch(`http://${ip}:14861/api?cmd=1101&region=dev_gio&ticket=GM`);
        const json = await res.json();
        return json.data.online_player_num_except_sub_account;
    }
    catch (error) {
        return 'down';
    }
}
exports.getPlayerOnline = getPlayerOnline;

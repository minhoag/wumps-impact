"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const function_1 = require("../function");
const item_1 = require("../data/item");
const moment_1 = __importDefault(require("moment"));
var items = [];
const command = {
    command: new discord_js_1.SlashCommandBuilder()
        .setName('remove')
        .setDescription('Xoá khỏi server')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option.setName('event').setDescription('Tên sự kiện').setRequired(true).setAutocomplete(true)),
    cooldown: 1,
    autocomplete: async (interaction) => {
        try {
            const focusedOption = interaction.options.getFocused(true);
            const getGachaSchedule = await (0, function_1.getGachaScheduleConfig)();
            if (!getGachaSchedule)
                return;
            items = [];
            getGachaSchedule.map((data) => {
                const config = JSON.parse(data.gacha_up_config);
                if (!config)
                    return;
                const gachaUpList = config.gacha_up_list;
                if (!gachaUpList)
                    return;
                const item_list = config.gacha_up_list[0].item_list;
                item_list.map((id) => {
                    const find = item_1.item.find((item) => item.value == id) ?? {
                        name: 'Không tìm thấy',
                        value: 'Không tìm thấy',
                    };
                    const modifiedFound = {
                        name: data.schedule_id.toString() + '. ' + find.name + ' - ' + (0, moment_1.default)(data.end_time).format('DD/MM/YY'),
                        value: data.schedule_id.toString(),
                    };
                    items.push(modifiedFound);
                });
            });
            const filtered = items.filter((choice) => choice.name.includes(focusedOption.value));
            const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
            await interaction.respond(options);
        }
        catch (error) {
            console.log(`Error in Autocomplete remove sự kiện: ${error.message}`);
        }
    },
    execute: async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;
        if (!interaction.guild)
            return interaction.reply('Không thể thực hiện ở DM');
        const event = interaction.options.getString('event', true);
        const eventName = items.find((item) => item.value == event);
        const confirm = new discord_js_1.ButtonBuilder().setCustomId('confirm').setLabel('Xác nhận');
        const cancel = new discord_js_1.ButtonBuilder().setCustomId('cancel').setLabel('Hủy');
        const row = new discord_js_1.ActionRowBuilder().addComponents(confirm, cancel);
        const response = await interaction.reply({
            content: `Xác nhận xóa sự kiện ${eventName?.name}?`,
            components: [row],
        });
        const collectorFilter = (i) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({
                filter: collectorFilter,
                time: 30000,
            });
            if (confirmation.customId === 'confirm') {
                await (0, function_1.deleteGachaScheduleConfig)(Number(event));
                await confirmation.update({
                    content: `Đã xóa sự kiện ${eventName?.name}`,
                    components: [],
                });
            }
            else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: 'Đã hủy xóa', components: [] });
            }
        }
        catch (e) {
            await interaction.editReply({
                content: `Không có xác nhận trong vòng 30 giây. Lệnh xóa sự kiện ${eventName?.name} đã được hủy`,
                components: [],
            });
        }
    },
};
exports.default = command;

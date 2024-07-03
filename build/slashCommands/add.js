"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../prisma/prisma"));
const moment_1 = __importDefault(require("moment"));
const command = {
    command: new discord_js_1.SlashCommandBuilder()
        .setName('add')
        .setDescription('Thêm vào SQL')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option
        .setName('event')
        .setDescription('Tên sự kiện')
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption((option) => option
        .setName('enable')
        .setDescription('Bắt đầu ngay?')
        .addChoices({ name: 'Có', value: '1' }, { name: 'Không', value: '0' }))
        .addStringOption((option) => option.setName('begin').setDescription('Thời gian bắt đầu'))
        .addStringOption((option) => option.setName('end').setDescription('Thời gian kết thúc'))
        .addNumberOption((option) => option.setName('duration').setDescription('Thời gian kéo dài')),
    cooldown: 1,
    autocomplete: async (interaction) => {
        const jsonsInDir = fs_1.default
            .readdirSync('./src/data/references')
            .filter((file) => path_1.default.extname(file) === '.json');
        const focusedOption = interaction.options.getFocused(true);
        let bannerList = [];
        jsonsInDir.forEach((file) => {
            const fileData = fs_1.default.readFileSync(path_1.default.join('./src/data/references', file));
            const json = JSON.parse(fileData.toString());
            json.forEach((data) => {
                const version = data.comment.substring(0, 6);
                const nameData = data.comment.substring(6).length == 0
                    ? `Signature of ${version}`
                    : `${data.comment.substring(6)} on Version ${version}`;
                bannerList.push({ name: nameData, value: file });
            });
        });
        const filtered = bannerList.filter((choice) => choice.name.includes(focusedOption.value));
        const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
        await interaction.respond(options);
    },
    execute: async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;
        if (!interaction.guild)
            return interaction.reply('Không thể thực hiện ở DM');
        const event = interaction.options.getString('event', true);
        const enable = interaction.options.getString('enable') ?? '0';
        const begin = interaction.options.getString('begin')
            ? (0, moment_1.default)(interaction.options.getString('begin'))
                .startOf('day')
                .toISOString()
            : (0, moment_1.default)().startOf('day').toISOString();
        const duration = interaction.options.getNumber('duration') ?? 2;
        const end = interaction.options.getString('end')
            ? (0, moment_1.default)(interaction.options.getString('end')).toISOString()
            : (0, moment_1.default)(begin).add(duration, 'w').toISOString();
        try {
            const getFileData = fs_1.default.readFileSync(path_1.default.join('./src/data/references', event));
            const json = JSON.parse(getFileData.toString());
            json.forEach(async (data) => {
                await prisma_1.default.t_gacha_schedule_config.create({
                    data: {
                        gacha_type: data.gachaType,
                        begin_time: begin,
                        end_time: end,
                        cost_item_id: data.costItemId,
                        cost_item_num: 1,
                        gacha_pool_id: 201,
                        gacha_prob_rule_id: data.comment.substring(6).length == 0 ? 2 : 1,
                        gacha_up_config: `{"gacha_up_list":[{"item_parent_type":1,"prob":${data.comment.substring(6).length == 0 ? '750' : '500'},"item_list":[${data.rateUpItems5.toString()}]},{"item_parent_type":2,"prob":500,"item_list":[${data.rateUpItems4.toString()}]}]}`,
                        gacha_rule_config: '{}',
                        gacha_prefab_path: data.prefabPath,
                        gacha_preview_prefab_path: `UI_Tab_${data.prefabPath}`,
                        gacha_prob_url: data.gacha_prob_url,
                        gacha_record_url: '',
                        gacha_prob_url_oversea: '',
                        gacha_record_url_oversea: '',
                        gacha_sort_id: data.comment.substring(6).length == 0 ? 3 : 982,
                        enabled: parseInt(enable),
                        title_textmap: data.comment.substring(6).length == 0
                            ? 'UI_GACHA_SHOW_PANEL_A020_TITLE'
                            : data.titlePath,
                        display_up4_item_list: data.rateUpItems4.toString(),
                    },
                });
            });
            await interaction.reply({
                content: `Sự kiện ${event} đã được thêm vào SQL! Thời gian bắt đầu: ${begin}, thời gian kết thúc: ${end}`,
                ephemeral: true,
            });
        }
        catch (error) {
            await interaction.reply({
                content: `Có lỗi xảy ra! Chi tiết: ${error.message}`,
                ephemeral: true,
            });
        }
    },
};
exports.default = command;

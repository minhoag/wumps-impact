"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const moment_1 = __importDefault(require("moment"));
const command = {
    command: new discord_js_1.SlashCommandBuilder()
        .setName('donate')
        .setDescription('Gửi mail quà Donate cho người chơi.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption((option) => option
        .setName('uid')
        .setDescription('UID của người chơi')
        .setRequired(true))
        .addStringOption((option) => option
        .setName('type')
        .setDescription('Chọn loại donate')
        .setRequired(true)
        .addChoices({ name: 'Nguyên thạch', value: '1' }, { name: 'Không Nguyệt Chúc Phúc', value: '2' }, { name: 'Nhật Ký Hành Trình', value: '3' })),
    cooldown: 1,
    execute: async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;
        if (!interaction.guild)
            return interaction.reply('Không thể thực hiện ở DM');
        const ip = process.env.IP;
        const uid = interaction.options.getString('uid', true);
        const titleId = Number(interaction.options.getString('type', true));
        const title = {
            1: 'Nạp Nguyên thạch',
            2: 'Nạp Không Nguyệt Chúc Phúc',
            3: 'Nạp Nhật Ký Hành Trình',
        };
        const sender = 'Wumpus';
        const type = Number(interaction.options.getString('type', true));
        const description = 'Cảm ơn bạn đã ủng hộ WumPS.';
        const item = {
            1: '201:900,201:900,201:900,201:900,201:900,201:900,201:900,201:900,201:300',
            2: '1202:1',
            3: '1201:1',
        };
        try {
            const seconds = (0, moment_1.default)().add(365, 'days').unix();
            const uuid = new Date().getTime();
            const res = await fetch(`http://${ip}:14861/api?sender=${sender}&title=${title[titleId]}&content=${description}&item_list=${item[type]}&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`);
            const json = await res.json();
            if (json.msg !== 'succ') {
                await interaction.reply({
                    content: 'Gửi thư không thành công. Lỗi: `' + json.msg + '`',
                    ephemeral: true,
                });
                return;
            }
            await interaction.reply({
                content: 'Gửi thư thành công',
                ephemeral: true,
            });
        }
        catch (error) {
            console.log(`Error in Donate: ${error.message}\nIP: ${ip}`);
        }
    },
};
exports.default = command;

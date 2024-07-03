"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const command = {
    command: new discord_js_1.SlashCommandBuilder()
        .setName('mail')
        .setDescription('Gửi lệnh Mail cho người chơi.')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    cooldown: 1,
    execute: async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('mailForm')
            .setTitle('Nội dung Thư');
        const receiver = new discord_js_1.TextInputBuilder()
            .setCustomId('receiverInput')
            .setLabel('Nguời nhận:Người gửi')
            .setPlaceholder('1:Paimon')
            .setStyle(discord_js_1.TextInputStyle.Short);
        const expiry = new discord_js_1.TextInputBuilder()
            .setCustomId('expiryInput')
            .setLabel('Thời hạn thư (tính theo ngày)')
            .setPlaceholder('14')
            .setStyle(discord_js_1.TextInputStyle.Short);
        const title = new discord_js_1.TextInputBuilder()
            .setCustomId('titleInput')
            .setLabel('Tiêu đề thư')
            .setPlaceholder("Ví dụ: It's Paimon's Birthday!")
            .setStyle(discord_js_1.TextInputStyle.Short);
        const description = new discord_js_1.TextInputBuilder()
            .setCustomId('descriptionInput')
            .setLabel('Nội dung thư')
            .setPlaceholder("Ví dụ: You might be only one of countless stars, but you're Paimon's whole world!")
            .setStyle(discord_js_1.TextInputStyle.Paragraph);
        const item = new discord_js_1.TextInputBuilder()
            .setCustomId('itemInput')
            .setLabel('Vật phẩm thêm')
            .setPlaceholder('Ví dụ: 201:900')
            .setStyle(discord_js_1.TextInputStyle.Paragraph);
        // An action row only holds one text input,
        // so you need one action row per text input.
        const firstActionRow = new discord_js_1.ActionRowBuilder().addComponents(receiver);
        const secondActionRow = new discord_js_1.ActionRowBuilder().addComponents(expiry);
        const thirdActionRow = new discord_js_1.ActionRowBuilder().addComponents(title);
        const fourthActionRow = new discord_js_1.ActionRowBuilder().addComponents(description);
        const fifthActionRow = new discord_js_1.ActionRowBuilder().addComponents(item);
        // Add inputs to the modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);
        // Show the modal to the user
        await interaction.showModal(modal);
    },
};
exports.default = command;

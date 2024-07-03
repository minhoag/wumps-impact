'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
const discord_js_1 = require('discord.js');
const function_1 = require('../function');
const shop_1 = require('../data/shop');
const command = {
	command: new discord_js_1.SlashCommandBuilder()
		.setName('shop')
		.setDescription('Cửa hàng buôn bán Credit'),
	cooldown: 1,
	execute: async (interaction) => {
		if (!interaction.isChatInputCommand())
			return;
		if (!interaction.guild)
			return interaction.reply('Không thể thực hiện ở DM');
		let embeds = [];
		await interaction.deferReply();
		let pages = shop_1.Shop.length / 5 === 0 ? shop_1.Shop.length / 5 + 1 : shop_1.Shop.length / 5;
		for (let i = 0; i < pages; i++) {
			const embed = new discord_js_1.EmbedBuilder()
				.setTitle('Credit Exchange Shop`')
				.setColor('#2F3137')
				.setTimestamp()
				.setFooter({
					text: `Credit Exchange Shop`,
					iconURL: 'https://ik.imagekit.io/asiatarget/genshin/icon_128x128.png?updatedAt=1699385494260',
				});
			embed.setDescription('This shop is to exchange your daily credit into ingames items. Credit can be earned by transfer Moras ingame or by donation.');
			shop_1.Shop.slice(i * 3, i * 3 + 3).forEach((item) => {
				embed.addFields({
					name: `${item.name}`,
					value: `**Credit value**: ${item.price} Mora\n**Description**: ${item.description}`,
					inline: true,
				});
			});
			embeds.push(embed);
		}
		await (0, function_1.pagination)(interaction, embeds, 45000);
	},
};
exports.default = command;

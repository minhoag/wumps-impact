import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandNumberOption,
	SlashCommandUserOption
} from 'discord.js'
import { SlashCommand } from '../types'
import { bagPagination, getPlayerItems, truncateText } from '../function'
import prismaSqlite from '../prisma/prisma-sqlite'
import { item_vi } from '../data/item_vi'
import { item_en } from '../data/item_en'
import { Locale } from '../data/dict'

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('bag')
		.setDescription('Check what item you have ingame')
		.addUserOption((option: SlashCommandUserOption) =>
			option.setName('user').setDescription('View another user bags.')
		)
		.addNumberOption((option: SlashCommandNumberOption) =>
			option.setName('number').setDescription('Type a number to view a specific bag page.'),
		),
	cooldown: 3,
	execute: async (interaction: CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild)
			return interaction.reply('Không thể thực hiện ở DM');
		const ip = process.env.IP;
		const user = interaction.options.getUser('user') ?? interaction.user;
		const number = interaction.options.getNumber('number') ?? 1;
		let locale: string = interaction.locale;
		if (locale !== 'vi' && locale !== 'en-US' || !locale) locale = 'en-US';
		await interaction.deferReply()
		try {
			const player_data = await prismaSqlite.userData.findFirst({
				where: {
					user: { in: [user.id]}
				},
				select: {
					user: true,
					uid: true
				}
			});
			if (!player_data) return interaction.reply('')
			const item = locale == "vi" ? item_vi : item_en;
			const get_item_in_bag = await getPlayerItems(player_data.uid);
			const special_item_list: string[] = []
			const item_in_bag = get_item_in_bag.sort((a: any, b: any) => a.item_id - b.item_id).map((i: any) => {
				const find_item = item.find((j: any) => j.value == i.item_id)
				const banned_item: string[] = ['Stella Fortuna', 'Sigil', 'Gnostic Hymn'];
				const special_item: string[] = [ '221', '222', '223', '224' ];
				if (!find_item) return;
				else if (banned_item.some((words: string) => find_item.name.includes(words))) return undefined;
				else if (special_item.includes(find_item.value)) {
					const special = {
						'221': '<:Masterless_Starglitter:1273779822585315441>',
						'222': '<:Masterless_Stardust:1273779819783393370>',
						'223': '<:Intertwined_Fate:1273756119814377596>',
						'224': '<:Acquaint_Fate:1273756116186169475>',
					}
					special_item_list.push(`${special[find_item.value as keyof typeof special]} ${find_item.name} (${i.material.count})`)
					return undefined;
				} else return `<:Primogem:1257820689096773782> ${truncateText(find_item.name, 18)} (${i.material.count})\n⠀⠀ ID: ${find_item.value}`
			}).filter((i: any) => i !== undefined);
			const embeds: EmbedBuilder[] = [];
			for (let i: number = 0; i < item_in_bag.length / 10; i++) {
				let items_1 = item_in_bag.slice(i * 5, i * 5 + 5);
				let items_2 = item_in_bag.slice(i * 5 + 5, i * 5 + 10);
				const embed: EmbedBuilder = new EmbedBuilder()
					.setAuthor({
						name: user.username + '#' + 10000 + Number(player_data.uid),
					})
					.addFields(
						{
							name: Locale['item'][locale],
							value: items_1.join('\n'),
							inline: true
						},
					)
					.setThumbnail("https://static.wikia.nocookie.net/gensin-impact/images/a/a0/Icon_Inventory.png")
					.setFooter({
						text: `Page ${i + 1}/${Math.ceil(item_in_bag.length / 10)}  |  Total Item: ${item_in_bag.length}`,
					});
				if (item_in_bag.length > 5) {
					embed.addFields(
						{
							name: '\u200B',
							value: items_2.join('\n'),
							inline: true
						},
					)
				}
				embed.addFields(
					{
						name: Locale['wishingItem'][locale],
						value: special_item_list.join('\n'),
						inline: false
					}
				)
				embeds.push(embed);
			}
			await bagPagination(interaction, embeds, 45000, number - 1);
		} catch (error) {
			console.log(`Error in bag: ${error.message}\nIP: ${ip}`);
		}
	},
};

export default command;

import {
	EmbedBuilder,
	SlashCommandBuilder,
	SlashCommandNumberOption,
	SlashCommandStringOption,
	SlashCommandUserOption
} from 'discord.js'
import { SlashCommand } from '../types'
import { bagPagination, getPlayerItems, removeAccents, truncateText } from '../function'
import prismaSqlite from '../prisma/prisma-sqlite'
import { item_vi } from '../data/item_vi'
import { item_en } from '../data/item_en'
import { Locale } from '../data/dict'

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('bag')
		.setDescription('Gửi lệnh GM thêm item cho người chơi.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('view')
				.setDescription('Check what item you have in-game')
				.addUserOption((option: SlashCommandUserOption) =>
					option.setName('user').setDescription('View another user bags.')
				)
				.addNumberOption((option: SlashCommandNumberOption) =>
					option.setName('number').setDescription('Type a number to view a specific bag page.')
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('search')
				.setDescription('Find which page has your desire item')
				.addStringOption((option: SlashCommandStringOption) =>
					option.setName('item-name').setDescription('Type the item name.').setRequired(true)
				)
		),
	cooldown: 3,
	execute: async (interaction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild)
			return interaction.reply('Không thể thực hiện ở DM');
		let locale: string = interaction.locale
		if (locale !== 'vi' && locale !== 'en-US' || !locale) locale = 'en-US'
		if (interaction.options.getSubcommand() === 'view') {
			const ip = process.env.IP
			const user = interaction.options.getUser('user') ?? interaction.user
			const number = interaction.options.getNumber('number') ?? 1
			try {
				await interaction.deferReply()
				const player_data = await prismaSqlite.userData.findFirst({
					where: {
						user: { in: [user.id] }
					},
					select: {
						user: true,
						uid: true
					}
				})
				if (!player_data) return interaction.reply('')
				const item = locale == 'vi' ? item_vi : item_en
				const get_item_in_bag = await getPlayerItems(player_data.uid)
				const special_item_list: string[] = []
				const item_in_bag = get_item_in_bag.sort((a: any, b: any) => a.item_id - b.item_id).map((i: any) => {
					const find_item = item.find((j: any) => j.value == i.item_id)
					const banned_item: string[] = ['Stella Fortuna', 'Sigil', 'Gnostic Hymn', 'Welkin Moon', 'Ấn', 'Nhật Ký', 'Không Nguyệt']
					const special_item: string[] = ['221', '222', '223', '224']
					if (!find_item) return
					else if (banned_item.some((words: string) => removeAccents(find_item.name).includes(removeAccents(words)))) return undefined
					else if (special_item.includes(find_item.value)) {
						const special = {
							'221': '<:Masterless_Starglitter:1273779822585315441>',
							'222': '<:Masterless_Stardust:1273779819783393370>',
							'223': '<:Intertwined_Fate:1273756119814377596>',
							'224': '<:Acquaint_Fate:1273756116186169475>'
						}
						special_item_list.push(`${special[find_item.value as keyof typeof special]} ${find_item.name} (${i.material.count})`)
						return undefined
					} else return `<:Primogem:1257820689096773782> ${truncateText(find_item.name, 18)} (${i.material.count})\n⠀⠀ ID: ${find_item.value}`
				}).filter((i: any) => i !== undefined)
				const embeds: EmbedBuilder[] = []
				for (let i: number = 0; i < item_in_bag.length / 6; i++) {
					let items_1 = item_in_bag.slice(i * 6, i * 6 + 3)
					let items_2 = item_in_bag.slice(i * 6 + 3, i * 6 + 6)
					const number: number = 10000 + Number(player_data.uid)
					const embed: EmbedBuilder = new EmbedBuilder()
						.setColor('#36393F')
						.setAuthor({
							name: user.username + '#' + number.toString()
						})
						.addFields(
							{
								name: Locale['item'][locale],
								value: items_1.join('\n'),
								inline: true
							}
						)
						.setThumbnail('https://static.wikia.nocookie.net/gensin-impact/images/a/a0/Icon_Inventory.png')
						.setFooter({
							text: `Page ${i + 1}/${Math.ceil(item_in_bag.length / 6)}  |  Total Item: ${item_in_bag.length}`
						})
					if (item_in_bag.length > 5) {
						embed.addFields(
							{
								name: '\u200B',
								value: items_2.join('\n'),
								inline: true
							}
						)
					}
					embed.addFields(
						{
							name: Locale['wishingItem'][locale],
							value: special_item_list.join('\n'),
							inline: false
						}
					)
					embeds.push(embed)
				}
				await bagPagination(interaction, embeds, 45000, number - 1)
			} catch (error) {
				console.log(`Error in bag: ${error}\nIP: ${ip}`)
			}
		} else if (interaction.options.getSubcommand() === 'search') {
			const item_name = interaction.options.getString('item-name', true)
			await interaction.deferReply()
			try {
				const player_data = await prismaSqlite.userData.findFirst({
					where: {
						user: { in: [interaction.user.id] }
					},
					select: {
						user: true,
						uid: true
					}
				})
				if (!player_data) return interaction.reply('')
				const item = locale == 'vi' ? item_vi : item_en
				const get_item_in_bag = await getPlayerItems(player_data.uid)
				const item_in_bag = get_item_in_bag.sort((a: any, b: any) => a.item_id - b.item_id).map((i: any) => {
					const find_item = item.find((j: any) => j.value == i.item_id)
					const banned_item: string[] = ['Stella Fortuna', 'Sigil', 'Gnostic Hymn', 'Blessing of the Welkin Moon', 'Chòm Sao', 'Ấn', 'Nhật Ký Hành Trình', 'Không Nguyệt Chúc Phúc']
					const special_item: string[] = ['221', '222', '223', '224']
					if (!find_item) return undefined
					else if (banned_item.some((words: string) => find_item.name.includes(words))) return undefined
					else if (special_item.includes(find_item.value)) return undefined
					else return {
							name: find_item.name, value: find_item.value
						}
				}).filter((i: any) => i !== undefined)
				const index_item_in_bag = item_in_bag.findIndex((i: any) => i.name.toLowerCase().includes(item_name))
				let itemName: any = item_in_bag.find((i: any) => i.name.toLowerCase().includes(item_name))
				const page = Math.ceil(index_item_in_bag / 6)
				const number: number = 10000 + Number(player_data.uid)
				const embed: EmbedBuilder = new EmbedBuilder()
					.setColor('#36393F')
					.setAuthor({
						name: interaction.user.username + '#' + number.toString()
					})
					.setDescription(`${itemName.name} is located in page ${page}.`)
				await interaction.editReply({
					embeds: [embed],
					components: []
				})
			} catch (error) {
				console.log(error)
			}
		}
	},
};

export default command;

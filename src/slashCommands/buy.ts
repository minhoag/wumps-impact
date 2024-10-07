import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	CommandInteraction,
	ComponentType,
	EmbedBuilder,
	InteractionCollector,
	SlashCommandBuilder
} from 'discord.js'
import { SlashCommand } from '../types'
import { sendLog, sendThankYouMail, shopPagination, sqliteUpdate } from '../function'
import { ShopItem, ShopView } from '../data/shop'
import prisma_sqlite from '../prisma/prisma-sqlite'
import { Locale } from '../data/dict'

class Shop {
	name: string;
	interaction: CommandInteraction;
	item: ShopItem[];
	emoji?: string;
	thumbnail: { name: string, link: string }[]
	constructor(name: string, interaction: CommandInteraction, item: ShopItem[], emoji?: string) {
		this.name = name;
		this.interaction = interaction;
		this.item = item;
		this.emoji = emoji;
		this.thumbnail = [
			{
				name: 'Credit',
				link: 'https://static.wikia.nocookie.net/gensin-impact/images/d/d4/Item_Primogem.png'
			}, {
				name: 'Mora',
				link: 'https://static.wikia.nocookie.net/gensin-impact/images/8/84/Item_Mora.png'
			},
			{
				name: 'Points',
				link: 'https://static.wikia.nocookie.net/gensin-impact/images/2/29/Item_Adepti_Sigil.png'
			}
		]
	}
	async sendResponse() {
		const embeds: EmbedBuilder[] = [];
		const imageUrl: string | undefined = this.thumbnail.filter(i => i.name == this.name)[0].link ?? ''
		let locale: string = this.interaction.locale
		if (locale !== 'vi' && locale !== 'en-US' || !locale) locale = 'en-US';
		const title: Record<string, string> = {
			vi: `Chào mừng đến với ${this.name} shop`,
			'en-US': `Welcome to ${this.name} shop`
		}
		for (let i: number = 0; i < this.item.length / 3; i++) {
			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle(`${title[locale]}`)
				.setColor('#36393F')
				.setThumbnail(imageUrl)
				.setFooter({
					text: Locale['buy:instruction'][locale],
					iconURL:
						'https://ik.imagekit.io/asiatarget/genshin/icon_128x128.png?updatedAt=1699385494260',
				});
			this.item.slice(i * 3, i * 3 + 3).map((item: ShopItem, index: number) => {
				embed.addFields({
					name: `**${index + 1 + i * 3}. ${item.name[locale]} ${item.image} (ID: ${item.index})**`,
					value: `**${locale == 'vi' ? 'Giá' : 'Price'}**: ${item.price.toLocaleString()} ${this.emoji ?? this.name}\n**${Locale['quantity'][locale]}**: ${item.quantity}\n**${Locale['description'][locale]}**: ${item.description[locale]}`,
					inline: false,
				});
			});
			embeds.push(embed);
		}
		await shopPagination(this.interaction, embeds, 45000);
	}
}

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('buy')
		.setDescription('Server Shop')
		.setDescriptionLocalizations({
			vi: 'Cửa hàng server'
		})
		.addSubcommand(subcommand =>
			subcommand
				.setName('shop')
				.setDescription('View the server shop items.')
				.setDescriptionLocalizations({
					vi: 'Xem các vật phẩm hiện có trong cửa hàng.'
				}))
		.addSubcommand(subcommand =>
			subcommand
				.setName('points')
				.setDescription('Buy server shop with Points.')
				.setDescriptionLocalizations({
					vi: 'Xem các vật phẩm hiện có trong cửa hàng.'
				})
				.addNumberOption(option =>
					option.setName('uid')
						.setRequired(true)
						.setDescription('Your account uid.')
						.setDescriptionLocalizations({
							vi: 'UID trong game của bạn'
						}))
				.addNumberOption(option =>
					option.setName('id')
						.setRequired(true)
						.setDescription('Input item id.')
						.setDescriptionLocalizations({
							vi: 'Nhập ID vật phẩm bạn cần mua'
						}))
				.addNumberOption(option =>
					option.setName('quantity')
						.setDescription('Item Quantity.')
						.setMaxValue(30)
						.setDescriptionLocalizations({
							vi: 'Nhập số lượng vật phẩm bạn cần mua'
						})))
		.addSubcommand(subcommand =>
			subcommand
				.setName('mora')
				.setDescription('Buy server shop with Mora.')
				.setDescriptionLocalizations({
					vi: 'Xem các vật phẩm hiện có trong cửa hàng máy chủ.'
				})
				.addNumberOption(option =>
					option.setName('uid')
						.setRequired(true)
						.setDescription('Your account uid')
						.setDescriptionLocalizations({
							vi: 'UID trong game của bạn'
						}))
				.addNumberOption(option =>
					option.setName('id')
						.setRequired(true)
						.setDescription('Input item id')
						.setDescriptionLocalizations({
							vi: 'Nhập ID vật phẩm bạn cần mua'
						}))
				.addNumberOption(option =>
					option.setName('quantity')
						.setDescription('Item Quantity')
						.setMaxValue(30)
						.setDescriptionLocalizations({
							vi: 'Nhập số lượng vật phẩm bạn cần mua'
						}))),
	cooldown: 5,
	execute: async (interaction: CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild) return interaction.reply({content: 'Không thể thực hiện ở DM', ephemeral: true});
		const ip = process.env.IP;
		const locale = interaction.locale
		//@ButtonBuilder
		//@ts-ignore
		const shopCredit = new ButtonBuilder().setCustomId('shopCredit').setStyle(ButtonStyle.Success).setLabel('Shop Credit')
		//@ts-ignore
		const shopMora = new ButtonBuilder().setCustomId('shopMora').setStyle(ButtonStyle.Secondary).setLabel('Shop Mora')
		//@ts-ignore
		const shopPoint = new ButtonBuilder().setCustomId('shopPoint').setStyle(ButtonStyle.Secondary).setLabel('Shop Point')
		//@ts-ignore
		const confirm: ButtonBuilder = new ButtonBuilder().setCustomId('confirm').setLabel(Locale['confirm'][locale]).setStyle(ButtonStyle.Success)
		//@ts-ignore
		const cancel: ButtonBuilder = new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel(Locale['cancel'][locale])
		//@interaction-reply
		if (interaction.options.getSubcommand() === 'shop') {
			const userData = await sqliteUpdate(interaction.user.id);
			if (!userData)
				return interaction.reply(
					{
						content: Locale['registererror'][locale],
						ephemeral: true
					})
			const mora: bigint = userData.mora;
			const credit: number = userData.credit;
			const points: number = userData.points;
			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle(Locale['buy:chooseshop'][locale])
				.setColor('#36393F')
				.setThumbnail('https://static.wikia.nocookie.net/gensin-impact/images/a/a8/System_Shop.png/revision/latest?cb=20210911040807')
				.setFooter({
					text: Locale['buy:instruction'][locale],
					iconURL:
						'https://ik.imagekit.io/asiatarget/genshin/icon_128x128.png?updatedAt=1699385494260',
				})
				.setDescription(Locale['buy:howto'][locale])
				.addFields({
					name: 'Credits',
					value: `\`\`\`${credit.toLocaleString()}\`\`\``,
					inline: true
				})
				.addFields({
					name: 'Mora',
					value: `\`\`\`${mora.toLocaleString()}\`\`\``,
					inline: true
				}).addFields({
					name: 'Interactive Points',
					value: `\`\`\`${points.toLocaleString()}\`\`\``,
					inline: true
				});
			const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([shopCredit, shopMora, shopPoint]);
			const response = await interaction.reply({
				embeds: [embed],
				components: [buttonRow],
			});
			const collector: InteractionCollector<any> = response.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 300_000,
			});
			collector.on('collect', async i => {
				if (i.customId === 'shopCredit') {
					// const items: ShopItem[] = ShopView.filter(i => i.type === 'credit');
					// const credit = new Shop('Credit', i, items);
					// await i.deferReply();
					// await credit.sendResponse();
					i.reply({ content: Locale['buy:unavailable'][locale], ephemeral: true })
				} else if (i.customId === 'shopMora') {
					const items: ShopItem[] = ShopView.filter(i => i.type === 'mora');
					const mora = new Shop('Mora', i, items, '<:Mora:1257820686269939824>');
					await mora.sendResponse();
				} else if (i.customId === 'shopPoint') {
					const items: ShopItem[] = ShopView.filter(i => i.type === 'points');
					const point = new Shop('Points', i, items, '<:Points:1263907506535534592>');
					await point.sendResponse();
				}
			});
		} else if (interaction.options.getSubcommand() === 'mora') {
			const uid: number = interaction.options.getNumber('uid', true);
			const itemId: number = interaction.options.getNumber('id', true);
			const quantity: number = interaction.options.getNumber('quantity') ?? 1;
			const price: ShopItem | undefined = ShopView.find((i: ShopItem) => i.index === itemId && i.type === 'mora')
			if (!price) return await interaction.reply({ content: 'Cannot find item', ephemeral: true })
			const uuid: string = new Date().getTime().toString();
			// Confirmation
			const finalPrice = price.price * quantity;
			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle(Locale['buy:titleconfirmation'][locale])
				.setColor('#36393F')
				.setDescription(`${Locale['buy:confirmation'][locale]}\n
				\` ${price.quantity * quantity}x \` ${price.image ?? ''}  ${price.name[locale]} (${finalPrice.toLocaleString()} <:Mora:1257820686269939824>)
				\n${Locale['total'][locale]}: **${finalPrice.toLocaleString()}** <:Mora:1257820686269939824>`);
			const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents([cancel, confirm]);
			const response = await interaction.reply({
				embeds: [embed],
				components: [buttonRow],
				ephemeral: true
			});
			const collectorFilter = (i: any) => i.user.id === interaction.user.id;
			try {
				const confirmation = await response.awaitMessageComponent({filter: collectorFilter, time: 45_000});
				if (confirmation.customId === 'confirm') {
					//check if sufficient
					const userData = await sqliteUpdate(interaction.user.id);
					if (!userData) return await confirmation.update({ content: Locale['registererror'][locale] })
					if (userData.mora - BigInt(finalPrice) < 0) return await confirmation.update({
						content: Locale['buy:insufficient'][locale],
						embeds: [],
						components: [],
					});
					await prisma_sqlite.userData.update({
						where: {
							user: interaction.user.id,
						},
						data: {
							mora: {
								decrement: finalPrice,
							},
						},
					});
					await fetch(
						`http://${ip}:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1135&uid=${uid}&scoin=${finalPrice}`,
					).then(async (res: Response) => {
						const response: any = await res.json();
						if (response.msg === 'succ') {
							await sendThankYouMail(price, quantity, uid, uuid)
							await confirmation.update({
								content: Locale['buy:success'][locale],
								embeds: [],
								components: [],
							});
							await sendLog(interaction, `<@${interaction.user.id}> has bought **${quantity} x ${price.image} ${price.name["en-GB"]}**`)
						} else {
							await confirmation.update({
								content: Locale['confirm'][locale],
								embeds: [],
								components: [],
							});
						}
					}).catch(async(error) => {
						await confirmation.update({ content: Locale['generalerror'][locale] + error.name + ' ' + error.message })
					});
				} else if (confirmation.customId === 'cancel') {
					await confirmation.update({ content: Locale['buy:cancel'][locale], embeds: [], components: [] })
				}
			} catch (e) {
				console.log(e);
				await interaction.editReply({
					content: Locale['notresponse'][locale],
					embeds: [],
					components: [],
				});
			}
		} else if (interaction.options.getSubcommand() === 'points') {
			const uid: number = interaction.options.getNumber('uid', true);
			const itemId: number = interaction.options.getNumber('id', true);
			const quantity: number = interaction.options.getNumber('quantity') ?? 1;
			const price: ShopItem | undefined = ShopView.find((i: ShopItem) => i.index === itemId && i.type === 'points')
			if (!price) return await interaction.reply({ content: 'Cannot find item', ephemeral: true })
			const uuid: string = new Date().getTime().toString();
			// Confirmation
			const finalPrice = price.price * quantity;
			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle(Locale['buy:titleconfirmation'][locale])
				.setColor('#36393F')
				.setDescription(`${Locale['buy:confirmation'][locale]}\n
				\` ${price.quantity * quantity}x \` ${price.image ?? ''}  ${price.name[locale]} (${finalPrice.toLocaleString()} <:Points:1263907506535534592>)
				\n${locale == "vi" ? "Tổng" : "Total"}: **${finalPrice.toLocaleString()}** <:Points:1263907506535534592>`);
			const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents([cancel, confirm]);
			const response = await interaction.reply({
				embeds: [embed],
				components: [buttonRow],
				ephemeral: true
			});
			const collectorFilter = (i: any) => i.user.id === interaction.user.id;

			try {
				const confirmation = await response.awaitMessageComponent({filter: collectorFilter, time: 45_000});
				if (confirmation.customId === 'confirm') {
					//check if sufficient
					const userData = await sqliteUpdate(interaction.user.id);
					if (!userData) return await confirmation.update({ content: Locale['registererror'][locale] })
					if (userData.points - finalPrice < 0) return await confirmation.update({
						content: Locale['buy:insufficient'][locale],
						embeds: [],
						components: [],
					});
					await prisma_sqlite.userData.update({
						where: {
							user: interaction.user.id,
						},
						data: {
							points: {
								decrement: finalPrice,
							},
						},
					});
					await sendThankYouMail(price, quantity, uid, uuid)
					await confirmation.update({
						content: Locale['buy:success'][locale],
						embeds: [],
						components: [],
					});
					// send log
					await sendLog(interaction, `<@${interaction.user.id}> has bought **${quantity} x ${price.image} ${price.name[locale]}**`)
				} else if (confirmation.customId === 'cancel') {
					await confirmation.update({ content: Locale['buy:cancel'][locale], embeds: [], components: [] })
				}
			} catch (e) {
				console.log(e);
				await interaction.editReply({
					content: Locale['notresponse'][locale],
					embeds: [],
					components: [],
				});
			}
		}
	},
};

export default command;

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
import { shopPagination, sqliteUpdate } from '../function'
import { ShopItem, ShopView } from '../data/shop'
import moment from 'moment/moment'
import prisma_sqlite from '../prisma/prisma-sqlite'

class Shop {
	name: string;
	interaction: CommandInteraction;
	item: ShopItem[];
	emoji?: string;

	constructor(name: string, interaction: CommandInteraction, item: ShopItem[], emoji?: string) {
		this.name = name;
		this.interaction = interaction;
		this.item = item;
		this.emoji = emoji;
	}

	async sendResponse() {
		const embeds: EmbedBuilder[] = [];
		const thumbnail: {name: string, link: string}[] = [
			{
				name: 'Credit',
				link: 'https://static.wikia.nocookie.net/gensin-impact/images/d/d4/Item_Primogem.png',
			}, {
				name: 'Mora',
				link: 'https://static.wikia.nocookie.net/gensin-impact/images/8/84/Item_Mora.png',
			},
		];
		const imageUrl: string | undefined = thumbnail.filter(i => i.name == this.name)[0].link ?? '';
		let locale: string = this.interaction.locale
		if (locale !== 'vi' && locale !== 'en-US' || !locale) locale = 'en-US';
		const title: Record<string, string> = {
			vi: `Chào mừng đến với ${this.name} shop`,
			'en-US': `Welcome to ${this.name} shop`
		}
		for (let i: number = 0; i < this.item.length / 3; i++) {
			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle(`${title[locale]}`)
				.setColor('#151220')
				.setThumbnail(imageUrl)
				.setFooter({
					text: `${locale == "vi" ? "Để mua vật phẩm, sử dụng lệnh `shop mora <\/ID>` để giao dịch" : "To buy the item, use command `shop mora <\/ID>` to buy it."}`,
					iconURL:
						'https://ik.imagekit.io/asiatarget/genshin/icon_128x128.png?updatedAt=1699385494260',
				});
			this.item.slice(i * 3, i * 3 + 3).map((item: ShopItem, index: number) => {
				embed.addFields({
					name: `**${index + 1 + i * 3}. ${item.name[locale]} ${item.image} (ID: ${item.index})**`,
					value: `**${locale == "vi" ? "Giá" : "Price"}**: ${item.price.toLocaleString()} ${this.emoji ?? this.name}\n**${locale == "vi" ? "Số lượng" : "Quantity"}**: ${item.quantity}\n**${locale == "vi" ? "Mô tả" : "Description"}**: ${item.description[locale]}`,
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
		let locale: string = interaction.locale;
		if (locale !== 'vi' && locale !== 'en-US' || !locale) locale = 'en-US';
		if (interaction.options.getSubcommand() === 'shop') {
			const userData = await sqliteUpdate(interaction.user.id);
			if (!userData)
				return interaction.reply(
					{
						content: 'Use command `/register` to create a new server account. If you already created a new server account but met this error. please contact admin to resolve the issue',
						ephemeral: true
					})
			const mora: bigint = userData.mora;
			const credit: number = userData.credit;
			const points: number = userData.points;
			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle(`${locale == "vi" ? "Chọn cửa hàng bạn muốn xem" : "Choose the shop you want to view."}`)
				.setColor('#151220')
				.setThumbnail('https://static.wikia.nocookie.net/gensin-impact/images/a/a8/System_Shop.png/revision/latest?cb=20210911040807')
				.setFooter({
					text: `${locale == "vi" ? "Để mua vật phẩm, sử dụng lệnh `shop mora <\/ID>` để giao dịch" : "To buy the item, use command `shop mora <\/ID>` to buy it."}`,
					iconURL:
						'https://ik.imagekit.io/asiatarget/genshin/icon_128x128.png?updatedAt=1699385494260',
				});
			locale == "vi" ?
				embed.setDescription('Xem và chọn cửa hàng bạn muốn sử dụng tiền của mình.\n\n' +
					'**Credits**: Kiếm được bằng cách quyên góp cho máy chủ (sắp có).\n' +
					'**Mora**: Đổi Mora trong game để mua các vật phẩm cao cấp.\n' +
					'**Interactive Coins**: Đổi điểm kiếm được khi chat trong máy chủ này để đổi lấy hàng hóa (sắp có).\n' +
					'\n**Cách mua**: Đăng ký tài khoản của bạn với lệnh `/register` và làm theo hướng dẫn. Việc này nhằm ngăn chặn việc sử dụng Mora từ tài khoản khác.\n' +
					'\n**Lưu ý**: Số luượng Mora có thể mất đến 1 phút để cập nhật. Nếu bạn thấy số Mora của mình sai, vui lòng thử lại sau 1 phút.\n'
				): embed.setDescription('View and choose the shop you want to spend your currency on.\n\n' +
					'**Credits**: Earned by donating to the server (coming soon).\n' +
					'**Mora**: Exchange in-game Mora to buy premium items.\n' +
					'**Interactive Coins**: Exchange points earned by chat in this server to exchange for goods (coming soon).\n' +
					'\n**How to buy**: Register your account with `/register` and follow the instruction. This is to prevent using other account Mora.\n' +
					'\n**Remarks**: Mora may take up to 1 minute to update. If you see that your Mora number is wrong. Please try again in 1 minute.\n',
				)
			embed.addFields({
				name: 'Credits',
				value: `\`\`\`${credit.toLocaleString()}\`\`\``,
				inline: true,
			});
			embed.addFields({
				name: 'Mora',
				value: `\`\`\`${mora.toLocaleString()}\`\`\``,
				inline: true,
			});
			embed.addFields({
				name: 'Interactive Points',
				value: `\`\`\`${points.toLocaleString()}\`\`\``,
				inline: true,
			});
			//@ts-ignore
			const shopCredit = new ButtonBuilder().setCustomId('shopCredit').setStyle(ButtonStyle.Success).setLabel('Shop Credit');
			//@ts-ignore
			const shopMora = new ButtonBuilder().setCustomId('shopMora').setStyle(ButtonStyle.Secondary).setLabel('Shop Mora');
			//@ts-ignore
			const shopPoint = new ButtonBuilder().setCustomId('shopPoint').setStyle(ButtonStyle.Secondary).setLabel('Shop Point');
			const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([shopCredit, shopMora, shopPoint]);
			const response = await interaction.reply({
				embeds: [embed],
				components: [buttonRow],
			});
			//@interaction-reply
			const collector: InteractionCollector<any> = response.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 3_600_000,
			});
			collector.on('collect', async i => {
				if (i.customId === 'shopCredit') {
					// const items: ShopItem[] = ShopView.filter(i => i.type === 'credit');
					// const credit = new Shop('Credit', i, items);
					// await i.deferReply();
					// await credit.sendResponse();
					i.reply({ content: `${locale == "vi" ? "Shop tạm thời không khả dụng" : "This shop is not yet available"}`, ephemeral: true })
				} else if (i.customId === 'shopMora') {
					const items: ShopItem[] = ShopView.filter(i => i.type === 'mora');
					const mora = new Shop('Mora', i, items, '<:Mora:1257820686269939824>');
					await mora.sendResponse();
				} else if (i.customId === 'shopPoint') {
					// const items: ShopItem[] = ShopView.filter(i => i.type === 'point');
					// const point = new Shop('Point', i, items);
					// await i.deferReply();
					// await point.sendResponse();
					i.reply({ content: `${locale == "vi" ? "Shop tạm thời không khả dụng" : "This shop is not yet available"}`, ephemeral: true })
				}
			});
		} else if (interaction.options.getSubcommand() === 'mora') {
			const uid: number = interaction.options.getNumber('uid', true);
			const itemId: number = interaction.options.getNumber('id', true);
			const quantity: number = interaction.options.getNumber('quantity') ?? 1;
			const price: ShopItem | undefined = ShopView.find((i: ShopItem) => i.index === itemId);
			if (!price) return await interaction.reply({ content: 'Cannot find item', ephemeral: true })
			const uuid: string = new Date().getTime().toString();
			// Confirmation
			const finalPrice = price.price * quantity;
			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle(`${locale == "vi" ? "Xác nhận mua" : "Pending Confirmation"}`)
				.setColor('#151220')
				.setDescription(`${locale == "vi" ? "Bạn có xác nhận muốn mua vật phẩm này?" : "Would you like to confirm buying following item?"}\n
				\` ${price.quantity * quantity}x \` ${price.image ?? ''}  ${price.name[locale]} (${finalPrice.toLocaleString()} <:Mora:1257820686269939824>)
				\n${locale == "vi" ? "Tổng" : "Total"}: **${finalPrice.toLocaleString()}** <:Mora:1257820686269939824>`);
			//@ts-ignore
			const confirm: ButtonBuilder = new ButtonBuilder().setCustomId('confirm').setLabel(`${locale == "vi" ? "Xác nhận" : "Confirm"}`).setStyle(ButtonStyle.Success);
			//@ts-ignore
			const cancel: ButtonBuilder = new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel(`${locale == "vi" ? "Hủy" : "Cancel"}`);
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
					if (!userData) return await confirmation.update({content: 'Use command `/register` to create a new server account. If you already created a new server account but met this error. please contact admin to resolve the issue'});
					if (userData.mora - BigInt(finalPrice) < 0) return await confirmation.update({
						content: `${locale == "vi" ? "Bạn không đủ tiền. Nếu bạn tin rằng đây là lỗi, vui lòng liên hệ với quản trị viên để giải quyết." : "You have insufficient to purchase. If you believe that this is a mistake, contact admin to resolve."}`,
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
							const title: string = 'Thank you for your purchasing';
							const sender: string = 'P・A・I・M・O・N';
							const description: string = 'Thank you very much for shopping with us. We hope you enjoy the game.';
							const seconds = moment().add(Number(365), 'days').unix();
							await fetch(
								`http://${ip}:14861/api?sender=${sender}&title=${title}&content=${description}&item_list=${price.itemId}:${price.quantity * quantity}&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
							);
							await confirmation.update({
								content: `${locale == "vi" ? "Vật phẩm thành công và đã được gửi vào mail tài khoản của bạn." : "Item buy successfully. Please check your email."}`,
								embeds: [],
								components: [],
							});
						} else {
							await confirmation.update({
								content: `${locale == "vi" ? "Xác nhận" : "Confirm"}`,
								embeds: [],
								components: [],
							});
						}
					}).catch(async(error) => {
						await confirmation.update({content: `${locale == 'vi' ? "Đã có lỗi xảy ra, vui lòng liên hệ admin hoặc supporter để được hỗ trợ. Thông tin lỗi: " + error.name + " " + error.message : "There is an error occured. Please contact admin or supporter to resolve the issue. Error: " + error.name + " " + error.message }`})
					});
				} else if (confirmation.customId === 'cancel') {
					await confirmation.update({content: `${locale == "vi" ? "Giao dịch đã được hủy" : "Buying cancelled"}`, embeds: [], components: []});
				}
			} catch (e) {
				console.log(e);
				await interaction.editReply({
					content: 'Confirmation not received within 1 minute, cancelling...',
					embeds: [],
					components: [],
				});
			}
		}
	},
};

export default command;

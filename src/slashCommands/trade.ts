import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	CommandInteraction,
	ComponentType,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandUserOption,
	User
} from 'discord.js'
import { SlashCommand } from '../types'
import { Locale } from '../data/dict'
import { sqliteUpdate } from '../function'
import prismaSqlite from '../prisma/prisma-sqlite'

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('trade')
		.setDescription('Trade item or mora with another player.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addUserOption((option: SlashCommandUserOption) =>
			option.setName('user').setDescription('The user you wish to trade with.').setRequired(true)
		)
		.addNumberOption((option) =>
			option.setName('give-mora').setDescription('How much mora you wish to give.').setRequired(true)
		)
		.addNumberOption((option) =>
			option.setName('take-mora').setDescription('How much mora you wish to take.')
		)
		.addStringOption((option) =>
			option.setName('give-item').setDescription('Item you wish to give. Separate with comma.')
		),
	cooldown: 5,
	execute: async (interaction: CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;
		const locale: string = interaction.locale;
		const user: User = interaction.options.getUser('user', true);
		const give_mora: number = interaction.options.getNumber('give-mora', true);
		const take_mora: number = interaction.options.getNumber('take-mora') ?? 0;
		const give_item: string = interaction.options.getString('give-item') ?? ""
		const embed: EmbedBuilder = new EmbedBuilder()
			.setTitle(Locale['title:pending'][locale])
			.setColor('#36393F')
			.setThumbnail("https://static.wikia.nocookie.net/gensin-impact/images/5/5d/System_Genius_Invokation_TCG.png")
			.setFooter({
				text: Locale['trade:footer'][locale],
				iconURL:
					'https://ik.imagekit.io/asiatarget/genshin/icon_128x128.png?updatedAt=1699385494260',
			})
			.addFields(
			{
				name: `${interaction.user.username} ${locale == "vi" ? "đề nghị vật phẩm" : "offer items"}`,
				value: "*this function will be available in the nearest future*",
				inline: true
			},
			{
				name: `${user.username} ${locale == "vi" ? "đề nghị vật phẩm" : "offer items"}`,
				value: "*this function will be available in the nearest future*",
				inline: true
			},
			{ name: '\u200B', value: '\u200B' },
			{
				name: `${interaction.user.username} <:Mora:1257820686269939824>`,
				value: give_mora.toLocaleString(),
				inline: true
			},
			{
				name: `${user.username} <:Mora:1257820686269939824>`,
				value: take_mora.toLocaleString(),
				inline: true
			},
		);
		const confirm: ButtonBuilder = new ButtonBuilder()
			.setCustomId('confirm_trade')
			.setLabel(Locale['title:confirm'][locale])
			// @ts-ignore
			.setStyle(ButtonStyle.Success)
		const cancel: ButtonBuilder = new ButtonBuilder()
			.setCustomId('cancel_trade')
			.setLabel(Locale['title:cancel'][locale])
			// @ts-ignore
			.setStyle(ButtonStyle.Danger);
		const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([confirm, cancel]);
		const response = await interaction.reply({
			content: `<@${user.id}>, ${Locale['trade:mention'][locale]}`,
			embeds: [embed],
			components: [buttonRow],
		})
		//@interaction-reply
		let confirmation: any[] = [];
		const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
		collector.on('collect', async i => {
			try {
				if (![interaction.user.id, user.id].includes(i.user.id)) return
				if (i.customId === 'confirm_trade') {
					confirmation.push(i.user.username + ' confirmed')
					embed.setFooter({
						text: confirmation.join(', '),
						iconURL:
							'https://ik.imagekit.io/asiatarget/genshin/icon_128x128.png?updatedAt=1699385494260',
					});
					await i.update({
						embeds: [embed],
						components: [buttonRow],
					});
					if(confirmation.length === 2) {
						const loadingEmbed = new EmbedBuilder()
							.setTitle("Trade is processing")
							.setColor('#36393F')
							.setDescription("Please wait for around 30 seconds...")
							.setFooter({
								text: confirmation.join(', '),
								iconURL:
									'https://ik.imagekit.io/asiatarget/genshin/icon_128x128.png?updatedAt=1699385494260',
							});
						await interaction.editReply({
							content: '',
							embeds: [loadingEmbed],
							components: [],
						});
						return collector.stop()
					}
				} else if (i.customId === 'cancel_trade') {
					return collector.stop()
				}
			} catch {
				const failedEmbed: EmbedBuilder = new EmbedBuilder()
					.setTitle(Locale['title:failed'][locale])
					.setColor('#36393F')
					.setDescription(Locale['description:failed'][locale])
				await interaction.editReply({ embeds: [failedEmbed], components: [] });
			}
		});

		collector.on('end', async() => {
			if(confirmation.length < 2) {
				const failedEmbed: EmbedBuilder = new EmbedBuilder()
					.setTitle(Locale['title:failed'][locale])
					.setColor('#36393F')
					.setDescription(Locale['description:failed'][locale])
				await interaction.editReply({ content: '', embeds: [failedEmbed], components: [] });
			} else {
				const ip = process.env.IP;
				const uuid: string = new Date().getTime().toString();
				const uids = await prismaSqlite.userData.findMany({
					where: {
						user: { in: [interaction.user.id, user.id] }
					},
					select: {
						user: true,
						uid: true
					}
				});
				if (!uids) {
					await interaction.editReply({
						content: 'There is an error occured.  Reason: not found sender or receiver uid.',
						embeds: [],
						components: [],
					});
					return;
				}
				const sender_uid = uids.find(id => id.user === interaction.user.id)
				const receiver_uid = uids.find(id => id.user === user.id)
				if (!sender_uid || !receiver_uid) {
					await interaction.editReply({
						content: 'There is an error occured. Reason: not found sender uid or receiver uid',
						embeds: [],
						components: [],
					});
					return;
				}
				const sender_data = await sqliteUpdate(interaction.user.id);
				const receiver_data = await sqliteUpdate(user.id);
				if (!sender_data || !receiver_data) {
					await interaction.editReply({
						content: 'There is an error occured. Reason: not found sender or receiver.',
						embeds: [],
						components: [],
					});
					return;
				}
				// check if sender mora is negative
				if (sender_data.mora - BigInt(give_mora) + BigInt(take_mora) < 0) {
					await interaction.editReply({
						content: 'There is an error occured.  Reason: Send don\'t have enough give Mora',
						embeds: [],
						components: [],
					});
					return;
				}
				// check if receiver mora is negative
				if (receiver_data.mora + BigInt(give_mora) - BigInt(take_mora) < 0) {
					await interaction.editReply({
						content: 'There is an error occured. Reason: Receiver don\'t have enough receive Mora',
						embeds: [],
						components: [],
					});
					return;
				}
				// whether substract or add
				const total_mora = give_mora - take_mora
				if (total_mora > 0) {
					await fetch(
						`http://${ip}:14861/api?region=dev_gio&ticket=GM&cmd=1116&uid=${receiver_uid.uid}&msg=scoin%20${total_mora}`,
					).then(async () => await fetch(
						`http://${ip}:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1135&uid=${sender_uid.uid}&scoin=${total_mora}`,
					))
				} else {
					await fetch(
						`http://${ip}:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1135&uid=${receiver_uid.uid}&scoin=${total_mora}`,
					).then(async () => await fetch(
						`http://${ip}:14861/api?region=dev_gio&ticket=GM&cmd=1116&uid=${sender_uid.uid}&msg=scoin%20${total_mora}`,
					))
				}
				// success embed send
				const successEmbed: EmbedBuilder = new EmbedBuilder()
					.setTitle(Locale['title:success'][locale])
					.setColor('#36393F')
					.setDescription(Locale['description:success'][locale])
				await interaction.editReply({
					content: '',
					embeds: [successEmbed],
					components: [],
				});
			}
		})
	},
};

export default command;

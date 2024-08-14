import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	CommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder
} from 'discord.js'
import { SlashCommand } from '../types';

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('execute')
		.setDescription('Thực thi lệnh lên server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('Chọn lệnh')
				.setRequired(true)
				.addChoices(
					{ name: 'Restart Server', value: 'restart' },
					{ name: 'Chạy event TDV', value: 'domain' },
					{ name: 'Chạy event Địa Mạch', value: 'layline' },
					{ name: 'Kiểm tra event đã hoạt động', value: 'check' },
				)
		),
	cooldown: 1,
	execute: async (interaction: CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild)
			return interaction.reply('Không thể thực hiện ở DM');
		const type: string = interaction.options.getString('type', true);
		if (type === 'restart') {
			const embed: EmbedBuilder = new EmbedBuilder()
				.setTitle('Xác nhận restart server')
				.setColor('#36393F')
				.setDescription('Hãy xác nhận là bạn muốn thực hiện việc restart server. Chỉ được sử dụng khi server đã bị sập/DDoS/mất kết nối')
			//@ts-ignore
			const confirm: ButtonBuilder = new ButtonBuilder().setCustomId('confirm').setLabel('Xác nhận').setStyle(ButtonStyle.Success);
			//@ts-ignore
			const cancel: ButtonBuilder = new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Danger).setLabel('Huỷ');
			const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents([cancel, confirm]);
			const response = await interaction.reply({
				embeds: [embed],
				components: [buttonRow],
				ephemeral: true
			});
			const collectorFilter = (i: any) => i.user.id === interaction.user.id;
			try {
				const confirmation = await response.awaitMessageComponent({filter: collectorFilter, time: 45_000});
				const replyEmbed: EmbedBuilder = new EmbedBuilder()
					.setColor('#36393F')
				if (confirmation.customId === 'cancel') {
					replyEmbed.setTitle('Đã huỷ thành công').setDescription('Huỷ lệnh restart thành công!')
				} else {
					const request: Response = await fetch('https://backend.control.luxvps.net/v1/service/f1bfab30-b687-4f33-bd7e-10e6520cb79f/restart?token=11f66be3-e95b-4795-8434-abfdb181fa3f', {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json'
						}
					});
					const response: Response = await request.json();
					if (!response.status) {
						replyEmbed.setTitle('Thành công').setDescription(`Server đã restart thành công. Server sẽ khả dụng trong vòng 8-10 phút.`)
					} else {
						replyEmbed.setTitle('Lỗi').setDescription(`Server đã restart đã có lỗi. Server phản hồi: ${response}.`)
					}
				}
				return confirmation.update({
					embeds: [replyEmbed],
					components: [],
				})
			} catch {
				await interaction.editReply({
					content: 'Huỷ nhận phản hồi vì đã quá thời gian phản hồi: 45 giây',
					embeds: [],
					components: [],
				});
			}
		} else if (type === 'domain') {
			await fetch(
				`http://wumpus.site:12000/domain`
			).then(async res => {
				const response = JSON.stringify(await res.json());
				await interaction.reply ('Khởi chạy sự kiện Thánh Dị Vật Thành công. Server phản hồi: ' + response);
			}).catch(async error => await interaction.reply('Đã có lỗi xảy ra. Mã lỗi: ' + error.message));
		} else if (type === 'layline') {
			await fetch(
				`http://wumpus.site:12000/layline`
			).then(async res => {
				const response = JSON.stringify(await res.json());
				await interaction.reply ('Khởi chạy sự kiện Địa Mạch Thành công. Server phản hồi: ' + response);
			}).catch(async error => await interaction.reply('Đã có lỗi xảy ra. Mã lỗi: ' + error.message));
		} else if (type === 'check') {
			await fetch(
				`http://wumpus.site:12000/check`
			).then(async res => {
				const response = JSON.stringify(await res.json());
				await interaction.reply ('Server phản hồi: ' + response);
			}).catch(async error => await interaction.reply('Đã có lỗi xảy ra. Mã lỗi: ' + error.message));
		}
	},
};

export default command;

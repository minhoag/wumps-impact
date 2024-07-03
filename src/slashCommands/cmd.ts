import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	CommandInteraction,
	EmbedBuilder,
} from 'discord.js';
import {SlashCommand} from '../types';
import client from '..';
import moment from 'moment';

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('cmd')
		.setDescription('Gửi lệnh GM.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('admin')
				.setDescription('Gửi lệnh admin cho người chơi.')
				.addStringOption((option) =>
					option.setName('uid').setDescription('UID').setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('msg')
						.setDescription('Cú pháp')
						.setRequired(true)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('info')
				.setDescription('Lấy thông tin cơ bản của người chơi.')
				.addStringOption((option) =>
					option.setName('uid').setDescription('UID').setRequired(true),
				),
		),
	cooldown: 1,
	execute: async (interaction: CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild)
			return interaction.reply('Không thể thực hiện ở DM');
		const ip = process.env.IP;
		if (interaction.options.getSubcommand() === 'admin') {
			const uid = interaction.options.getString('uid', true);
			const msg = interaction.options.getString('msg', true);
			try {
				const msg_modified = msg.replace(/ /g, '%20');
				await fetch(
					`http://${ip}:14861/api?region=dev_gio&ticket=GM&cmd=1116&uid=${uid}&msg=${msg_modified}`,
				);
				await interaction.deferReply({ephemeral: true});
				await interaction.followUp({
					content: `Đã thực hiện thành công lệnh: ${msg} cho người chơi có UID: ${uid}`,
					ephemeral: true,
				});
			} catch (error) {
				await interaction.reply({
					content: `Đã có lỗi xảy ra: ${error.message}`,
					ephemeral: true,
				});
			}
		} else if (interaction.options.getSubcommand() === 'info') {
			const uid = interaction.options.getString('uid', true);
			try {
				const result = await fetch(
					`http://${ip}:14861/api?region=dev_gio&ticket=GM&cmd=1153&uid=${uid}`,
				).then((res) => res.json());
				if (!result || result.length === 0)
					return interaction.reply('Không tìm thấy thông tin người chơi.');
				const embed = new EmbedBuilder()
					.setColor('#2F3137')
					.setTitle(
						`Kết quả tìm kiếm: **${result['data']['data']['basic_brief']['nickname']}**`,
					)
					.setAuthor({
						name: client.user?.username as string,
						iconURL: client.user?.displayAvatarURL(),
					})
					.setTimestamp()
					.addFields(
						{name: '\u200B', value: '**Thông tin cơ bản**'},
						{
							name: 'Level',
							value: `${result['data']['data']['basic_brief']['level']}`,
							inline: true,
						},
						{
							name: 'Ngày đăng ký',
							value: moment(
								result['data']['data']['basic_brief']['register_time'] * 1000,
							).format('DD/MM/YYYY'),
							inline: true,
						},
						{name: '\u200B', value: '**Các giá trị tiền tệ**'},
						{
							name: 'Genesis',
							value: `${result['data']['data']['basic_brief'][
								'mcoin'
								].toLocaleString()}`,
							inline: true,
						},
						{
							name: 'Mora',
							value: `${result['data']['data']['basic_brief'][
								'scoin'
								].toLocaleString()}`,
							inline: true,
						},
						{
							name: 'Primogems',
							value: `${result['data']['data']['basic_brief'][
								'hcoin'
								].toLocaleString()}`,
							inline: true,
						},
					);
				await interaction.deferReply({ephemeral: true});
				await interaction.followUp({
					embeds: [embed],
					ephemeral: true,
				});
			} catch (error) {
				await interaction.followUp({
					content: `Đã có lỗi xảy ra: ${error.message}`,
					ephemeral: true,
				});
			}
		}
	},
};

export default command;

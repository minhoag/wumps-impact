import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	CommandInteraction
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
			await fetch(
				`http://wumpus.site:12000/restart`
			).then(async res => {
				const response = JSON.stringify(await res.json());
				await interaction.reply ('Server restart Thành công. Server phản hồi: ' + response);
			}).catch(async error => await interaction.reply('Đã có lỗi xảy ra. Mã lỗi: ' + error.message));
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

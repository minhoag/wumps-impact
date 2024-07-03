import {Interaction} from 'discord.js';
import {BotEvent, User} from '../types';
import {getUsers} from '../function';
import moment from 'moment';

const event: BotEvent = {
	name: 'interactionCreate',
	execute: async (interaction: Interaction) => {
		if (!interaction.isModalSubmit()) return;
		if (!interaction.guild)
			return interaction.reply('Không thể thực hiện ở DM');
		const ip = process.env.IP;
		if (interaction.customId === 'mailForm') {
			const receiver = interaction.fields.getTextInputValue('receiverInput');
			const expiry = interaction.fields.getTextInputValue('expiryInput');
			const title = interaction.fields.getTextInputValue('titleInput');
			const description = interaction.fields.getTextInputValue(
				'descriptionInput',
			);
			const item = interaction.fields
				.getTextInputValue('itemInput')
				.replace(/\s/g, '');
			// Xử lý tên
			const name = receiver.split(':');
			// Ngày sang giây
			const seconds = moment().add(Number(expiry), 'days').unix();
			try {
				const uuid = new Date().getTime();
				if (name[0] === 'all') {
					const users = await getUsers();
					let error: number[] = [];
					users.map(async (user: User) => {
						const res = await fetch(
							`http://${ip}:14861/api?sender=${name[1]}&title=${title}&content=${description}&item_list=${item}&expire_time=${seconds}&is_collectible=False&uid=${user.uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
						);
						const json = await res.json();
						if (json.msg !== 'succ') error.push(user.uid);
					});
					if (!error.length) {
						await interaction.reply({
							content: 'Gửi thư thành công',
							ephemeral: true,
						});
					} else {
						await interaction.reply({
							content:
								'Gửi thư không thành công ở các UID: `' +
								error.join(', ') +
								'`',
							ephemeral: true,
						});
					}
				} else {
					const res = await fetch(
						`http://${ip}:14861/api?sender=${name[1]}&title=${title}&content=${description}&item_list=${item}&expire_time=${seconds}&is_collectible=False&uid=${name[0]}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
					);
					const json = await res.json();
					if (json.msg !== 'succ') {
						await interaction.reply({
							content: 'Gửi thư không thành công. Lỗi: `' + json.msg + '`',
							ephemeral: true,
						});
						return;
					}
					await interaction.reply({
						content: 'Gửi thư thành công',
						ephemeral: true,
					});
				}
			} catch (error) {
				console.log(error.message);
			}
		}
	},
};

export default event;

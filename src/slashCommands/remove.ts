import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	CommandInteraction,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
} from 'discord.js';
import {SlashCommand} from '../types';
import {deleteGachaScheduleConfig, getGachaScheduleConfig} from '../function';
import {item} from '../data/item';
import moment from 'moment';

var items: {name: string; value: string}[] = [];
const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Xoá khỏi server')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option) =>
			option.setName('event').setDescription('Tên sự kiện').setRequired(true).setAutocomplete(true)
		),
	cooldown: 1,
	autocomplete: async (interaction) => {
		try {
			const focusedOption = interaction.options.getFocused(true);
			const getGachaSchedule = await getGachaScheduleConfig();
			if (!getGachaSchedule) return;
			items = [];
			getGachaSchedule.map((data: any) => {
				const config = JSON.parse(data.gacha_up_config);
				if (!config) return;
				const gachaUpList = config.gacha_up_list;
				if (!gachaUpList) return;
				const item_list = config.gacha_up_list[0].item_list;
				item_list.map((id: string | number) => {
					const find: {name: string; value: string} = item.find((item) => item.value == id) ?? {
						name: 'Không tìm thấy',
						value: 'Không tìm thấy',
					};
					const modifiedFound = {
						name: data.schedule_id.toString() + '. ' + find.name + ' - ' + moment(data.end_time).format('DD/MM/YY'),
						value: data.schedule_id.toString(),
					};
					items.push(modifiedFound);
				});
			});
			const filtered: {
				name: string;
				value: string;
			}[] = items.filter((choice: any) => choice.name.includes(focusedOption.value));
			const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
			await interaction.respond(options);
		} catch (error) {
			console.log(`Error in Autocomplete remove sự kiện: ${error.message}`);
		}
	},
	execute: async (interaction: CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild) return interaction.reply('Không thể thực hiện ở DM');
		const event = interaction.options.getString('event', true);
		const eventName = items.find((item) => item.value == event);
		const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Xác nhận');
		const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Hủy');
		const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);
		const response = await interaction.reply({
			content: `Xác nhận xóa sự kiện ${eventName?.name}?`,
			components: [row],
		});
		const collectorFilter = (i: any) => i.user.id === interaction.user.id;
		try {
			const confirmation = await response.awaitMessageComponent({
				filter: collectorFilter,
				time: 30_000,
			});
			if (confirmation.customId === 'confirm') {
				await deleteGachaScheduleConfig(Number(event));
				await confirmation.update({
					content: `Đã xóa sự kiện ${eventName?.name}`,
					components: [],
				});
			} else if (confirmation.customId === 'cancel') {
				await confirmation.update({content: 'Đã hủy xóa', components: []});
			}
		} catch (e) {
			await interaction.editReply({
				content: `Không có xác nhận trong vòng 30 giây. Lệnh xóa sự kiện ${eventName?.name} đã được hủy`,
				components: [],
			});
		}
	},
};

export default command;

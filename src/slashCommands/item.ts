import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	CommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../types';
import {item} from '../data/item';
import {extractSubstats} from '../function';

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('item')
		.setDescription('Gửi lệnh GM thêm item cho người chơi.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('add')
				.setDescription('Gửi lệnh thêm item cho người chơi.')
				.addStringOption((option) =>
					option
						.setName('uid')
						.setDescription('UID của người chơi')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('id')
						.setDescription('Id của item')
						.setRequired(true)
						.setAutocomplete(true),
				)
				.addNumberOption((option) =>
					option.setName('amount').setDescription('Số lượng'),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('clear')
				.setDescription('Gửi lệnh xóa item của người chơi.')
				.addStringOption((option) =>
					option
						.setName('uid')
						.setDescription('UID của người chơi')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('id')
						.setDescription('Id của item')
						.setRequired(true)
						.setAutocomplete(true),
				)
				.addNumberOption((option) =>
					option.setName('amount').setDescription('Số lượng'),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('all')
				.setDescription('Thêm tất cả item cho người chơi.')
				.addStringOption((option) =>
					option
						.setName('uid')
						.setDescription('UID của người chơi')
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('artifact')
				.setDescription('Thêm god roll artifact cho người chơi.')
				.addStringOption((option) =>
					option
						.setName('uid')
						.setDescription('UID của người chơi')
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName('command')
						.setDescription('Lệnh từ web')
						.setRequired(true),
				),
		),
	cooldown: 1,
	autocomplete: async (interaction) => {
		if (interaction.options.getSubcommand() === 'add') {
			/************************
			 * Autocomplete Item *
			 ************************/
			try {
				const focusedOption = interaction.options.getFocused(true);
				const filtered: {
					value: string;
					name: string;
				}[] = item.filter((choice) =>
					choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
				);
				const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
				await interaction.respond(options);
			} catch (error) {
				console.log(`Error in Autocomplete item: ${error.message}`);
			}
		} else if (interaction.options.getSubcommand() === 'clear') {
			/************************
			 * Autocomplete Item *
			 ************************/
			try {
				const focusedOption = interaction.options.getFocused(true);
				const filtered: {
					value: string;
					name: string;
				}[] = item.filter((choice) =>
					choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
				);
				const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
				await interaction.respond(options);
			} catch (error) {
				console.log(`Error in Autocomplete item: ${error.message}`);
			}
		}
	},
	execute: async (interaction: CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild)
			return interaction.reply('Không thể thực hiện ở DM');
		const ip = process.env.IP;
		const uuid: string = new Date().getTime().toString();
		if (interaction.options.getSubcommand() === 'add') {
			/***************
			 * GM item add *
			 ***************/
			/* Lấy input từ bot */
			const id: string = interaction.options.getString('id', true);
			const uid: string = interaction.options.getString('uid', true);
			const amount: number = interaction.options.getNumber('amount') ?? 1;
			if (!interaction.guild)
				return interaction.reply('Không thể thực hiện ở DM');
			const itemId =
				item.find((e) => e.value === id) ?? item.find((e) => e.value === id);
			if (!itemId)
				return await interaction.reply({
					content: `Không tìm thấy item ${id} trong database. Vui lòng kiểm tra lại.`,
					ephemeral: true,
				});
			try {
				await fetch(
					`http://${ip}:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1116&uid=${uid}&msg=item%20add%20${itemId.value}%20${amount}`,
				);
				await interaction.reply({
					content: `Đã thêm item ${itemId.name} cho người chơi UID ${uid}`,
					ephemeral: true,
				});
			} catch (error) {
				console.log(`Error in GM item: ${error.message}\nIP: ${ip}`);
			}
		} else if (interaction.options.getSubcommand() === 'clear') {
			/******************
			 * GM item clear *
			 ******************/
			/* Lấy input từ bot */
			const id: string = interaction.options.getString('id', true);
			const uid: string = interaction.options.getString('uid', true);
			const amount: number = interaction.options.getNumber('amount') ?? 1;
			if (!interaction.guild)
				return interaction.reply('Không thể thực hiện ở DM');
			const itemId =
				item.find((e) => e.value === id) ?? item.find((e) => e.value === id);
			if (!itemId)
				return await interaction.reply({
					content: `Không tìm thấy item ${id} trong database. Vui lòng kiểm tra lại.`,
					ephemeral: true,
				});
			try {
				await fetch(
					`http://${ip}:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1116&uid=${uid}&msg=item%20clear%20${itemId.value}%20${amount}`,
				);
				await interaction.reply({
					content: `Đã xóa item ${itemId.name} khỏi người chơi UID ${uid}`,
					ephemeral: true,
				});
			} catch (error) {
				console.log(`Error in GM item: ${error.message}\nIP: ${ip}`);
			}
		} else if (interaction.options.getSubcommand() === 'all') {
			/******************
			 * GM item all *
			 ******************/
			/* Lấy input từ bot */
			const uid = interaction.options.getString('uid', true);
			if (!interaction.guild)
				return interaction.reply('Không thể thực hiện ở DM');
			try {
				await fetch(
					`http://${ip}:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1116&uid=${uid}&msg=item%20add%20all`,
				);
				await interaction.reply({
					content: `Đã thêm tất cả item cho người chơi UID ${uid}`,
					ephemeral: true,
				});
			} catch (error) {
				console.log(`Error in GM item: ${error.message}\nIP: ${ip}\nCommand: `);
			}
		} else if (interaction.options.getSubcommand() === 'artifact') {
			/******************
			 * GM item all *
			 ******************/
			/* Lấy input từ bot */
			const uid = interaction.options.getString('uid', true);
			const command = interaction.options.getString('command', true);
			const params = command.split(' ').slice(1);
			const item = {
				itemId: params[0],
				level: parseInt(params[1].replace('lv', '')),
				quantity: parseInt(params[2].replace('x', '')),
				mainStat: params[3],
				subStat: extractSubstats(params.slice(4).join(' ')) || null,
			};

			if (!interaction.guild)
				return interaction.reply('Không thể thực hiện ở DM');
			try {
				const res = await fetch(
					`http://${ip}:14861/api?uid=${uid}&item_id=${
						item.itemId
					}&cmd=1127&item_count=${item.quantity}&extra_params={"level":%20${
						item.level + 1
					},"exp":%200,"main_prop_id":%20${
						item.mainStat
					},"append_prop_id_list":[${
						item.subStat
					}]}&region=dev_gio&ticket=GM@${uuid}&sign=${uuid}`,
				);
				const response = await res.json();
				if (response.msg === 'succ') {
					await interaction.reply({
						content: `Thêm thành công Thánh Dị Vật ${item.itemId} cho người chơi UID ${uid}`,
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content: `Có lỗi xảy ra.\nResponse ${JSON.stringify(response)}`,
						ephemeral: true,
					});
				}
			} catch (error) {
				console.log(`Error in GM item: ${error.message}\nIP: ${ip}`);
			}
		}
		/*http://192.168.1.200:20011/api?uid=100000000&item_id=27514&cmd=1127&item_count=1&extra_params={"level":%2021,"exp":%200,"main_prop_id":%2015012,"append_prop_id_list":[501064,501234,501204,501204,501204,501204,501204,501224,501224]}&region=dev_gio_34&ticket=ticket@1696673176995&sign=sign*/
	},
};

export default command;

import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	CommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder
} from 'discord.js'
import util from 'util'
import { SlashCommand } from '../types'

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
			await run(type, interaction)
		} else if (type === 'layline') {
			await run(type, interaction)
		} else if (type === 'check') {
			await run(type, interaction)
		}
	},
};

async function run(type: string, interaction: CommandInteraction) {
	const exec = util.promisify(require('child_process').execFile)
	await exec(`./${type}.sh`, { cwd: './tool' }, async (error: any, stdout: any, stderr: any) => {
		if (error) {
			await interaction.reply(`exec error: ${error}`)
			return
		}
		await interaction.reply(stdout)
	})
}

export default command;

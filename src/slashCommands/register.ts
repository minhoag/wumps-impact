import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	CommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
} from 'discord.js';
import {SlashCommand} from '../types';
import { checkDatabase, generateOTP, sendOTP } from '../function'
import moment from 'moment';
import prismaSqlite from '../prisma/prisma-sqlite';

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register your game account with Discord Server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) =>
			option
				.setName('uid')
				.setDescription('Your account uid.')
				.setRequired(true),
		),
	cooldown: 1,
	execute: async (interaction: CommandInteraction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!interaction.guild)
			return interaction.reply('Không thể thực hiện ở DM');
		const res = await checkDatabase(interaction.user.id);
		if (res) return interaction.reply('You have already registered');
		const uid: string = interaction.options.getString('uid', true);
		const ip: string | undefined = process.env.IP;
		// Create Modal
		const modal: ModalBuilder = new ModalBuilder()
			.setCustomId('registerForm')
			.setTitle('Register your Account');
		const regOTP: TextInputBuilder = new TextInputBuilder()
			.setCustomId('registerOTP')
			.setLabel('Verify OTP')
			.setPlaceholder('Check your in-game mail for the OTP.')
			.setMaxLength(10)
			.setMinLength(4)
			.setRequired(true)
			.setStyle(TextInputStyle.Short);
		const firstActionRow = new ActionRowBuilder().addComponents(regOTP);

		// Add inputs to the modal
		modal.addComponents(
			firstActionRow as ActionRowBuilder<TextInputBuilder>,
		);
		// Show the modal to the user
		await interaction.showModal(modal);
		const otp: string = generateOTP();
		await sendOTP(uid, otp);

		const filter = (interaction: any) => interaction.customId === 'registerForm';
		interaction.awaitModalSubmit({ filter, time: 90_000 })
			.then(async (interaction) => {
				await interaction.deferReply()
				const inputOtp: string = interaction.fields.getTextInputValue('registerOTP');
				if (inputOtp == otp) {
					const briefData = await fetch(`http://${ip}:14861/api?cmd=5003&region=dev_gio&ticket=GM&uid=${uid}`).then(res => res.json());
					const mora = briefData.data.scoin;
					const lastUpdate: number = moment().unix();
					await prismaSqlite.userData.create({
						data: {
							user: interaction.user.id,
							uid: uid,
							mora: mora,
							lastUpdate: lastUpdate,
						},
					});
					await interaction.editReply('Successfully registered');
				} else {
					await interaction.editReply('Registered Failed. You have entered the wrong OTP. Re-use command and try again.');
				}
			})
			.catch(console.error);
	},
};
export default command;

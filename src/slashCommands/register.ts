import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	CommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, Events,
} from 'discord.js';
import {SlashCommand} from '../types';
import {checkDatabase, generateOTP} from '../function';
import moment from 'moment';
import client from '../index';
import prismaSqlite from '../prisma/prisma-sqlite';

const command: SlashCommand = {
	command: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register your ingame account with Discord Server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) =>
			option
				.setName('uid')
				.setDescription('UID của người chơi')
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
			.setPlaceholder('Input your OTP')
			.setStyle(TextInputStyle.Short);
		const firstActionRow = new ActionRowBuilder().addComponents(regOTP);

		// Add inputs to the modal
		modal.addComponents(
			firstActionRow as ActionRowBuilder<TextInputBuilder>,
		);
		const otp: string = await generateOTP(uid);
		// Show the modal to the user
		await interaction.showModal(modal);

		// Process modal
		client.on(Events.InteractionCreate, async interaction => {
			if (!interaction.isModalSubmit()) return;
			// Get the data entered by the user
			if (interaction.customId === 'registerForm') {
				const inputOtp: string = interaction.fields.getTextInputValue('registerOTP');
				if (otp !== inputOtp) {
					await interaction.reply('Registered Failed. Reason: Wrong OTP.');
					return;
				} else {
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
					await interaction.reply('Successfully registered');
					return;
				}
			}
		});
	},
};

export default command;

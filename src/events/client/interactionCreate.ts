import { MessageFlags } from "discord.js";
import rawConfig from "../../config/config.json";
import { canUseSlashCommand } from "../../core/permission";
import type { BotEvent } from "../../types/bot";

const config = rawConfig as { crossmark_emoji?: string };

const event: BotEvent = {
	name: "interactionCreate",
	once: false,
	async execute(client, interaction) {
		if (!interaction.isChatInputCommand()) return;
		const command = client.slash.get(interaction.commandName);
		if (!command) return;
		if (!canUseSlashCommand(command, interaction.user.id)) {
			await interaction.reply({
				content: "You are not allowed to use this command.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		await command.run(client, interaction, interaction.options);
	},
};

export = event;

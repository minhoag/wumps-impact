import { SlashCommandBuilder } from "discord.js";
import { AdminPanel } from "../../admin/panel";

module.exports = {
	public: false,
	data: new SlashCommandBuilder()
		.setName("admin")
		.setDescription("Admin controller")
		.addSubcommand((subcommand) =>
			subcommand.setName("controller").setDescription("Show admin controller"),
		),
	run: async (client, interaction) => {
		void client;
		if (interaction.options.getSubcommand() === "controller") {
			await interaction.reply(AdminPanel());
		}
	},
};

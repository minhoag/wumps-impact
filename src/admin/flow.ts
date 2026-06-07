import type { ButtonInteraction } from "discord.js";
import type { BotClient } from "../types/bot";
import {
	AdminPanel,
	CancelSchedulePanel,
	CreateSchedulePanel,
	SchedulePanel,
} from "./panel";

export async function AdminInteraction(
	client: BotClient,
	interaction: ButtonInteraction,
) {
	void client;
	switch (interaction.customId) {
		case "admin:controller:refresh": {
			if (interaction.replied || interaction.deferred) return;
			await interaction.update(AdminPanel());
			return;
		}
		case "admin:schedule": {
			if (interaction.replied || interaction.deferred) return;
			await interaction.reply(SchedulePanel());
			return;
		}
		case "admin:schedule:back": {
			if (interaction.replied || interaction.deferred) return;
			await interaction.update(AdminPanel());
			return;
		}
		case "admin:schedule:create": {
			if (interaction.replied || interaction.deferred) return;
			await interaction.update(CreateSchedulePanel());
			return;
		}
		case "admin:schedule:create:back": {
			if (interaction.replied || interaction.deferred) return;
			await interaction.update(SchedulePanel());
			return;
		}
		case "admin:schedule:create:cancel": {
			if (interaction.replied || interaction.deferred) return;
			await interaction.update(CancelSchedulePanel());
			return;
		}
		default: {
			if (interaction.replied || interaction.deferred) return;
			await interaction.update({
				content: "Unknown admin interaction.",
			});
		}
	}
}

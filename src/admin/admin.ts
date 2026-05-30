import {
	type ButtonInteraction,
	MessageFlags,
	type StringSelectMenuInteraction,
} from "discord.js";
import type { BotClient } from "../types/bot";
import {
	buildAdminPanelPayload,
	buildCreateSchedulePanelPayload,
	buildScheduleCancelledPayload,
	buildSchedulePanelPayload,
} from "./panel";

type AdminComponentInteraction =
	| ButtonInteraction
	| StringSelectMenuInteraction;

async function AdminReply(
	interaction: AdminComponentInteraction,
	content: string,
) {
	if (interaction.replied || interaction.deferred) return;
	await interaction.reply({
		content,
		flags: MessageFlags.Ephemeral,
	});
}

async function AdminFollowup(
	interaction: AdminComponentInteraction,
	content: string,
) {
	if (interaction.replied || interaction.deferred) {
		await interaction.followUp({
			content,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await AdminReply(interaction, content);
}

export async function AdminInteraction(
	client: BotClient,
	interaction: AdminComponentInteraction,
) {
	void client;
	switch (interaction.customId) {
		case "admin:controller:refresh": {
			await interaction.update(buildAdminPanelPayload());
			return;
		}
		case "admin:schedule": {
			await interaction.reply(buildSchedulePanelPayload());
			return;
		}
		case "admin:schedule:back": {
			await interaction.update(buildAdminPanelPayload());
			return;
		}
		case "admin:schedule:create": {
			await interaction.update(buildCreateSchedulePanelPayload());
			return;
		}
		case "admin:schedule:create:back": {
			await interaction.update(buildSchedulePanelPayload());
			return;
		}
		case "admin:schedule:create:cancel": {
			await interaction.update(buildScheduleCancelledPayload());
			return;
		}
		case "admin:schedule:create:dates": {
			await AdminFollowup(
				interaction,
				"Duration parameter is not implemented yet.",
			);
			return;
		}
		case "admin:schedule:create:primary": {
			await AdminFollowup(
				interaction,
				"Character 1 parameter is not implemented yet.",
			);
			return;
		}
		case "admin:schedule:create:secondary": {
			await AdminFollowup(
				interaction,
				"Character 2 parameter is not implemented yet.",
			);
			return;
		}
		case "admin:schedule:create:review": {
			await AdminFollowup(
				interaction,
				"Schedule review is not implemented yet.",
			);
			return;
		}
		case "admin:schedule:edit": {
			await AdminReply(interaction, "Edit schedule is not implemented yet.");
			return;
		}
		case "admin:schedule:delete": {
			await AdminReply(interaction, "Delete schedule is not implemented yet.");
			return;
		}
		default: {
			await AdminReply(interaction, "Unknown admin interaction.");
		}
	}
}

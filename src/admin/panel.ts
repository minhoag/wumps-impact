import { ButtonStyle, MessageFlags } from "discord.js";
import { Button, ButtonRow, Container, Separator, Text } from "../components";
import config from "../config/config.json";

const accentColor = parseInt(
	String(config.color || "000000").replace("#", ""),
	16,
);

export function buildAdminPanelPayload() {
	const container = Container("# Wumps Admin Controller", accentColor)
		.addTextDisplayComponents(Text("## Active Banner"))
		.addTextDisplayComponents(
			Text(
				[
					"Primary: Not loaded yet",
					"Secondary: Not loaded yet",
					"Weapon: Not loaded yet",
					"Ends: Not loaded yet",
				].join("\n"),
			),
		)
		.addTextDisplayComponents(
			Text(
				"Active banner lookup will be connected from schedule utilities later.",
			),
		)
		.addSeparatorComponents(Separator())
		.addTextDisplayComponents(Text("## Actions"))
		.addTextDisplayComponents(
			Text("Open schedule workflows or refresh this panel."),
		);

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [
			container,
			ButtonRow(
				Button("admin:schedule", "Schedule", ButtonStyle.Primary),
				Button("admin:controller:refresh", "Refresh", ButtonStyle.Secondary),
			),
		],
	};
}

export function buildSchedulePanelPayload() {
	const container = Container(
		"# Schedule Management",
		accentColor,
	).addTextDisplayComponents(Text("Choose a schedule action."));

	const editButton = Button(
		"admin:schedule:edit",
		"Edit (not yet)",
		ButtonStyle.Secondary,
	);
	editButton.setDisabled(true);

	const deleteButton = Button(
		"admin:schedule:delete",
		"Delete (not yet)",
		ButtonStyle.Danger,
	);
	deleteButton.setDisabled(true);

	return {
		flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		components: [
			container,
			ButtonRow(
				Button("admin:schedule:create", "Create", ButtonStyle.Primary),
				editButton,
				deleteButton,
			),
			ButtonRow(Button("admin:schedule:back", "Back", ButtonStyle.Secondary)),
		],
	};
}

export function buildCreateSchedulePanelPayload() {
	const container = Container("# Create Gacha Schedule", accentColor)
		.addTextDisplayComponents(
			Text(
				[
					"Character 1: Not set",
					"Character 2: Not set",
					"Duration: Not set",
					"Weapon: Auto from character signature mapping",
				].join("\n"),
			),
		)
		.addSeparatorComponents(Separator())
		.addTextDisplayComponents(Text("Set parameters, then review."));

	return {
		flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		components: [
			container,
			ButtonRow(
				Button(
					"admin:schedule:create:primary",
					"Set Primary",
					ButtonStyle.Secondary,
				),
				Button(
					"admin:schedule:create:secondary",
					"Set Secondary",
					ButtonStyle.Secondary,
				),
				Button(
					"admin:schedule:create:dates",
					"Set Dates",
					ButtonStyle.Secondary,
				),
			),
			ButtonRow(
				Button("admin:schedule:create:review", "Review", ButtonStyle.Primary),
			),
			ButtonRow(
				Button("admin:schedule:create:back", "Back", ButtonStyle.Secondary),
				Button("admin:schedule:create:cancel", "Cancel", ButtonStyle.Danger),
			),
		],
	};
}

export function buildScheduleCancelledPayload() {
	const container = Container(
		"# Create Gacha Schedule",
		accentColor,
	).addTextDisplayComponents(Text("Schedule creation cancelled."));

	return {
		flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		components: [
			container,
			ButtonRow(
				Button(
					"admin:schedule:create:back",
					"Back to Schedule",
					ButtonStyle.Secondary,
				),
			),
		],
	};
}

import { ButtonStyle, MessageFlags } from "discord.js";
import { ButtonSection, Container, Separator, Text } from "../components";

export function AdminPanel() {
	const container = Container("# Bảng điều khiển")
		.addTextDisplayComponents(Text("### Banner đang hoạt động"))
		.addTextDisplayComponents(
			Text(
				[
					"Nhân vật 1: Not loaded yet",
					"Nhân vật 2: Not loaded yet",
					"Vũ khí: Not loaded yet",
				].join("\n"),
			),
		)
		.addSeparatorComponents(Separator())
		.addTextDisplayComponents(Text("### Sự kiện"))
		.addTextDisplayComponents(
			Text("Open schedule workflows or refresh this panel."),
		)
		.addSectionComponents(
			ButtonSection("Open schedule workflows.", {
				label: "Schedule",
				customId: "admin:schedule",
				style: ButtonStyle.Primary,
			}),
			ButtonSection("Refresh this panel.", {
				label: "Refresh",
				customId: "admin:controller:refresh",
				style: ButtonStyle.Secondary,
			}),
		);

	return {
		flags: MessageFlags.IsComponentsV2 as const,
		components: [container],
	};
}

export function SchedulePanel() {
	const container = Container("# Schedule Management")
		.addTextDisplayComponents(Text("Choose a schedule action."))
		.addSectionComponents(
			ButtonSection("Create a new schedule.", {
				label: "Create",
				customId: "admin:schedule:create",
				style: ButtonStyle.Primary,
			}),
			ButtonSection("Edit is not yet available.", {
				label: "Edit (not yet)",
				customId: "admin:schedule:edit",
				style: ButtonStyle.Secondary,
				disabled: true,
			}),
			ButtonSection("Delete is not yet available.", {
				label: "Delete (not yet)",
				customId: "admin:schedule:delete",
				style: ButtonStyle.Danger,
				disabled: true,
			}),
			ButtonSection("Return to the admin panel.", {
				label: "Back",
				customId: "admin:schedule:back",
				style: ButtonStyle.Secondary,
			}),
		);
	return {
		flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		components: [container],
	};
}

export function CreateSchedulePanel() {
	const container = Container("# Create Gacha Schedule")
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
		.addTextDisplayComponents(Text("Set parameters, then review."))
		.addSectionComponents(
			ButtonSection("Set the primary character.", {
				label: "Set Primary",
				customId: "admin:schedule:create:primary",
				style: ButtonStyle.Secondary,
			}),
			ButtonSection("Set the secondary character.", {
				label: "Set Secondary",
				customId: "admin:schedule:create:secondary",
				style: ButtonStyle.Secondary,
			}),
			ButtonSection("Set the schedule dates.", {
				label: "Set Dates",
				customId: "admin:schedule:create:dates",
				style: ButtonStyle.Secondary,
			}),
			ButtonSection("Review the schedule before saving.", {
				label: "Review",
				customId: "admin:schedule:create:review",
				style: ButtonStyle.Primary,
			}),
			ButtonSection("Go back to schedule actions.", {
				label: "Back",
				customId: "admin:schedule:create:back",
				style: ButtonStyle.Secondary,
			}),
			ButtonSection("Cancel schedule creation.", {
				label: "Cancel",
				customId: "admin:schedule:create:cancel",
				style: ButtonStyle.Danger,
			}),
		);

	return {
		flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		components: [container],
	};
}

export function CancelSchedulePanel() {
	const container = Container("Create Gacha Schedule")
		.addTextDisplayComponents(Text("Schedule creation cancelled."))
		.addSectionComponents(
			ButtonSection("Return to the schedule panel.", {
				label: "Back to Schedule",
				customId: "admin:schedule:create:back",
				style: ButtonStyle.Secondary,
			}),
		);

	return {
		flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
		components: [container],
	};
}

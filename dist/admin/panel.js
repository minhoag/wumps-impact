Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPanel = AdminPanel;
exports.SchedulePanel = SchedulePanel;
exports.CreateSchedulePanel = CreateSchedulePanel;
exports.CancelSchedulePanel = CancelSchedulePanel;
const discord_js_1 = require("discord.js");
const components_1 = require("../components");
function AdminPanel() {
	const container = components_1
		.Container("# Bảng điều khiển")
		.addTextDisplayComponents(components_1.Text("### Banner đang hoạt động"))
		.addTextDisplayComponents(
			components_1.Text(
				[
					"Nhân vật 1: Not loaded yet",
					"Nhân vật 2: Not loaded yet",
					"Vũ khí: Not loaded yet",
				].join("\n"),
			),
		)
		.addSeparatorComponents(components_1.Separator())
		.addTextDisplayComponents(components_1.Text("### Sự kiện"))
		.addTextDisplayComponents(
			components_1.Text("Open schedule workflows or refresh this panel."),
		);
	return {
		flags: discord_js_1.MessageFlags.IsComponentsV2,
		components: [
			container,
			components_1.ButtonRow(
				components_1.Button(
					"admin:schedule",
					"Schedule",
					discord_js_1.ButtonStyle.Primary,
				),
				components_1.Button(
					"admin:controller:refresh",
					"Refresh",
					discord_js_1.ButtonStyle.Secondary,
				),
			),
		],
	};
}

// Schedule panel
function SchedulePanel() {
	const container = components_1
		.Container("# Schedule Management")
		.addTextDisplayComponents(components_1.Text("Choose a schedule action."));
	const editButton = components_1.Button(
		"admin:schedule:edit",
		"Edit (not yet)",
		discord_js_1.ButtonStyle.Secondary,
	);
	editButton.setDisabled(true);
	const deleteButton = components_1.Button(
		"admin:schedule:delete",
		"Delete (not yet)",
		discord_js_1.ButtonStyle.Danger,
	);
	deleteButton.setDisabled(true);
	return {
		flags:
			discord_js_1.MessageFlags.Ephemeral |
			discord_js_1.MessageFlags.IsComponentsV2,
		components: [
			container,
			components_1.ButtonRow(
				components_1.Button(
					"admin:schedule:create",
					"Create",
					discord_js_1.ButtonStyle.Primary,
				),
				editButton,
				deleteButton,
			),
			components_1.ButtonRow(
				components_1.Button(
					"admin:schedule:back",
					"Back",
					discord_js_1.ButtonStyle.Secondary,
				),
			),
		],
	};
}
function CreateSchedulePanel() {
	const container = components_1
		.Container("# Create Gacha Schedule")
		.addTextDisplayComponents(
			components_1.Text(
				[
					"Character 1: Not set",
					"Character 2: Not set",
					"Duration: Not set",
					"Weapon: Auto from character signature mapping",
				].join("\n"),
			),
		)
		.addSeparatorComponents(components_1.Separator())
		.addTextDisplayComponents(
			components_1.Text("Set parameters, then review."),
		);
	return {
		flags:
			discord_js_1.MessageFlags.Ephemeral |
			discord_js_1.MessageFlags.IsComponentsV2,
		components: [
			container,
			components_1.ButtonRow(
				components_1.Button(
					"admin:schedule:create:primary",
					"Set Primary",
					discord_js_1.ButtonStyle.Secondary,
				),
				components_1.Button(
					"admin:schedule:create:secondary",
					"Set Secondary",
					discord_js_1.ButtonStyle.Secondary,
				),
				components_1.Button(
					"admin:schedule:create:dates",
					"Set Dates",
					discord_js_1.ButtonStyle.Secondary,
				),
			),
			components_1.ButtonRow(
				components_1.Button(
					"admin:schedule:create:review",
					"Review",
					discord_js_1.ButtonStyle.Primary,
				),
			),
			components_1.ButtonRow(
				components_1.Button(
					"admin:schedule:create:back",
					"Back",
					discord_js_1.ButtonStyle.Secondary,
				),
				components_1.Button(
					"admin:schedule:create:cancel",
					"Cancel",
					discord_js_1.ButtonStyle.Danger,
				),
			),
		],
	};
}
function CancelSchedulePanel() {
	const container = components_1
		.Container("Create Gacha Schedule")
		.addTextDisplayComponents(
			components_1.Text("Schedule creation cancelled."),
		);
	return {
		flags:
			discord_js_1.MessageFlags.Ephemeral |
			discord_js_1.MessageFlags.IsComponentsV2,
		components: [
			container,
			components_1.ButtonRow(
				components_1.Button(
					"admin:schedule:create:back",
					"Back to Schedule",
					discord_js_1.ButtonStyle.Secondary,
				),
			),
		],
	};
}

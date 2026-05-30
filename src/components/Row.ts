import {
	ActionRowBuilder,
	type ButtonBuilder,
	type StringSelectMenuBuilder,
} from "discord.js";

export function ButtonRow(
	...buttons: ButtonBuilder[]
): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
}

export function SelectRow(
	select: StringSelectMenuBuilder,
): ActionRowBuilder<StringSelectMenuBuilder> {
	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

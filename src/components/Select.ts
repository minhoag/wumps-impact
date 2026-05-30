import { StringSelectMenuBuilder } from "discord.js";

export type StringSelectOption = {
	label: string;
	value: string;
	description?: string;
};

export function StringSelect(
	customId: string,
	placeholder: string,
	options: readonly StringSelectOption[],
): StringSelectMenuBuilder {
	return new StringSelectMenuBuilder()
		.setCustomId(customId)
		.setPlaceholder(placeholder)
		.addOptions(
			...options.map((option) => ({
				label: option.label,
				value: option.value,
				description: option.description,
			})),
		);
}

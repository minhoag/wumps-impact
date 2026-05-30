import { ContainerBuilder } from "discord.js";
import { Separator } from "./Separator";
import { Text } from "./Text";

export function Container(title: string, accentColor): ContainerBuilder {
	return new ContainerBuilder()
		.setAccentColor(accentColor)
		.addTextDisplayComponents(Text(title))
		.addSeparatorComponents(Separator());
}

import { ContainerBuilder } from "discord.js";
import { Separator } from "./Separator";
import { Text } from "./Text";

export function Container(title: string): ContainerBuilder {
	return new ContainerBuilder()
		.addTextDisplayComponents(Text(title))
		.addSeparatorComponents(Separator());
}

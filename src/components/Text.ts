import { TextDisplayBuilder } from "discord.js";

export function Text(content: string): TextDisplayBuilder {
	return new TextDisplayBuilder().setContent(content);
}

import { SeparatorBuilder, SeparatorSpacingSize } from "discord.js";

export function Separator(
	spacing: SeparatorSpacingSize = SeparatorSpacingSize.Small,
): SeparatorBuilder {
	return new SeparatorBuilder().setDivider(true).setSpacing(spacing);
}

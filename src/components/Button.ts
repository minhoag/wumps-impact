import { ButtonBuilder, ButtonStyle } from 'discord.js';

export function Button(
  customId: string,
  label: string,
  style: ButtonStyle = ButtonStyle.Primary
): ButtonBuilder {
  return new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
}

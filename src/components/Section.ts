import {
  ButtonBuilder,
  ButtonStyle,
  SectionBuilder,
  TextDisplayBuilder,
} from "discord.js";

type LinkButtonConfig = {
  label: string;
  url: string;
  disabled?: boolean;
};

type CustomButtonConfig = {
  label: string;
  customId: string;
  style?: ButtonStyle;
  disabled?: boolean;
};

export type ButtonSectionConfig = LinkButtonConfig | CustomButtonConfig;

export function ButtonSection(content: string, button: ButtonSectionConfig) {
  const buttonBuilder = new ButtonBuilder().setLabel(button.label);

  if ("url" in button) {
    buttonBuilder.setURL(button.url).setStyle(ButtonStyle.Link);
  } else {
    buttonBuilder
      .setCustomId(button.customId)
      .setStyle(button.style ?? ButtonStyle.Primary);
  }

  buttonBuilder.setDisabled(button.disabled ?? false);

  return new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
    .setButtonAccessory(buttonBuilder);
}

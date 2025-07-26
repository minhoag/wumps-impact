import type { CommandInteraction } from 'discord.js';
import { DiscordResponse } from './utils/discord-utils';
import { EmbedType, ResponseType } from './type';
import { ERROR_MESSAGE } from './constant/response';

export class DiscordException extends Error {
  public readonly code?: number;
  public readonly interaction?: CommandInteraction;

  constructor(
    message: string,
    code?: number,
    interaction?: CommandInteraction,
  ) {
    super(message);
    this.name = 'DiscordException';
    this.code = code;
    this.interaction = interaction;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DiscordException);
    }
  }

  public async sendError(code: number, interaction: CommandInteraction): Promise<void> {
    const locale = interaction.locale;
    const embed = DiscordResponse.createEmbed({
      title: ERROR_MESSAGE[code as keyof typeof ERROR_MESSAGE][locale],
      description: this.message,
      type: EmbedType.ERROR,
      fields: [],
      image: null,
    });
    await DiscordResponse.sendResponse({
      interaction,
      types: [ResponseType.EMBED, ResponseType.EPHEMERAL],
      embed
    });
  }
}

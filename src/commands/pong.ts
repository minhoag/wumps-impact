import { DiscordResponse } from '@/utils/discord-utils';
import { SlashCommandBuilder, Locale, CommandInteraction } from 'discord.js';
import { ResponseType, type Command } from '@/type';

const Ping: Command = {
  command: new SlashCommandBuilder()
    .setName('pong')
    .setDescription('Pong the bot')
    .setDescriptionLocalizations({ [Locale.Vietnamese]: 'Pong bot' }),
  cooldown: 1,
  execute: async (interaction: CommandInteraction) => {
    const latency = Date.now() - interaction.createdTimestamp;
    await DiscordResponse.sendResponse({
      interaction,
      types: [ResponseType.STRING],
      content: `Pong! ${latency}ms`,
    });
  },
};

export default Ping;

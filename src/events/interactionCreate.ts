import type { Interaction } from 'discord.js';
import type { Event } from '@/type';
import { DiscordEvent } from '@/utils/discord-utils';

const InteractionCreateEvent: Event = {
  name: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
      await DiscordEvent.handleChatInput(interaction);
    } else if (interaction.isAutocomplete()) {
      await DiscordEvent.handleAutocomplete(interaction);
    }
  },
};

export default InteractionCreateEvent;

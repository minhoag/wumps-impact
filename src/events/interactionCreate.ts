import { type Interaction } from 'discord.js';
import type { Event } from '@/type';
import { DiscordEvent } from '@/utils/discord-utils';
import { checkWhiteList } from '@/utils/utils';

const InteractionCreateEvent: Event = {
  name: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction) => {
    //--- Guard server whitelist ----
    const isWhitelisted = await checkWhiteList(interaction.guildId as string);
    if (!isWhitelisted) return;
    //--- Guard Permission ----

    //--- Handle interaction ----
    if (interaction.isChatInputCommand()) {
      await DiscordEvent.handleChatInput(interaction);
    } else if (interaction.isAutocomplete()) {
      await DiscordEvent.handleAutocomplete(interaction);
    } else if (interaction.isModalSubmit()) {
      await DiscordEvent.handleModalSubmit(interaction);
    } else if (interaction.isButton()) {
      await DiscordEvent.handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await DiscordEvent.handleSelectMenuInteraction(interaction);
    }
  },
};

export default InteractionCreateEvent;

import type { Interaction } from 'discord.js';
import type { Event } from '@/type';
import { DiscordEvent } from '@/utils/discord-utils';
import { checkWhiteList } from '@/utils/utils';

const InteractionCreateEvent: Event = {
  name: 'interactionCreate',
  once: false,
  execute: async (interaction: Interaction) => {
    try {
      //--- Guard server whitelist ----
      const isWhitelisted = await checkWhiteList(interaction.guildId as string);
      if (!isWhitelisted) return;
      
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
    } catch (error) {
      console.error('Error handling interaction:', error);
      
      // Try to respond with an error message if the interaction hasn't been responded to
      try {
        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while processing your request. Please try again.',
            ephemeral: true
          });
        } else if (interaction.isRepliable() && interaction.deferred && !interaction.replied) {
          await interaction.editReply({
            content: 'An error occurred while processing your request. Please try again.'
          });
        }
      } catch (responseError) {
        console.error('Failed to send error response:', responseError);
      }
    }
  },
};

export default InteractionCreateEvent;

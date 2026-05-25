import { MessageFlags } from 'discord.js';
import rawConfig from '../../config/config.json';
import type { BotEvent } from '../../types/bot';
import { canUseSlashCommand } from '../../core/permission';

const config = rawConfig as { crossmark_emoji?: string };

const event: BotEvent = {
  name: 'interactionCreate',
  once: false,
  async execute(client, rawInteraction) {
		const interaction = rawInteraction as import('discord.js').Interaction;
    if (!interaction.isChatInputCommand()) return;
    console.log(`[INTERACTION] /${interaction.commandName} from ${interaction.user.tag}`);
    const command = client.slash.get(interaction.commandName);
    if (!command) return;
    if (!canUseSlashCommand(command, interaction.user.id)) {
      await interaction.reply({
        content: 'You are not allowed to use this command.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    try {
      await command.run(client, interaction, interaction.options);
    } catch (error) {
      console.error(`[INTERACTION] Error in /${interaction.commandName}:`, error);
    }
  },
};

export = event;

import { ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from 'discord.js';
import config from '../../config/config.json';
import type { BotEvent } from '../../types/bot';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const event: BotEvent = {
  name: 'messageCreate',
  once: false,
  async execute(client, rawMessage) {
    const message = rawMessage as import('discord.js').Message;
    if (!message.content || message.author.bot) return;
    const prefix = config.prefix?.trim() ?? '';
    const botName = config.botName?.trim().toLowerCase() ?? '';
    const mentionRegex = client.user ? new RegExp(`^<@!?${escapeRegex(client.user.id)}>(?:\\s+|$)`) : null;
    let content = message.content.trim();
    let triggerMatched = false;
    if (prefix && content.startsWith(prefix)) { triggerMatched = true; content = content.slice(prefix.length).trim(); }
    if (!triggerMatched && botName) {
      const match = content.match(new RegExp(`^${escapeRegex(botName)}(?:\\s+|$)`, 'i'));
      if (match) { triggerMatched = true; content = content.slice(match[0].length).trim(); }
    }
    if (!triggerMatched && mentionRegex) {
      const match = content.match(mentionRegex);
      if (match) { triggerMatched = true; content = content.slice(match[0].length).trim(); }
    }
    if (!triggerMatched) return;
    const args = content.split(/\s+/).filter(Boolean);
    const input = args.shift()?.toLowerCase();
    if (!input) return;
    const resolvedName = client.commands.has(input) ? input : client.aliases.get(input);
    if (!resolvedName) return;
    const command = client.commands.get(resolvedName);
    if (!command) return;
    try {
      await command.run(client, message, args, prefix);
    } catch (error) {
      console.error(`[MESSAGE COMMAND ERROR] ${resolvedName}:`, error);
      const sep = new SeparatorBuilder();
      const container = new ContainerBuilder().setAccentColor(parseInt(String(config.color || '000000').replace('#', ''), 16)).addSeparatorComponents(sep).addTextDisplayComponents(new TextDisplayBuilder().setContent('⚠ **Command Error**\nAn unexpected error occurred while running that command.')).addSeparatorComponents(sep);
      await message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    }
  },
};

export = event;

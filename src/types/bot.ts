import type { ChatInputCommandInteraction, Client, Collection, Interaction, Message } from 'discord.js';

export interface SlashCommand {
  data: { name: string; toJSON: () => unknown };
  public: boolean;
  run: (client: BotClient, interaction: ChatInputCommandInteraction, options: ChatInputCommandInteraction['options']) => Promise<unknown> | unknown;
}

export interface MessageCommand {
  name: string;
  aliases?: string[];
  run: (client: BotClient, message: Message, args: string[], prefix: string) => Promise<unknown> | unknown;
}

export interface BotEvent {
  name: string;
  once?: boolean;
  execute: (client: BotClient, ...args: unknown[]) => Promise<unknown> | unknown;
}

export type BotClient = Client & {
  commands: Collection<string, MessageCommand>;
  events: Collection<string, BotEvent>;
  slash: Collection<string, SlashCommand>;
  aliases: Collection<string, string>;
};

export interface BotConfig {
  color: string;
  prefix: string;
  botName: string;
  crossmark_emoji?: string;
}

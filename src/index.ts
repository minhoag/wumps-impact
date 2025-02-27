import {
  Client,
  Collection,
  DiscordAPIError,
  GatewayIntentBits,
} from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

import type { Command, SlashCommand } from './types';

process.on('uncaughtException', (error: unknown) => {
  if (error instanceof Error) {
    console.log('Error', error.message);
  } else if (error instanceof DiscordAPIError) {
    console.error('Error at api code: ', error.code);
  }
});

process.on('unhandledRejection', (error: unknown) => {
  if (
    error instanceof Error &&
    error.message.includes('database server is running')
  ) {
    console.log('Database server is not running.');
  } else if (
    error instanceof Error &&
    error.message.includes('database server is running')
  ) {
    console.log('Error', error.message);
  } else if (error instanceof DiscordAPIError) {
    console.error('API', error);
  }
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.slashCommands = new Collection<string, SlashCommand>();
client.commands = new Collection<string, Command>();
client.cooldowns = new Collection<string, number>();
client.chats = new Collection<string, number>();

const handlersDir = join(__dirname, './handlers');
readdirSync(handlersDir).forEach((handler) => {
  require(`${handlersDir}/${handler}`)(client);
});

client
  .login(process.env['DiSCORD_TOKEN'])
  .catch(() => console.error('Invalid Token: ', process.env['DiSCORD_TOKEN']));

import dayjs from 'dayjs';
import {
  Client,
  Collection,
  DiscordAPIError,
  GatewayIntentBits,
} from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

import { Command, SlashCommand } from './types';

process.on('uncaughtException', (error: unknown) => {
  if (
    error instanceof Error &&
    error.message.includes("undefined (reading 'vi')")
  ) {
    const stackLines = error.stack?.split('\n');
    const relevantLine = stackLines?.find((line: string) =>
      line.includes('E:\\Downloads\\Project\\wumps\\src\\slash'),
    );
    console.log('Uncaught Exception: Translation not found');
    console.log(relevantLine);
  } else if (error instanceof DiscordAPIError) {
    if (error.code === 'ENOTFOUND') {
      console.log('No internet connection');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused');
    } else if (error.code === 10062) {
      console.log(
        'Unknown Interaction. Time stamp: ',
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
      );
    } else if (error.code === 10008) {
      console.log(
        'Message is deleted. Time stamp: ',
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
      );
    } else {
      console.log('Uncaught Exception: Discord API Error');
      console.log(error.message);
    }
  } else {
    console.error('Uncaught Exception: Unknown error: ', error);
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

client.login(process.env.DiSCORD_TOKEN).then(async () => {});

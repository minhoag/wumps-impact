import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

import { Command, SlashCommand } from './types';

process.on('uncaughtException', (error: any) => {
  const stackLines = error.stack.split('\n');
  if (error.message.includes("undefined (reading 'vi')")) {
    const relevantLine = stackLines.find((line: string) =>
      line.includes('E:\\Downloads\\Project\\wumps\\src\\slash'),
    );
    console.log('Uncaught Exception: Translation not found');
    console.log(relevantLine);
  } else if (error.code === 'ENOTFOUND') {
    console.log('No internet connection');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('Connection refused');
  } else {
    console.error('Unhandled Rejection:', error);
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

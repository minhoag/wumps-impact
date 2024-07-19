import {Client, Collection, GatewayIntentBits} from 'discord.js';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
import {Command, SlashCommand} from './types';
import {readdirSync} from 'fs';
import {join} from 'path';
import {config} from 'dotenv';

config();

client.slashCommands = new Collection<string, SlashCommand>();
client.commands = new Collection<string, Command>();
client.cooldowns = new Collection<string, number>();
client.chats = new Collection<string, number>();

const handlersDir = join(__dirname, './handlers');
readdirSync(handlersDir).forEach((handler) => {
	require(`${handlersDir}/${handler}`)(client);
});

// Prevent Rejection
process.on('unhandledRejection', error => {
	console.log('Unhandled promise rejection:', error);
});
process.on('uncaughtException', error => {
	console.log('Uncaught Exception:', error);
});
process.on('uncaughtExceptionMonitor', error => {
	console.log('Uncaught Exception Monitor:', error);
});

export default client;
client.login(process.env.TOKEN);

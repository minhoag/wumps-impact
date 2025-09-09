import { Client, GatewayIntentBits } from 'discord.js';
import Handlers from './src/handlers';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

async function initialize() {
  try {
    await Handlers(client);
    await client.login(process.env['DISCORD_TOKEN']);
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled promise rejection:', error);
    });
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
    });
  } catch (error) {
    console.error('Error initializing bot:', error);
  }
}

initialize();

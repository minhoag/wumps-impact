import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '/discord/.env' });
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
console.log(process.env['DISCORD_TOKEN']);
async function initialize() {
  try {
    console.log('Loading Discord bot...');
    await Handlers(client);
    console.log('Handlers loaded successfully!');

    await client.login(process.env['DISCORD_TOKEN']);
    console.log('Bot logged in successfully!');
  } catch (error) {
    console.error('Error initializing bot:', error);
  }
}

initialize();

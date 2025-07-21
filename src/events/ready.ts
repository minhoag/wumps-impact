import { Client } from 'discord.js';
import { type Event } from '@type';
import { PrismaClient } from '@prisma-discord';

const prisma = new PrismaClient();

const ReadyEvent: Event = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    console.log(`Logged in as ${client.user?.tag}`);
    try {
      const data = await (prisma as any).t_discord_gacha_data.findMany();
      client.gachaData = data;
      console.log(`Cached ${data.length} gacha banner records.`);
    } catch (err) {
      console.error('Failed to preload gacha data:', err);
      client.gachaData = [];
    }
  },
};

export default ReadyEvent;

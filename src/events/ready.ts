import { Client } from 'discord.js';
import { type Event } from '@type';
import { ConfigPrisma, DiscordPrisma } from '@/utils/prisma-utils';

const ReadyEvent: Event = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    console.log(`Logged in as ${client.user?.tag}`);
    try {
      // migrate data from server to discord bot
      const gacha_data = await DiscordPrisma.t_discord_gacha_data.findMany();
      const server = await ConfigPrisma.t_gacha_schedule_config.findMany();
      
      // Option 1: Sequential updates with error handling
      for (const data of server) {
        if (!data) continue;
        
        try {
          await DiscordPrisma.t_discord_gacha_schedule.update({
            where: { id: data.schedule_id },
            data: {
              type: data.gacha_type,
              beginTime: data.begin_time,
              endTime: data.end_time,
            },
          });
        } catch (error) {
          console.warn(`Failed to update schedule ${data.schedule_id}`);
        }
      }

      // Get updated data after all operations
      const gacha_schedule = await DiscordPrisma.t_discord_gacha_schedule.findMany();
      
      client.gacha_data = gacha_data;
      client.gacha_schedule = gacha_schedule;
      console.log(`Cached ${gacha_data.length} gacha banner records.`);
      console.log(`Cached ${gacha_schedule.length} gacha schedule records.`);
    } catch (err) {
      console.error('Failed to preload gacha data:', err);
      client.gacha_data = [];
      client.gacha_schedule = [];
    }
  },
};

export default ReadyEvent;
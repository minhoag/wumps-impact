import { Client } from 'discord.js';
import { type Event } from '@type';
import { ConfigPrisma, DiscordPrisma } from '@/utils/prisma-utils';

const ReadyEvent: Event = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    console.log(`Logged in as ${client.user?.tag}`);
    try {
      const data = await DiscordPrisma.t_discord_gacha_data.findMany();
      const scheduleData = await DiscordPrisma.t_discord_gacha_schedule.findMany();
      //--- Remove ended schedule ---
      const endedSchedule = scheduleData.filter((schedule) => schedule.endTime < new Date());
      const activeSchedule = scheduleData.filter((schedule) => schedule.endTime >= new Date());
      await DiscordPrisma.t_discord_gacha_schedule.deleteMany({
        where: { endTime: { lt: new Date() } },
      });
      //--- Cache data ---
      client.gacha_data = data;
      client.gacha_schedule = activeSchedule;
      console.log(`Cached ${data.length} gacha banner records.`);
      console.log(
        `Cached ${scheduleData.length} gacha schedule records. Deleted ${endedSchedule.length} ended schedules.`,
      );
    } catch (err) {
      console.error('Failed to preload gacha data:', err);
      client.gacha_data = [];
      client.gacha_schedule = [];
    }
  },
};

export default ReadyEvent;
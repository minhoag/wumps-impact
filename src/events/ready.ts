import { Client } from 'discord.js';
import { type Event } from '@type';
import { DiscordPrisma } from '@/utils/prisma-utils';

const ReadyEvent: Event = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    console.log(`Logged in as ${client.user?.tag}`);
    try {
      const data =
        await DiscordPrisma.t_discord_gacha_data.findMany();
      const scheduleData =
        await DiscordPrisma.t_discord_gacha_schedule.findMany();
      // remove ended schedule
      const endedSchedule = scheduleData.filter(
        (schedule) => schedule.endTime < new Date(),
      );
      await DiscordPrisma.t_discord_gacha_schedule.deleteMany({
        where: { endTime: { lt: new Date() } },
      });
      client.gachaData = data;
      client.gachaSchedule = endedSchedule;
      console.log(`Cached ${data.length} gacha banner records.`);
      console.log(
        `Cached ${scheduleData.length} gacha schedule records. Deleted ${endedSchedule.length} ended schedules.`,
      );
    } catch (err) {
      console.error('Failed to preload gacha data:', err);
      client.gachaData = [];
    }
  },
};

export default ReadyEvent;

import moment from 'moment';
import { CronJob } from 'cron';
import { getGachaScheduleConfig, getPlayerOnline } from '../function';
import { BotEvent } from '../types';
import { ActivityType, Client } from 'discord.js';
import prisma from '../prisma/prisma';

const event: BotEvent = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    console.table({
      users: client.user?.tag,
      online: await getPlayerOnline(),
    });
    const job = new CronJob(
      '* * 0 * * *', // cronTime
      async function () {
        try {
          const data = await getGachaScheduleConfig();
          if (!data) return;
          data.forEach(async (e: any) => {
            const compare = moment(e.end_time).isBefore(moment());
            if (e.enabled === 1 && compare) {
              await prisma.t_gacha_schedule_config.update({
                where: { schedule_id: e.schedule_id },
                data: { enabled: 0 },
              });
            }
          });
        } catch {}
      },
      null, // onComplete
      true, // start
      'Asia/Ho_Chi_Minh' // timeZone
    );
    setInterval(async () => {
      try {
        const onlinePlayer = await getPlayerOnline();
        const start = Date.now();
        await fetch('http://37.114.63.115:2888');
        const ping = Date.now() - start;
        if (onlinePlayer === 'down') {
          client.user?.setActivity(`Bảo trì.`, {
            type: ActivityType.Listening,
          });
        } else {
          client.user?.setActivity(
            ` với ${onlinePlayer} người. Ping ${Math.ceil(ping / 2)}ms`,
            {
              type: ActivityType.Playing,
            }
          );
        }
      } catch (error) {}
    }, 60_000);
  },
};

export default event;

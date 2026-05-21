import { ActivityType } from 'discord.js';
import type { BotEvent } from '../../types/bot';

const event: BotEvent = {
  name: 'clientReady',
  once: true,
  execute(client) {
    if (!client.user) return;
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setPresence({
      status: 'online',
      activities: [{ name: 'Make sure to leave a star ⭐ on the repo', type: ActivityType.Custom }],
    });
  },
};

export = event;

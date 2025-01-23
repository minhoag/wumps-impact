import { ActivityType } from 'discord.js';

import { Event } from '../types';

const event: Event = {
  name: 'ready',
  once: true,
  execute: async () => {
    console.log('Hello! World.');
  },
};

export default event;

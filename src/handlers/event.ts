import { Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

import { Event } from '../types';

module.exports = (client: Client) => {
  const eventsDir = join(__dirname, '../events');

  readdirSync(eventsDir).forEach((file) => {
    if (!file.endsWith('.ts')) return;
    const event: Event = require(`${eventsDir}/${file}`).default;
    event.once
      ? client.once(event.name, (...args) => event.execute(...args))
      : client.on(event.name, (...args) => event.execute(...args));
  });
};

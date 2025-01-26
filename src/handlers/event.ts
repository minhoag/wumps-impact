const { Client } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');

const { Event } = require('../types');

module.exports = (client: typeof Client) => {
  const eventsDir = join(__dirname, '../events');

  readdirSync(eventsDir).forEach((file: string) => {
    if (!file.endsWith('.ts')) return;
    const event: typeof Event = require(`${eventsDir}/${file}`).default;
    event.once
      ? client.once(event.name, (...args: any[]) => event.execute(...args))
      : client.on(event.name, (...args: any[]) => event.execute(...args));
  });
};

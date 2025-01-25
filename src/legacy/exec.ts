import type { Message, TextChannel } from 'discord.js';

import type { Command } from '../types';

const command: Command = {
  name: 'execute',
  permissions: ['Administrator'],
  aliases: ['exec'],
  cooldown: 10,
  execute: async (message: Message, args: string[]) => {
    if (!args)
      return (message.channel as TextChannel).send('Missing arguments');
    if (args.length < 1)
      return (message.channel as TextChannel).send('Missing arguments');
    const value: string = args[1];
    let res = await fetch(`http://wumpus.site:12000/${value}`).then(
      async (res) => await res.json(),
    );
    return (message.channel as TextChannel).send(
      'Execute complete. Response: ' + JSON.stringify(res),
    );
  },
};
export default command;

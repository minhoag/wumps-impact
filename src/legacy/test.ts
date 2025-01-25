import { PermissionFlagsBits } from 'discord.js';

import { Command } from '../types';

const command: Command = {
  name: 'test',
  permissions: ['Administrator'],
  aliases: ['ts'],
  cooldown: 10,
  execute: async () => {
    return 'Test command';
  },
};
export default command;

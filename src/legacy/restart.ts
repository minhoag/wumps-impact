import type { Command } from '../types';

const command: Command = {
  name: 'restart',
  permissions: ['Administrator'],
  aliases: ['rs'],
  cooldown: 10,
  execute: async () => {
    await fetch(
      'https://backend.control.luxvps.net/v1/service/f1bfab30-b687-4f33-bd7e-10e6520cb79f/restart?token=11f66be3-e95b-4795-8434-abfdb181fa3f',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );
  },
};
export default command;

import { PermissionFlagsBits } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  name: 'restart',
  permissions: ['Administrator'],
  aliases: ['rs'],
  cooldown: 10,
  execute: async (message) => {
	  const request: Response = await fetch('https://backend.control.luxvps.net/v1/service/f1bfab30-b687-4f33-bd7e-10e6520cb79f/restart?token=11f66be3-e95b-4795-8434-abfdb181fa3f', {
		  method: 'POST',
		  headers: {
			  accept: 'application/json',
			  'Content-Type': 'application/json'
		  }
	  });
	  const response: Response = await request.json();
	  if (!response.status) {
		  message.channel.send('Server restart complete.')
	  } else {
		  message.channel.send('An error has occured, code ' + response.status)
	  }
  },
};
export default command;

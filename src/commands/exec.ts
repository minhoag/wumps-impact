import { Message } from 'discord.js'
import { Command } from '../types';

const command: Command = {
	name: 'exec',
	permissions: ['Administrator'],
	aliases: ['exec'],
	cooldown: 10,
	execute: async (message: Message<boolean>, args: string[]) => {
		if (args.length < 1) return message.channel.send('Missing argruments');
		const value: string = args[0];
		let res = await fetch(`http://wumpus.site:12000/${value}`, {
			method: 'GET',
			headers:{
				accept: 'application/json',
			}
		})
			.then(async res => await res.json())
			.catch((err: Error) => {
				if (err.message == 'fetch failed') {
					return 'restart complete'
				} else if (err.message == 'Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON') {
					return 'execute complete'
				}
			});
		return message.channel.send('Execute complete. Response: ' + res);
	},
};
export default command;

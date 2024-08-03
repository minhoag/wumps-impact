import { Message } from 'discord.js'
import { Command } from '../types';

const command: Command = {
	name: 'exec',
	permissions: ['Administrator'],
	aliases: ['exec'],
	cooldown: 10,
	execute: async (message: Message<boolean>, args: string[]) => {
		if (args.length < 1) return message.channel.send('Missing argruments');
		const value: string = args[1];
		let res = await fetch(`http://wumpus.site:12000/${value}`)
			.then(async res => await res.json())
		return message.channel.send('Execute complete. Response: ' + JSON.stringify(res));
	},
};
export default command;

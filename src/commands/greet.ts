import { PermissionFlagsBits } from 'discord.js';
import { Command } from '../types';

const command: Command = {
  name: 'greet',
  permissions: ['Administrator', PermissionFlagsBits.ManageEmojisAndStickers],
  aliases: ['sayhello'],
  cooldown: 10,
  execute: (message, args) => {
    const toGreet = message.mentions.members?.first();
    message.channel.send(
      `Hello there ${
        toGreet ? toGreet.user.username : message.member?.user.username
      }!`
    );
  },
};
export default command;

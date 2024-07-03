import { ChannelType, Message } from 'discord.js';
import { checkPermissions, sendTimedMessage } from '../function';
import { BotEvent } from '../types';

const event: BotEvent = {
  name: 'messageCreate',
  execute: async (message: Message) => {
    if (!message.member || message.member.user.bot) return;
    if (!message.guild) return;
    let prefix: string = process.env.PREFIX ?? '!';
    if (!message.content.startsWith(prefix)) return;
    if (message.channel.type !== ChannelType.GuildText) return;

    const args = message.content.substring(prefix.length).split(' ');
    let command = message.client.commands.get(args[0]);

    if (!command) {
      const commandFromAlias = message.client.commands.find((command) =>
        command.aliases.includes(args[0])
      );
      if (commandFromAlias) command = commandFromAlias;
      else return;
    }

    const cooldown = message.client.cooldowns.get(
      `${command.name}-${message.member.user.username}`
    );
    const neededPermissions = checkPermissions(
      message.member,
      command.permissions
    );
    if (neededPermissions !== null)
      return sendTimedMessage(
        `
            Bạn không có quyền sử dụng Bot. 
            \n Quyền để được sử dụng: ${neededPermissions.join(', ')}
            `,
        message.channel,
        5000
      );

    if (command.cooldown && cooldown) {
      if (Date.now() < cooldown) {
        sendTimedMessage(
          `Bạn phải đợi ${Math.floor(
            Math.abs(Date.now() - cooldown) / 1000
          )} giây(s) để sự dụng lệnh này.`,
          message.channel,
          5000
        );
        return;
      }
      message.client.cooldowns.set(
        `${command.name}-${message.member.user.username}`,
        Date.now() + command.cooldown * 1000
      );
      setTimeout(() => {
        message.client.cooldowns.delete(
          `${command?.name}-${message.member?.user.username}`
        );
      }, command.cooldown * 1000);
    } else if (command.cooldown && !cooldown) {
      message.client.cooldowns.set(
        `${command.name}-${message.member.user.username}`,
        Date.now() + command.cooldown * 1000
      );
    }

    command.execute(message, args);
  },
};

export default event;

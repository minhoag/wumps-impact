import { ChannelType, Message } from 'discord.js';

import { Event } from '../types';
import { checkPermissions, limit, sendTimedMessage } from '../utils';

const event: Event = {
  name: 'messageCreate',
  execute: async (message: Message) => {
    if (!message.member || message.member.user.bot) return;
    if (!message.guild) return;
    let prefix: string = process.env.DISCORD_PREFIX ?? '.';
    if (!message.content.startsWith(prefix)) {
      const timeout: number = 60;
      const usersMap = new Map();
      const LIMIT: number = 10;
      const DIFF: number = 3000;
      await limit(message, usersMap, LIMIT, DIFF);
      const chatCooldowns: number | undefined = message.client.chats.get(
        `${message.member.user.username}`,
      );
      if (chatCooldowns) {
        if (Date.now() < chatCooldowns) return;
        message.client.chats.set(
          `${message.member.user.username}`,
          Date.now() + timeout * 1000,
        );
        setTimeout(() => {
          message.client.chats.delete(`${message.member?.user.username}`);
        }, timeout * 1000);
      } else {
        message.client.chats.set(
          `${message.member.user.username}`,
          Date.now() + timeout * 1000,
        );
      }
      return;
    }
    if (message.channel.type !== ChannelType.GuildText) return;
    const args = message.content.substring(prefix.length).split(' ');
    let command = message.client.commands.get(args[0]);

    if (!command) {
      const commandFromAlias = message.client.commands.find((command) =>
        command.aliases.includes(args[0]),
      );
      if (commandFromAlias) command = commandFromAlias;
      // Chat counter
      else return;
    }

    const cooldown = message.client.cooldowns.get(
      `${command.name}-${message.member.user.username}`,
    );
    const neededPermissions = checkPermissions(
      message.member,
      command.permissions,
    );
    if (neededPermissions !== null)
      return sendTimedMessage(
        `
            Bạn không có quyền sử dụng Bot.
            \n Quyền để được sử dụng: ${neededPermissions.join(', ')}
            `,
        message.channel,
        5000,
      );

    if (command.cooldown && cooldown) {
      if (Date.now() < cooldown) {
        sendTimedMessage(
          `Bạn phải đợi ${Math.floor(
            Math.abs(Date.now() - cooldown) / 1000,
          )} giây(s) để sự dụng lệnh này.`,
          message.channel,
          5000,
        );
        return;
      }
      message.client.cooldowns.set(
        `${command.name}-${message.member.user.username}`,
        Date.now() + command.cooldown * 1000,
      );
      setTimeout(() => {
        message.client.cooldowns.delete(
          `${command?.name}-${message.member?.user.username}`,
        );
      }, command.cooldown * 1000);
    } else if (command.cooldown && !cooldown) {
      message.client.cooldowns.set(
        `${command.name}-${message.member.user.username}`,
        Date.now() + command.cooldown * 1000,
      );
    }

    command.execute(message, args);
  },
};

export default event;

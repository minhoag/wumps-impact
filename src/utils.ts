import { ButtonStyle, ChannelType, ComponentType, EmbedBuilder, GuildMember, Message, PermissionFlagsBits, PermissionResolvable, TextChannel } from 'discord.js';
import process from 'node:process';
import { promisify } from 'node:util';
import { createClient } from 'redis';



import { Localizaion } from './i18n';





/** Translate message to local language **/
export const translate = ({
  message,
  locale,
}: {
  message: string;
  locale?: string;
}) =>
  Localizaion[message][
    locale ? locale : (process.env.DISCORD_DEFAULT_LOCALE as string)
  ];

/** Predefined embed **/
export const embeds: EmbedBuilder = new EmbedBuilder().setColor(
  '#36393F',
);

/** Check if user has the permission to use legacy command **/
export const checkPermissions = (
  member: GuildMember,
  permissions: Array<PermissionResolvable>,
) => {
  const neededPermissions: PermissionResolvable[] = [];
  permissions.forEach((permission) => {
    if (!member.permissions.has(permission))
      neededPermissions.push(permission);
  });
  if (neededPermissions.length === 0) return null;
  return neededPermissions.map((p) => {
    if (typeof p === 'string') return p.split(/(?=[A-Z])/).join(' ');
    else
      return Object.keys(PermissionFlagsBits)
        .find((k) => Object(PermissionFlagsBits)[k] === p)
        ?.split(/(?=[A-Z])/)
        .join(' ');
  });
};

/** Send a message that user is time-out or not **/
export const sendTimedMessage = (
  message: string,
  channel: TextChannel,
  duration: number,
) => {
  channel
    .send(message)
    .then((m) =>
      setTimeout(
        async () => (await channel.messages.fetch(m)).delete(),
        duration,
      ),
    );
  return;
};

/** Check if user has spammed **/
export async function limit(
  message: Message,
  usersMap: any,
  DIFF: number,
  LIMIT: number,
) {
  if (usersMap.has(message.author.id)) {
    const userData = usersMap.get(message.author.id);
    const { lastMessage, timer } = userData;
    const difference: number =
      message.createdTimestamp - lastMessage.createdTimestamp;
    let msgCount = userData.msgCount;
    if (difference > DIFF) {
      clearTimeout(timer);
      userData.msgCount = 1;
      userData.lastMessage = message;
      userData.timer = setTimeout(() => {
        usersMap.delete(message.author.id);
      }, 30 * 1000);
      usersMap.set(message.author.id, userData);
    } else {
      ++msgCount;
      if (!message.guild) return;
      if (parseInt(msgCount) === LIMIT) {
        message.guild.members
          .fetch(message.author.id)
          .then((user: any) =>
            user.timeout(1_800_000, 'Timeout for spamming.'),
          );
      }
      userData.msgCount = msgCount;
      usersMap.set(message.author.id, userData);
    }
  } else {
    let fn = setTimeout(() => {
      usersMap.delete(message.author.id);
    }, 30 * 1000);
    usersMap.set(message.author.id, {
      msgCount: 1,
      lastMessage: message,
      timer: fn,
    });
  }
}

/**
 * Redis functions
 *
 * **/
export const client = createClient();
export const getAsync = promisify(client.get).bind(client);
export const setAsync = promisify(client.set).bind(client);
export const delAsync = promisify(client.del).bind(client);

/**
 * Writes strigify data to cache
 * @param {string} key key for the cache entry
 * @param {*} value any object/string/number */
export const cacheSet = async (key: string, value: unknown) => {
  return await setAsync(key, JSON.stringify(value));
};

/** Retrieves data for a given key
 * @param {string} key key of the cached entry */
export const cacheGet = async (key: string) => {
  const data = await getAsync(key);

  return JSON.parse(data);
};

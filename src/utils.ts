import { ButtonStyle, ChannelType, ComponentType, EmbedBuilder, GuildMember, Message, PermissionFlagsBits, PermissionResolvable, TextChannel } from 'discord.js';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';
import { createClient } from 'redis';



import { Localizaion } from './i18n';
import { Item, ItemProps } from './refs/ref.item';





/** Item data from server
 * @equip To see if the item is locked or not
 * @guid Unique id of the item
 * @itemId Reference: 3.4--GM_Handbook_-_EN.txt
 * @itemType
 * 1: Unknown?
 * 2: Material
 * 3: Artifact
 * @reference [3.4--GM_Handbook_-_EN.txt](https://cdn.discordapp.com/attachments/1332108276682457232/1332258523605766144/3.4--GM_Handbook_-_EN.txt?ex=679499f0&is=67934870&hm=16e725f6166685ff2f6a5e2e61fe9dda3c456a09598e35f8640036638d799e52&)
 * **/
interface ItemData {
  equip?: { is_locked: boolean; reliquary: any };
  guid: string;
  item_id: number;
  item_type: number;
  material?: { count: number };
}

/** Bin Data get from MUIP
 * @itemBinData Get user inventory data
 * @packStore Get user inventory data
 * @mcoin Mora
 * @scoin Primogems
 * **/
interface ItemBinData {
  data: {
    item_bin_data: {
      pack_store: {
        item_list: ItemData[];
      };
      mcoin: number;
      scoin: number;
      hcoin: number;
    };
  };
}

interface ItemFiltered {
  item: ItemProps[];
  m_coin: number;
  s_coin: number;
  h_coin: number;
  masterless: number;
}

/** Translate message to local language **/
export const translate = ({
  message,
  locale,
}: {
  message: string;
  locale: string;
}) => Localizaion[message][locale];

/** Predefined embed **/
export const embeds: EmbedBuilder = new EmbedBuilder().setColor('#36393F');

/** Check if user has the permission to use legacy command **/
export const checkPermissions = (
  member: GuildMember,
  permissions: Array<PermissionResolvable>,
) => {
  const neededPermissions: PermissionResolvable[] = [];
  permissions.forEach((permission) => {
    if (!member.permissions.has(permission)) neededPermissions.push(permission);
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

/** Get Item from server and cache in redis
 * @param {string} id user id
 * @example
 *  Response: {
 *   data: {
 *     item_bin_data: {
 *       activity_output_control_record_list: [Array],
 *       bonus_record_list: [Array],
 *       equip_levelup_record_bin: [Object],
 *       hcoin: 72231,
 *       history_item_list: [Array],
 *       home_coin: 0,
 *       is_psn_version_modify: true,
 *       item_cd_map: {},
 *       item_limit_record_list: [Array],
 *       item_limit_refresh_record_list: [],
 *       item_total_obtain_count_list: [Array],
 *       legendary_key: 41,
 *       material_delete_return_record: [Object],
 *       mcoin: 12052509,
 *       output_control_record_map: [Object],
 *       pack_store: [Object],
 *       psn_mcoin: 0,
 *       reliquary_filter_state_list: [],
 *       reliquary_guarantee_depot_list: [Array],
 *       reliquary_suit_list: [Array],
 *       resin_record: [Object],
 *       scoin: 1481653109,
 *       shop_output_record: [Object],
 *       wait_sub_hcoin: 0,
 *       wait_sub_home_coin: 0,
 *       wait_sub_mcoin: 0,
 *       wait_sub_psn_mcoin: 0,
 *       wait_sub_scoin: 0
 *     }
 *   },
 *   msg: 'succ',
 *   retcode: 0,
 *   ticket: 'GM'
 * }
 * */
const FILTERED_ITEM_TYPE = 2;
const FILTERED_ITEM_IDS = new Set([112060]);

export const getItemsInBag = async (
  id: string,
): Promise<ItemFiltered | null> => {
  const start = performance.now();
  /** Connect to redis **/
  const client = createClient({
    url: process.env.REDIS_URL,
  });
  await client.connect();
  /** Define items to store query bin data **/
  let items: ItemBinData | null = null;
  /** Check if cache exist in redis **/
  const cachedItems = await client.get(`${id}-bag`);
  /** If not **/
  if (!cachedItems || cachedItems === '{}') {
    const res = await fetch(
      `http://localhost:14861/api?cmd=1016&region=dev_gio&ticket=GM&uid=${1}`,
    );
    items = await res.json();
    await client.set(`${id}-bag`, JSON.stringify(items), {
      EX: 60,
    });
  } else {
    items = JSON.parse(cachedItems);
  }
  await client.disconnect();
  /** Check if return is JSON or OBJECT **/
  if (items && typeof items === 'object') {
    /** Query item **/
    const item_list = items.data.item_bin_data.pack_store.item_list;
    const filteredItems = item_list
      .filter(
        (item) =>
          item.item_type === FILTERED_ITEM_TYPE &&
          FILTERED_ITEM_IDS.has(item.item_id),
      )
      .map((item) => {
        if (item.material) {
          return {
            item: Item.find((i) => Number(i.value) == item.item_id),
            count: item.material.count,
          };
        } else {
          return {
            item: Item.find((i) => Number(i.value) == item.item_id),
          };
        }
      });
    console.log('Time to get items:', performance.now() - start);
    return {
      item: filteredItems as unknown as ItemProps[],
      m_coin: items.data.item_bin_data.mcoin,
      s_coin: items.data.item_bin_data.scoin,
      h_coin: items.data.item_bin_data.hcoin,
      masterless:
        items.data.item_bin_data.pack_store.item_list.find(
          (i) => i.item_id === 221,
        )?.material?.count ?? 0,
    };
  } else {
    console.log('Time to get items:', performance.now() - start);
    console.error('Invalid items format');
    return null;
  }
};

export function removeAccents(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

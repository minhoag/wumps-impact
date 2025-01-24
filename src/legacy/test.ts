import { PermissionFlagsBits } from 'discord.js';

import { Command } from '../types';

const command: Command = {
  name: 'test',
  permissions: ['Administrator'],
  aliases: ['ts'],
  cooldown: 10,
  execute: async () => {
    const res = await fetch(
      `http://localhost:14861/api?cmd=1016&region=dev_gio&ticket=GM&uid=${1}`,
    );
    const item = await res.json();
    // Materials are type 2
    let all_item: any;
    all_item = item.data.item_bin_data.pack_store.item_list.filter(
      (i: any) => i.item_type === 2,
    );
    console.log(all_item);
  },
};
export default command;

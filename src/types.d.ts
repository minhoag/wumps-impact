import {
  SlashCommandBuilder,
  CommandInteraction,
  Collection,
  PermissionResolvable,
  Message,
  AutocompleteInteraction,
  Client,
  DateResolvable,
  Channel,
} from 'discord.js';
import EventEmitter from 'events';

type UserOptions = {
  schedule: Array<GachaTypeGuard>;
};

export const mainStats: {
  [key: string]: number | string;
} = {
  30960: 'critRate',
  30950: 'critDamage:',
  50880: 'em',
  50990: 'atkPercent',
  50980: 'hpPercent',
  50970: 'defPercent',
  15003: 'atkFlat',
  15001: 'hpFlat',
  10960: 'er',
  30940: 'healingBonus',
  50950: 'electro',
  50960: 'pyro',
  50940: 'cyro',
  50930: 'hydro',
  50910: 'geo',
  50920: 'anemo',
  50900: 'dendro',
  50890: 'physical',
};

export const subStats: {
  [key: string]: number | string;
} = {
  501204: 'critRate',
  501224: 'critDamage:',
  501244: 'em',
  501064: 'atkPercent',
  501034: 'hpPercent',
  501094: 'defPercent',
  501054: 'atkFlat',
  501024: 'hpFlat',
  501084: 'defFlat',
  501234: 'er',
};

export type SlashCommand = {
  command: SlashCommandBuilder | any;
  cooldown?: number;
  autocomplete?: (
    interaction: AutocompleteInteraction,
    client?: Client
  ) => void;
  execute: (interaction: CommandInteraction, client?: Client) => void;
};

export type Command = {
  name: string;
  permissions: Array<PermissionResolvable>;
  aliases: Array<string>;
  cooldown?: number;
  execute: (message: Message, args: Array<string>) => void;
};

export type BotEvent = {
  name: string;
  once?: boolean | false;
  execute: (...args) => void;
};

export type GuildOption = keyof GuildOptions;

export type UserOption = keyof UserOptions;

export type GuildProperty = keyof GuildProperties;

export type User = {
  uid: number;
  account_type: number;
  account_uid: string;
  create_time: Date;
  ext: string;
  tag: number;
};

declare module 'discord.js' {
  export interface Client {
    slashCommands: Collection<string, SlashCommand>;
    commands: Collection<string, Command>;
    cooldowns: Collection<string, number>;
  }
}

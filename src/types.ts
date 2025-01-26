import {
  AutocompleteInteraction,
  Client,
  Collection,
  CommandInteraction,
  Message,
  type PermissionResolvable,
  SlashCommandBuilder,
} from 'discord.js';

export type SlashCommand = {
  /** @description Name of the slash command. Slash Commands are registered by name **/
  command: SlashCommandBuilder | any;
  /** @description Map of cooldowns to add user to. **/
  cooldown?: number;
  /** @description Get interaction options when `.setAutocomplete` is true . **/
  autocomplete?: (
    interaction: AutocompleteInteraction,
    client?: Client,
  ) => void;
  /**
   * @description Execute the slash command.
   * @params interaction
   * @documentation https://discord.js.org/docs/packages/discord.js/main/Interaction:TypeAlias
   * **/
  execute: (interaction: CommandInteraction, client?: Client) => void;
};

export type Command = {
  /** @description Name of the command. Commands are called by name. **/
  name: string;
  /** @description Permissions required to execute this command. This is referred to PermissionBits. **/
  permissions: Array<PermissionResolvable>;
  /** @description Another way that this command can be called. Maybe using a shorthand.
   * @example
   * name: 'greeting'
   * aliases: ['greet']
   * Assume that the command is called using `.greeting`
   * Calling `.greeting` === `.greet` **/
  aliases: Array<string>;
  /** @description Time before command can be used again. **/
  cooldown?: number;
  /** @description Execute the command.
   * @params message: first letter of the message is considered as the PREFIX. The following before SPACE is the command name.
   * @params args: the arguments that follows after the initial word of message**/
  execute: (message: Message, args: Array<string>) => void;
};

export type Event = {
  /** @description Name of the event. Naming should be followed by the event listeners
   * @document https://discord.js.org/docs/packages/discord.js/14.14.1/Events:Enum
   * **/
  name: string;
  /** @description Name of the command. Commands are called by name. **/
  once?: boolean | false;
  /** @description Execute the event.
   *
   * @params args: the arguments that follows after the initial word of message
   */
  execute: (...args: any[]) => void | Promise<void>;
};

export type GachaDatabase = {
  /** @description Event ID (unique and auto-increment) **/
  /** @description Gacha type **/
  gacha_type: number;
  /** @description Start time ISOString **/
  begin_time: string;
  /** @description End time ISOString **/
  end_time: string;
  /** @description Cost item ID **/
  cost_item_id: 223 | 224;
  /** @description Cost item quantity **/
  cost_item_num: number;
  /**
   * @description Gacha root ID
   * @default 201
   * **/
  gacha_pool_id: 101 | 201;
  /** @description Gacha probability configuration ID
   * @default 1
   * @documentation
   * 1: Limited Character Banner
   * 2: Limited Weapon Banner
   * 3: Common Banner
   * **/
  gacha_prob_rule_id: number;
  /** @description UP configuration
   * @example
   * {
   *   "gacha_up_list": [
   *     {
   *       "item_parent_type": 1,
   *       "prob": 500,
   *       "item_list": [
   *         1054
   *       ]
   *     },
   *     {
   *       "item_parent_type": 2,
   *       "prob": 500,
   *       "item_list": [
   *         1025,
   *         1043,
   *         1068
   *       ]
   *     }
   *   ]
   * }
   * @attention Flatten JSON before parsing
   * **/
  gacha_up_config: string;
  /** @description Guarantee rule configuration **/
  gacha_rule_config: string;
  /** @description Gacha Prefab path **/
  gacha_prefab_path: string;
  /** @description Gacha preview Prefab path **/
  gacha_preview_prefab_path: string;
  /** @description Gacha probability display URL **/
  gacha_prob_url: string;
  /** @description Gacha record URL **/
  gacha_record_url: string;
  /** @description Overseas Gacha probability display URL **/
  gacha_prob_url_oversea: string;
  /** @description Overseas Gacha record URL **/
  gacha_record_url_oversea: string;
  /** @description Gacha sorting weight **/
  gacha_sort_id: number;
  /** @description 0 not effective, 1 effective **/
  enabled: number;
  /** @description Gacha display multilingual text **/
  title_textmap: string;
  /** @description Display UP 4-star items **/
  display_up4_item_list: string;
};

declare module 'discord.js' {
  export interface Client {
    /** @description List of slashCommands **/
    slashCommands: Collection<string, SlashCommand>;
    /** @description List of legacy commands. **/
    commands: Collection<string, Command>;
    /** @description Map of cooldowns to add user to. **/
    cooldowns: Collection<string, number>;
    /** @description All the chat that was made recently to counter the points. **/
    chats: Collection<string, number>;
    /** @description Chat limiting. **/
    gacha: Array<{ name: string; value: string }>;
    currentLimit: number;
  }
}

import {
  AutocompleteInteraction,
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
  type ApplicationCommandOptionChoiceData,
  type AutocompleteFocusedOption,
} from 'discord.js';

export enum EmbedType {
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  INFO = 'INFO',
  DEFAULT = 'DEFAULT',
}

export enum ResponseType {
  EMBED = 'EMBED',
  STRING = 'STRING',
  EPHEMERAL = 'EPHEMERAL',
}

export type Command = {
  command: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  cooldown: number;
  defer?: boolean;
  autocomplete?(
    interaction: AutocompleteInteraction,
    option?: AutocompleteFocusedOption,
  ): Promise<ApplicationCommandOptionChoiceData[]>;
  execute(interaction: CommandInteraction): Promise<void>;
};

export type Event = {
  name: string;
  once: boolean;
  execute: (...args: any[]) => void | Promise<void>;
};
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
    events: Collection<string, Event>;
    cooldowns: Collection<string, number>;
    gachaData: any[];
    gachaSchedule: any[];
  }
}

export class CustomResponse extends Response {
  data?: string;
  msg?: string;
  retcode?: number;
  ticket?: string;

  constructor(data?: string, msg?: string, retcode?: number, ticket?: string) {
    super();
    this.data = data;
    this.msg = msg;
    this.retcode = retcode;
    this.ticket = ticket;
  }

  toJSON() {
    return {
      data: this.data,
      msg: this.msg,
      retcode: this.retcode,
      ticket: this.ticket,
    };
  }
}

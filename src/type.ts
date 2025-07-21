import {
  AutocompleteInteraction,
  Collection,
  CommandInteraction,
  Locale,
  SlashCommandBuilder,
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
  command: SlashCommandBuilder;
  cooldown: number;
  autocomplete?(
    interaction: AutocompleteInteraction,
    option?: AutocompleteFocusedOption,
  ): Promise<ApplicationCommandOptionChoiceData[]>;
  execute(
    interaction: CommandInteraction
  ): Promise<void>;
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
  }
}
import { EmbedType, ResponseType } from '@/type';
import {
  CommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  MessageFlags,
  type ColorResolvable,
  ChannelType,
  TextChannel,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  type PermissionResolvable,
} from 'discord.js';
import { Mail } from './mail-utils';

const COOLDOWN_SEPARATOR = '-';

const getCooldownKey = (commandName: string, userId: string): string =>
  `${commandName}${COOLDOWN_SEPARATOR}${userId}`;

export const DiscordResponse = {
  createEmbed: (options: {
    title?: string;
    description?: string;
    type: EmbedType;
    fields?: { name: string; value: string }[];
    image?: string | null;
  }) => {
    const { title, description, type, fields, image } = options;
    const color: { [key in EmbedType]: ColorResolvable } = {
      SUCCESS: '#57F287' as ColorResolvable,
      ERROR: '#ED4245' as ColorResolvable,
      INFO: '#FEE75C' as ColorResolvable,
      DEFAULT: '#FEE75C' as ColorResolvable,
    };
    const embed = new EmbedBuilder();
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    embed.setColor(color[type]);
    if (fields) embed.addFields(fields);
    if (image) embed.setImage(image);
    return embed;
  },

  sendResponse: async (options: {
    interaction: any;
    types: ResponseType[];
    embed?: EmbedBuilder;
    content?: string;
    components?: any[];
  }) => {
    const { interaction, types, embed, content } = options;
    const response = {
      embeds: embed && types.includes(ResponseType.EMBED) ? [embed] : [],
      content: types.includes(ResponseType.STRING) ? content || '' : '',
      flags: types.includes(ResponseType.EPHEMERAL) ? MessageFlags.Ephemeral : 0,
    };
    if (interaction.deferred) {
      await interaction.editReply(response);
    } else {
      await interaction.reply(response);
    }
  },

  sendSuccess: async (
    interaction: CommandInteraction,
    messageOrOptions:
      | string
      | {
          message?: string;
          messageCode?: number;
          placeholders?: Record<string, string>;
          title?: string;
          ephemeral?: boolean;
          fields?: { name: string; value: string }[];
          image?: string;
        },
  ) => {
    const options =
      typeof messageOrOptions === 'string' ? { message: messageOrOptions } : messageOrOptions;

    const {
      message,
      messageCode,
      placeholders = {},
      title = 'Success',
      ephemeral = true,
      fields,
      image,
    } = options;

    let description = message;
    if (messageCode && !message) {
      description = DiscordResponse.getMessageByCode(
        'SUCCESS',
        messageCode,
        interaction.locale,
        placeholders,
      );
    } else if (message && Object.keys(placeholders).length > 0) {
      description = DiscordResponse.replacePlaceholders(message, placeholders);
    }

    const embed = DiscordResponse.createEmbed({
      title,
      description,
      type: EmbedType.SUCCESS,
      fields,
      image,
    });

    await DiscordResponse.sendResponse({
      interaction,
      types: [ResponseType.EMBED, ...(ephemeral ? [ResponseType.EPHEMERAL] : [])],
      embed,
    });
  },

  sendFailed: async (
    interaction: any,
    messageOrOptions:
      | string
      | {
          message?: string;
          messageCode?: number;
          placeholders?: Record<string, string>;
          title?: string;
          ephemeral?: boolean;
          fields?: { name: string; value: string }[];
          image?: string;
        },
  ) => {
    const options =
      typeof messageOrOptions === 'string' ? { message: messageOrOptions } : messageOrOptions;

    const {
      message,
      messageCode,
      placeholders = {},
      title = 'Failed',
      ephemeral = true,
      fields,
      image,
    } = options;

    let description = message;
    if (messageCode && !message) {
      description = DiscordResponse.getMessageByCode(
        'ERROR',
        messageCode,
        interaction.locale,
        placeholders,
      );
    } else if (message && Object.keys(placeholders).length > 0) {
      description = DiscordResponse.replacePlaceholders(message, placeholders);
    }

    const embed = DiscordResponse.createEmbed({
      title,
      description,
      type: EmbedType.ERROR,
      fields,
      image,
    });

    await DiscordResponse.sendResponse({
      interaction,
      types: [ResponseType.EMBED, ...(ephemeral ? [ResponseType.EPHEMERAL] : [])],
      embed,
    });
  },

  getMessageByCode: (
    category: 'SUCCESS' | 'ERROR' | 'API' | 'DICT',
    code: number | string,
    locale: string,
    placeholders: Record<string, string> = {},
  ): string => {
    const { SUCCESS_MESSAGE, ERROR_MESSAGE, API_MESSAGE, DICT } = require('@/constant/response');
    const map =
      category === 'SUCCESS'
        ? SUCCESS_MESSAGE
        : category === 'ERROR'
        ? ERROR_MESSAGE
        : category === 'API'
        ? API_MESSAGE
        : DICT;
    const message = map[code]?.[locale] || map[code]?.['en-US'] || 'Message not found';
    return DiscordResponse.replacePlaceholders(message, placeholders);
  },

  replacePlaceholders: (message: string, placeholders: Record<string, string>): string => {
    let result = message;
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  },
};

export const DiscordEvent = {
  handleChatInput: async (interaction: CommandInteraction): Promise<void> => {
    const { client, commandName, user } = interaction;
    const command = client.commands.get(commandName);
    if (!command) return;
    if (command.defer) await interaction.deferReply();
    //--- Guard Permission ----
    const permission = command.permission as PermissionResolvable;
    if (!interaction.memberPermissions?.has(permission)) return;
    if (command.cooldown) {
      const cooldownKey = getCooldownKey(commandName, user.id);
      const now = Date.now();
      const expiresAt = client.cooldowns.get(cooldownKey);
      if (expiresAt && now < expiresAt) {
        const timeLeft = ((expiresAt - now) / 1000).toFixed(1);
        await DiscordResponse.sendFailed(interaction, {
          messageCode: 101,
          placeholders: { time: timeLeft },
        });
        return;
      }
      client.cooldowns.set(cooldownKey, now + command.cooldown * 1000);
      setTimeout(() => client.cooldowns.delete(cooldownKey), command.cooldown * 1000);
    }
    await command.execute(interaction);
  },

  handleAutocomplete: async (interaction: AutocompleteInteraction): Promise<void> => {
    const { client, commandName } = interaction;
    const command = client.commands.get(commandName);
    if (!command) return;
    //--- Guard Permission ----
    const permission = command.permission as PermissionResolvable;
    if (!interaction.memberPermissions?.has(permission)) return;
    if (!command?.autocomplete) return;
    await command.autocomplete(interaction, interaction.options.getFocused(true));
  },

  handleModalSubmit: async (interaction: ModalSubmitInteraction): Promise<void> => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'mail-init') {
      await Mail.handleMailInitModal(interaction);
    } else if (interaction.customId.startsWith('mail-search-')) {
      await Mail.handleMailSearchModal(interaction);
    } else if (interaction.customId.startsWith('mail-quantity-')) {
      await Mail.handleMailQuantityModal(interaction);
    }
  },


  handleButtonInteraction: async (interaction: ButtonInteraction): Promise<void> => {
    await Mail.handleMailButtonInteraction(interaction);
  },

  handleSelectMenuInteraction: async (interaction: StringSelectMenuInteraction): Promise<void> => {
    await Mail.handleMailSelectMenuInteraction(interaction);
  },

  recordEventLog: async (interaction: CommandInteraction, event: string) => {
    let channel = interaction.guild?.channels.cache.find((c) => c.name === 'event-log') as TextChannel;
    if (!channel) {
      channel = (await interaction.guild?.channels.create({
        name: 'event-log',
        type: ChannelType.GuildText,
      })) as TextChannel;
    }
    await channel?.send(`${interaction.user.username} - ${event}`);
  },
};

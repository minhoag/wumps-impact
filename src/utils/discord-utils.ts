import { ERROR_MESSAGE } from '@/constant/response';
import { EmbedType, ResponseType } from '@/type';
import {
  CommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  MessageFlags,
  type ColorResolvable,
  ChannelType,
  channelLink,
  TextChannel,
  ModalSubmitInteraction,
} from 'discord.js';
import { GMUtils } from './gm-utils';

const COOLDOWN_SEPARATOR = '-';

const getCooldownKey = (commandName: string, userId: string): string =>
  `${commandName}${COOLDOWN_SEPARATOR}${userId}`;

export const DiscordResponse = {
  //--- Create embed ----
  createEmbed: (options: {
    title?: string;
    description: string;
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
    return new EmbedBuilder()
      .setTitle(title || '')
      .setDescription(description)
      .setColor(color[type])
      .addFields(fields || [])
      .setImage(image || null);
  },

  //--- Send response ----
  sendResponse: async (options: {
    interaction: CommandInteraction;
    types: ResponseType[];
    embed?: EmbedBuilder;
    content?: string;
  }) => {
    const { interaction, types, embed, content } = options;
    const response = {
      embeds: [] as EmbedBuilder[],
      content: '',
      flags: 0,
      withResponse: false,
    };

    for (const type of types) {
      if (type === ResponseType.EMBED && embed) {
        response.embeds.push(embed);
      } else if (type === ResponseType.STRING) {
        response.content = content || '';
      } else if (type === ResponseType.EPHEMERAL) {
        response.flags = MessageFlags.Ephemeral;
      } else {
        throw new Error(`Invalid response type: ${type}`);
      }
    }

    if (interaction.deferred) {
      await interaction.editReply(response);
    } else if (!interaction.replied) {
      await interaction.reply(response);
    }
  },

  sendSuccess: async (interaction: CommandInteraction, message: string) => {
    const embed = DiscordResponse.createEmbed({
      title: 'Success',
      description: message,
      type: EmbedType.SUCCESS,
    });
    await DiscordResponse.sendResponse({
      interaction,
      types: [ResponseType.EMBED, ResponseType.EPHEMERAL],
      embed,
    });
  },

  sendFailed: async (interaction: CommandInteraction, message: string) => {
    const embed = DiscordResponse.createEmbed({
      title: 'Failed',
      description: message,
      type: EmbedType.ERROR,
    });
    await DiscordResponse.sendResponse({
      interaction,
      types: [ResponseType.EMBED, ResponseType.EPHEMERAL],
      embed,
    });
  },
};

export const DiscordEvent = {
  //--- Handle chat input command ----
  handleChatInput: async (interaction: CommandInteraction): Promise<void> => {
    const { client, commandName, user } = interaction;
    const command = client.commands.get(commandName);
    //--- Guard command exist ----
    if (!command) {
      console.error(`No command matching ${commandName} was found.`);
      return;
    }

    //--- Defer reply ----
    if (command.defer) {
      await interaction.deferReply();
    }

    //--- No cooldown ----
    if (command.cooldown) {
      const cooldownKey = getCooldownKey(commandName, user.id);
      const now = Date.now();
      const expiresAt = client.cooldowns.get(cooldownKey);
      if (expiresAt && now < expiresAt) {
        const timeLeft = ((expiresAt - now) / 1000).toFixed(1);
        await DiscordResponse.sendFailed(
          interaction,
          ERROR_MESSAGE[101][interaction.locale]?.replace('{time}', timeLeft) || '',
        );
        return;
      }
      client.cooldowns.set(cooldownKey, now + command.cooldown * 1000);
      setTimeout(() => client.cooldowns.delete(cooldownKey), command.cooldown * 1000);
    }
    await command.execute(interaction);
  },

  //--- Handle autocomplete ----
  handleAutocomplete: async (interaction: AutocompleteInteraction): Promise<void> => {
    const { client, commandName } = interaction;
    const command = client.commands.get(commandName);

    if (!command || !command.autocomplete) {
      console.error(`No autocomplete handler for ${commandName}.`);
      return;
    }
    await command.autocomplete(interaction, interaction.options.getFocused(true));
  },

  //--- Handle modal submit ----
  handleModalSubmit: async (interaction: ModalSubmitInteraction): Promise<void> => {
    if (!interaction.isModalSubmit() || interaction.customId !== 'mailForm') return;

    try {
      const receiver = interaction.fields.getTextInputValue('receiverInput');
      const title = interaction.fields.getTextInputValue('titleInput');
      const content = interaction.fields.getTextInputValue('contentInput');
      const expiryInput = interaction.fields.getTextInputValue('expiryInput') || '30';
      const item = interaction.fields.getTextInputValue('itemInput').replace(/\s/g, '') || '';

      const expiry = parseInt(expiryInput);
      if (isNaN(expiry) || expiry <= 0) {
        await interaction.reply({
          content: 'Thời hạn phải là số ngày hợp lệ (lớn hơn 0)',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (receiver.toLowerCase() === 'all') {
        const result = await GMUtils.sendMailToAll(title, content, item, expiry);
        if (result.success) {
          await interaction.editReply({
            content: `✅ Gửi thư thành công cho tất cả người chơi! ${result.successCount > 0 ? `(${result.successCount} người nhận)` : ''}${result.failedUIDs.length > 0 ? `\n❌ Gửi thất bại cho: ${result.failedUIDs.join(', ')}` : ''}`,
          });
        } else {
          await interaction.editReply({
            content: `❌ Gửi thư thất bại: ${result.message}`,
          });
        }
      } else {
        const result = await GMUtils.sendMailToPlayer(receiver, title, content, item, expiry);
        if (result.success) {
          await interaction.editReply({
            content: `✅ Gửi thư thành công cho người chơi ${receiver}`,
          });
        } else {
          await interaction.editReply({
            content: `❌ Gửi thư thất bại cho người chơi ${receiver}: ${result.message}`,
          });
        }
      }
    } catch (error) {
      console.error('Modal submit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';

      if (interaction.deferred) {
        await interaction.editReply({
          content: `❌ Đã xảy ra lỗi: ${errorMessage}`,
        });
      } else {
        await interaction.reply({
          content: `❌ Đã xảy ra lỗi: ${errorMessage}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },

  recordEventLog: async (interaction: CommandInteraction, event: string) => {
    //--- Create channel if not exist ----
    let channel = interaction.guild?.channels.cache.find(
      (channel) => channel.name === 'event-log',
    ) as TextChannel;
    if (!channel) {
      channel = (await interaction.guild?.channels.create({
        name: 'event-log',
        type: ChannelType.GuildText,
      })) as TextChannel;
    }
    //--- Send message to channel ----
    await channel?.send(`${interaction.user.username} - ${event}`);
  },
};

import {
  type AutocompleteInteraction,
  CommandInteraction,
  type Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ApplicationCommandOptionChoiceData,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';

import { Item, type ItemProps } from '../data/item';
import type { Command } from '../type';
import { GMUtils } from '../utils/gm-utils';
import { DiscordResponse } from '@/utils/discord-utils';
import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constant';
import { DiscordException } from '@/exception';

const command: Command = {
  command: new SlashCommandBuilder()
    .setName('gm')
    .setDescription('GM admin command.')
    .setDescriptionLocalization(
      'vi',
      'Lệnh dành cho quản trị viên GM.',
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('give')
        .setDescription('Give item to player.')
        .setDescriptionLocalization('vi', 'Gửi item cho người chơi.')
        .addStringOption((option) =>
          option
            .setName('uid')
            .setDescription('UID của người chơi')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('Id của item')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addNumberOption((option) =>
          option.setName('amount').setDescription('Số lượng'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Take away item from player.')
        .setDescriptionLocalization('vi', 'Xóa item của người chơi.')
        .addStringOption((option) =>
          option
            .setName('uid')
            .setDescription('UID của người chơi')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('Id của item')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addNumberOption((option) =>
          option.setName('amount').setDescription('Số lượng'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('transfer')
        .setDescription('Give money to player.')
        .setDescriptionLocalization('vi', 'Gửi tiền cho người chơi.')
        .addStringOption((option) =>
          option
            .setName('uid')
            .setDescription('UID của người chơi')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Chọn loại tiền tệ')
            .setRequired(true)
            .addChoices(
              { name: 'Đá sáng thế', value: 'mcoin' },
              { name: 'Mora', value: 'scoin' },
              { name: 'Nguyên thạch', value: 'hcoin' },
              { name: 'Tiền Động Tiên', value: 'home_coin' },
            ),
        )
        .addNumberOption((option) =>
          option.setName('amount').setDescription('Số lượng'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('takeaway')
        .setDescription('Take away money from player.')
        .setDescriptionLocalization('vi', 'Xóa tiền của người chơi.')
        .addStringOption((option) =>
          option
            .setName('uid')
            .setDescription('UID của người chơi')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Chọn loại tiền tệ')
            .setRequired(true)
            .addChoices(
              { name: 'Đá sáng thế', value: 'mcoin' },
              { name: 'Mora', value: 'scoin' },
              { name: 'Nguyên thạch', value: 'hcoin' },
              { name: 'Tiền Động Tiên', value: 'home_coin' },
            ),
        )
        .addNumberOption((option) =>
          option.setName('amount').setDescription('Số lượng'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('send-mail')
        .setDescription('Send mail to all players.')
        .setDescriptionLocalization(
          'vi',
          'Gửi mail cho tất cả người chơi.',
        ),
    ),
  cooldown: 1,
  defer: true,
  autocomplete: async (
    interaction: AutocompleteInteraction,
  ): Promise<ApplicationCommandOptionChoiceData[]> => {
    const focusedOption = interaction.options.getFocused(true);
    if (
      interaction.options.getSubcommand() === 'give' ||
      interaction.options.getSubcommand() === 'delete'
    ) {
      const filtered: {
        value: string;
        name: string;
      }[] = Item.filter((choice: ItemProps) =>
        choice.name
          .toLowerCase()
          .includes(focusedOption.value.toLowerCase()),
      );
      const options =
        filtered.length > 25 ? filtered.slice(0, 25) : filtered;
      await interaction.respond(options);
      return options;
    }
    await interaction.respond([]);
    return [];
  },
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    const locale: Locale = interaction.locale;
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'give': {
          const uid: string = interaction.options.getString(
            'uid',
            true,
          );
          const id: string = interaction.options.getString(
            'id',
            true,
          );
          const amount: number =
            interaction.options.getNumber('amount') ?? 1;
          const result = await GMUtils.giveItem(interaction, {
            uid,
            id,
            amount,
          });
          const itemName = Item.find(
            (item: ItemProps) => item.value === id,
          )?.name;

          if (result.success) {
            await DiscordResponse.sendSuccess(
              interaction,
              SUCCESS_MESSAGE[3000][locale]
                .replace('{action}', 'give')
                .replace('{itemName}', itemName ?? id)
                .replace('{playerName}', uid)
                .replace('{quantity}', amount.toString()),
            );
          } else {
            await DiscordResponse.sendFailed(
              interaction,
              ERROR_MESSAGE[3001][locale]
                .replace('{action}', 'give')
                .replace('{itemName}', id)
                .replace('{playerName}', uid)
                .replace('{quantity}', amount.toString()),
            );
          }
          break;
        }

        case 'delete': {
          const uid: string = interaction.options.getString(
            'uid',
            true,
          );
          const id: string = interaction.options.getString(
            'id',
            true,
          );
          const amount: number =
            interaction.options.getNumber('amount') ?? 1;

          const result = await GMUtils.deleteItem({
            uid,
            id,
            amount,
          });

          if (result.success) {
            await interaction.reply({
              content: SUCCESS_MESSAGE[3000][locale]
                .replace('{action}', 'delete')
                .replace('{itemName}', id)
                .replace('{playerName}', uid)
                .replace('{quantity}', amount.toString()),
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: ERROR_MESSAGE[3001][locale]
                .replace('{action}', 'delete')
                .replace('{itemName}', id)
                .replace('{playerName}', uid)
                .replace('{quantity}', amount.toString()),
              ephemeral: true,
            });
          }
          break;
        }

        case 'send-mail': {
          const modal = new ModalBuilder()
            .setCustomId('mailForm')
            .setTitle('Soạn thư gửi');

          const receiver = new TextInputBuilder()
            .setCustomId('receiverInput')
            .setLabel('Người nhận (UID hoặc "all" cho tất cả)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(
              'Nhập UID cụ thể hoặc "all" để gửi cho tất cả người chơi',
            )
            .setRequired(true);

          const title = new TextInputBuilder()
            .setCustomId('titleInput')
            .setLabel('Tiêu đề thư')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Nhập tiêu đề thư...')
            .setRequired(true);

          const content = new TextInputBuilder()
            .setCustomId('contentInput')
            .setLabel('Nội dung thư')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Nhập nội dung chi tiết của thư...')
            .setRequired(true);

          const expiry = new TextInputBuilder()
            .setCustomId('expiryInput')
            .setLabel('Thời hạn (ngày)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Số ngày hết hạn (mặc định: 30)')
            .setValue('30')
            .setRequired(false);

          const item = new TextInputBuilder()
            .setCustomId('itemInput')
            .setLabel('Items đính kèm (tùy chọn)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('VD: 201,100 hoặc để trống nếu không có')
            .setRequired(false);

          const firstRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              receiver,
            );
          const secondRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              title,
            );
          const thirdRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              content,
            );
          const fourthRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              expiry,
            );
          const fifthRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              item,
            );

          modal.addComponents(
            firstRow,
            secondRow,
            thirdRow,
            fourthRow,
            fifthRow,
          );
          await interaction.showModal(modal);
          break;
        }

        default:
          await interaction.reply({
            content: 'Unknown subcommand',
            ephemeral: true,
          });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        await DiscordResponse.sendFailed(interaction, error.message);
      } else if (error instanceof DiscordException) {
        await DiscordResponse.sendFailed(
          interaction,
          ERROR_MESSAGE[103][locale].replace(
            '{detail}',
            error.message,
          ),
        );
      }
    }
  },
};

export default command;

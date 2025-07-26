import {
  type AutocompleteInteraction,
  CommandInteraction,
  type Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ApplicationCommandOptionChoiceData,
} from 'discord.js';

import { Item, type ItemProps } from '../refs/ref.item';
import type { Command } from '../type';
import { GMUtils } from '../utils/gm-utils';
import { DiscordResponse } from '@/utils/discord-utils';
import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constant';
import { DiscordException } from '@/exception';

const command: Command = {
  command: new SlashCommandBuilder()
    .setName('gm')
    .setDescription('GM admin command.')
    .setDescriptionLocalization('vi', 'Lệnh dành cho quản trị viên GM.')
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
    ),
  cooldown: 1,
  defer: true,
  autocomplete: async (interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[]> => {
    const focusedOption = interaction.options.getFocused(true);
    if (
      interaction.options.getSubcommand() === 'give' ||
      interaction.options.getSubcommand() === 'delete'
    ) {
      const filtered: {
        value: string;
        name: string;
      }[] = Item.filter((choice: ItemProps) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
      );
      const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
      await interaction.respond(options);
      return options;
    }
    await interaction.respond([]);
    return [];
  },
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) return;

    const locale: Locale = interaction.locale;
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'give': {
          const uid: string = interaction.options.getString('uid', true);
          const id: string = interaction.options.getString('id', true);
          const amount: number = interaction.options.getNumber('amount') ?? 1;

          const result = await GMUtils.giveItem({ uid, id, amount });
          
          if (result.success) {
            await DiscordResponse.sendSuccess(interaction, SUCCESS_MESSAGE[3000][locale]
            .replace('{action}', 'gived')
            .replace('{itemName}', id)
            .replace('{playerName}', uid)
            .replace('{quantity}', amount.toString())
            );
          } else {
            await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[3001][locale]
            .replace('{action}', 'gived')
            .replace('{itemName}', id)
            .replace('{playerName}', uid)
            .replace('{quantity}', amount.toString())
            );
          }
          break;
        }

        case 'delete': {
          const uid: string = interaction.options.getString('uid', true);
          const id: string = interaction.options.getString('id', true);
          const amount: number = interaction.options.getNumber('amount') ?? 1;

          const result = await GMUtils.deleteItem({ uid, id, amount });
          
          if (result.success) {
            await interaction.reply({
              content: GMUtils.translate('admin:delete:success', locale) + ` ${uid}`,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: GMUtils.translate('admin:delete:error', locale) + uid,
              ephemeral: true,
            });
          }
          break;
        }

        case 'transfer': {
          const uid = interaction.options.getString('uid', true);
          const type = interaction.options.getString('type', true);
          const amount = interaction.options.getNumber('amount') ?? 1;

          const result = await GMUtils.transferCurrency({ uid, type, amount });
          const currencyName = GMUtils.getCurrencyDisplayName(type, locale);
          
          if (result.success) {
            await DiscordResponse.sendSuccess(interaction, SUCCESS_MESSAGE[3000][locale]
            .replace('{action}', 'transfered')
            .replace('{itemName}', currencyName)
            .replace('{playerName}', uid)
            .replace('{quantity}', amount.toString())
            );
          } else {  
            await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[3001][locale]
            .replace('{action}', 'transfered')
            .replace('{itemName}', currencyName)
            .replace('{playerName}', uid)
            .replace('{quantity}', amount.toString())
            );
          }
          break;
        }

        case 'takeaway': {
          const uid = interaction.options.getString('uid', true);
          const type = interaction.options.getString('type', true);
          const amount = interaction.options.getNumber('amount') ?? 1;

          const result = await GMUtils.takeawayCurrency({ uid, type, amount });
          const currencyName = GMUtils.getCurrencyDisplayName(type, locale);
          
          if (result.success) {
            await DiscordResponse.sendSuccess(interaction, SUCCESS_MESSAGE[3000][locale]
            .replace('{action}', 'takeawayed')
            .replace('{itemName}', currencyName)
            .replace('{playerName}', uid)
            .replace('{quantity}', amount.toString())
            );
          } else {
            await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[3001][locale]
            .replace('{action}', 'takeawayed')
            .replace('{itemName}', currencyName)
            .replace('{playerName}', uid)
            .replace('{quantity}', amount.toString())
            );
          }
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
        await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[103][locale]
          .replace('{detail}', error.message)
        );
      }
    }
  },
};

export default command;
  
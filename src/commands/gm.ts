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

const gmCommand = new SlashCommandBuilder()
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
  );

const command: Command = {
  command: gmCommand as SlashCommandBuilder,
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
  cooldown: 1,
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
            await interaction.reply({
              content: GMUtils.translate('admin:give:success', locale) + uid,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: GMUtils.translate('admin:give:error', locale) + uid,
              ephemeral: true,
            });
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
            await interaction.reply({
              content: `Đã thêm ${currencyName} cho người chơi UID ${uid}`,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: `Lỗi khi thêm ${currencyName} cho người chơi UID ${uid}`,
              ephemeral: true,
            });
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
            await interaction.reply({
              content: `Đã xóa ${currencyName} của người chơi UID ${uid}`,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: `Lỗi khi xóa ${currencyName} của người chơi UID ${uid}`,
              ephemeral: true,
            });
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
      console.error('GM command error:', error);
      await interaction.reply({
        content: GMUtils.translate('error:unknown', locale) + String(error),
        ephemeral: true,
      });
    }
  },
};

export default command;
  
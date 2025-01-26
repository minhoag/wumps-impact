import {
  type AutocompleteInteraction,
  CommandInteraction,
  type Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { Item, type ItemProps } from '../refs/ref.item.ts';
import type { SlashCommand } from '../types';
import { translate } from '../utils.ts';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin command.')
    .setDescriptionLocalization('vi', 'Lệnh dành cho quản trị viên.')
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
              { name: 'Đá sáng thế', value: 'submcoin' },
              { name: 'Mora', value: 'subscoin' },
              { name: 'Nguyên thạch', value: 'subhcoin' },
              { name: 'Tiền Động Tiên', value: 'subhome_coin' },
            ),
        )
        .addNumberOption((option) =>
          option.setName('amount').setDescription('Số lượng'),
        ),
    ),
  autocomplete: async (interaction: AutocompleteInteraction) => {
    /** Give item to player **/
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
    }
  },
  cooldown: 1,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) return;
    // code here
    const uuid: string = new Date().getTime().toString();
    const locale: Locale = interaction.locale;
    if (interaction.options.getSubcommand() === 'give') {
      /** Get params**/
      const uid: string = interaction.options.getString('uid', true);
      const id: string = interaction.options.getString('id', true);
      const amount: number = interaction.options.getNumber('amount') ?? 1;
      /** Give item **/
      try {
        await fetch(
          `http://localhost:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1116&uid=${uid}&msg=item%20add%20${id}%20${amount}`,
        );
        await interaction.reply({
          content: translate({ message: 'admin:give:success', locale: locale }),
          flags: 'Ephemeral',
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          await interaction.reply({
            content: translate({ message: 'admin:give:error', locale: locale }),
            flags: 'Ephemeral',
          });
        } else {
          await interaction.reply({
            content: translate({ message: 'error:unknown', locale: locale }),
            flags: 'Ephemeral',
          });
        }
      }
    } else if (interaction.options.getSubcommand() === 'delete') {
      const uid: string = interaction.options.getString('uid', true);
      const id: string = interaction.options.getString('id', true);
      const amount: number = interaction.options.getNumber('amount') ?? 1;
      try {
        await fetch(
          `http://localhost:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1116&uid=${uid}&msg=item%20clear%20${id}%20${amount}`,
        );
        await interaction.reply({
          content:
            translate({ message: 'admin:delete:success', locale: locale }) +
            ` ${uid}`,
          flags: 'Ephemeral',
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          await interaction.reply({
            content: translate({
              message: 'admin:delete:error',
              locale: locale,
            }),
            flags: 'Ephemeral',
          });
        } else {
          await interaction.reply({
            content:
              translate({ message: 'error:unknown', locale: locale }) +
              ' ' +
              error,
            flags: 'Ephemeral',
          });
        }
      }
    } else if (interaction.options.getSubcommand() === 'transfer') {
      const uid = interaction.options.getString('uid', true);
      const type = interaction.options.getString('type', true);
      const amount = interaction.options.getNumber('amount') ?? 1;
      const name: { [key: string]: string } = {
        mcoin: 'Đá sáng thế',
        scoin: 'Mora',
        hcoin: 'Nguyên thạch',
        home_coin: 'Tiền Động Tiên',
      };
      await fetch(
        `http://localhost:14861/api?region=dev_gio&ticket=GM&cmd=1116&uid=${uid}&msg=${type}%20${amount}`,
      );
      await interaction.reply({
        content: `Đã thêm ${name[type]} cho người chơi UID ${uid}`,
        flags: 'Ephemeral',
      });
    } else if (interaction.options.getSubcommand() === 'takeaway') {
      const uid = interaction.options.getString('uid', true);
      const type = interaction.options.getString('type', true);
      const amount = interaction.options.getNumber('amount') ?? 1;
      const name: { [key: string]: string } = {
        submcoin: 'Đá sáng thế',
        subscoin: 'Mora',
        subhcoin: 'Nguyên thạch',
        subhome_coin: 'Tiền Động Tiên',
      };
      await fetch(
        `http://localhost:14861/api?region=dev_gio&ticket=GM&cmd=1116&uid=${uid}&msg=${type}%20${amount}`,
      );
      await interaction.reply({
        content: `Đã xóa ${name[type]} của người chơi UID ${uid}`,
        flags: 'Ephemeral',
      });
    }
  },
};

export default command;

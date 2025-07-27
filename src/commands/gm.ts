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
  MessageFlags,
} from 'discord.js';

import { Item, type ItemProps } from '../data/item';
import type { Command } from '../type';
import { GMUtils } from '../utils/gm-utils';
import { DiscordResponse } from '@/utils/discord-utils';
import { ERROR_MESSAGE } from '@/constant';
import { DiscordException } from '@/exception';
import { ARTIFACT_DATA, type ArtifactProps } from '@/data/artifact';
import { SUBSTAT_NAMES } from '@/constant/artifact';

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
          option.setName('uid').setDescription('UID của người chơi').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('Id của item')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addNumberOption((option) => option.setName('amount').setDescription('Số lượng')),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Take away item from player.')
        .setDescriptionLocalization('vi', 'Xóa item của người chơi.')
        .addStringOption((option) =>
          option.setName('uid').setDescription('UID của người chơi').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('Id của item')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addNumberOption((option) => option.setName('amount').setDescription('Số lượng')),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('transfer')
        .setDescription('Give money to player.')
        .setDescriptionLocalization('vi', 'Gửi tiền cho người chơi.')
        .addStringOption((option) =>
          option.setName('uid').setDescription('UID của người chơi').setRequired(true),
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
        .addNumberOption((option) => option.setName('amount').setDescription('Số lượng')),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('give-artifact')
        .setDescription('Give artifact to player.')
        .setDescriptionLocalization('vi', 'Gửi thánh di vật cho người chơi.')
        .addStringOption((option) =>
          option.setName('uid').setDescription('UID của người chơi').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('Id của artifact')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((option) =>
          option
            .setName('main-prop-id')
            .setDescription('Main stat của artifact')
            .setRequired(true)
            .addChoices(
              { name: 'Crit Rate', value: '30960' },
              { name: 'Crit Damage', value: '30950' },
              { name: 'Healing Bonus', value: '30940' },
              { name: 'ATK %', value: '50990' },
              { name: 'HP %', value: '50980' },
              { name: 'DEF %', value: '50970' },
              { name: 'Elemental Mastery', value: '50880' },
              { name: 'Pyro DMG Bonus', value: '50960' },
              { name: 'Electro DMG Bonus', value: '50950' },
              { name: 'Cryo DMG Bonus', value: '50940' },
              { name: 'Hydro DMG Bonus', value: '50930' },
              { name: 'Anemo DMG Bonus', value: '50920' },
              { name: 'Geo DMG Bonus', value: '50910' },
              { name: 'Dendro DMG Bonus', value: '50900' },
              { name: 'Physical DMG Bonus', value: '50890' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('substat1')
            .setDescription('Substat 1 (tùy chọn)')
            .setRequired(false)
            .addChoices(
              { name: 'Crit Rate', value: '501204' },
              { name: 'Crit Damage', value: '501224' },
              { name: 'Elemental Mastery', value: '501244' },
              { name: 'ATK %', value: '501064' },
              { name: 'HP %', value: '501034' },
              { name: 'DEF %', value: '501094' },
              { name: 'ATK', value: '501054' },
              { name: 'HP', value: '501024' },
              { name: 'DEF', value: '501084' },
              { name: 'Energy Recharge', value: '501234' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('substat2')
            .setDescription('Substat 2 (tùy chọn)')
            .setRequired(false)
            .addChoices(
              { name: 'Crit Rate', value: '501204' },
              { name: 'Crit Damage', value: '501224' },
              { name: 'Elemental Mastery', value: '501244' },
              { name: 'ATK %', value: '501064' },
              { name: 'HP %', value: '501034' },
              { name: 'DEF %', value: '501094' },
              { name: 'ATK', value: '501054' },
              { name: 'HP', value: '501024' },
              { name: 'DEF', value: '501084' },
              { name: 'Energy Recharge', value: '501234' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('substat3')
            .setDescription('Substat 3 (tùy chọn)')
            .setRequired(false)
            .addChoices(
              { name: 'Crit Rate', value: '501204' },
              { name: 'Crit Damage', value: '501224' },
              { name: 'Elemental Mastery', value: '501244' },
              { name: 'ATK %', value: '501064' },
              { name: 'HP %', value: '501034' },
              { name: 'DEF %', value: '501094' },
              { name: 'ATK', value: '501054' },
              { name: 'HP', value: '501024' },
              { name: 'DEF', value: '501084' },
              { name: 'Energy Recharge', value: '501234' },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('substat4')
            .setDescription('Substat 4 (tùy chọn)')
            .setRequired(false)
            .addChoices(
              { name: 'Crit Rate', value: '501204' },
              { name: 'Crit Damage', value: '501224' },
              { name: 'Elemental Mastery', value: '501244' },
              { name: 'ATK %', value: '501064' },
              { name: 'HP %', value: '501034' },
              { name: 'DEF %', value: '501094' },
              { name: 'ATK', value: '501054' },
              { name: 'HP', value: '501024' },
              { name: 'DEF', value: '501084' },
              { name: 'Energy Recharge', value: '501234' },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('send-mail')
        .setDescription('Send mail to all players.')
        .setDescriptionLocalization('vi', 'Gửi mail cho tất cả người chơi.'),
    ),
  cooldown: 1,
  defer: false,
  autocomplete: async (
    interaction: AutocompleteInteraction,
  ): Promise<ApplicationCommandOptionChoiceData[]> => {
    const focusedOption = interaction.options.getFocused(true);
    if (
      interaction.options.getSubcommand() === 'give' ||
      interaction.options.getSubcommand() === 'delete'
    ) {
      const filtered: { value: string; name: string }[] = Item.filter((choice: ItemProps) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
      );
      const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
      await interaction.respond(options);
      return options;
    } else if (interaction.options.getSubcommand() === 'give-artifact') {
      //-- Filter artifact data by name --
      const filtered: { name: string; value: string }[] = ARTIFACT_DATA.filter(
        (choice: ArtifactProps) =>
          choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
      );
      //-- Limit the number of options to 25 --
      const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
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
        //--- Give item ---
        case 'give': {
          const uid: string = interaction.options.getString('uid', true);
          const id: string = interaction.options.getString('id', true);
          const amount: number = interaction.options.getNumber('amount') ?? 1;
          const result = await GMUtils.giveItem(interaction, {
            uid,
            id,
            amount,
          });
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          await DiscordResponse.sendApiResponse(interaction, result);
          break;
        }
        //--- Delete item ---
        case 'delete': {
          const uid: string = interaction.options.getString('uid', true);
          const id: string = interaction.options.getString('id', true);
          const amount: number = interaction.options.getNumber('amount') ?? 1;

          const result = await GMUtils.deleteItem(interaction, {
            uid,
            id,
            amount,
          });
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          await DiscordResponse.sendApiResponse(interaction, result);
          break;
        }
        //--- Give artifact ---
        case 'give-artifact': {
          const uid: string = interaction.options.getString('uid', true);
          const id: string = interaction.options.getString('id', true);
          const mainPropId: string = interaction.options.getString('main-prop-id', true);

          const substats: string[] = [];
          const substatNames: string[] = [];
          let duplicateFound = false;
          let duplicateName = '';

          for (const n of ['substat1', 'substat2', 'substat3', 'substat4']) {
            const val = interaction.options.getString(n);
            if (val) {
              const displayName = SUBSTAT_NAMES[parseInt(val)] || val;

              if (substatNames.includes(displayName)) {
                duplicateFound = true;
                duplicateName = displayName;
                break;
              }
              substats.push(val);
              substatNames.push(displayName);
            }
          }

          if (duplicateFound) {
            await DiscordResponse.sendFailed(
              interaction,
              ERROR_MESSAGE[302][locale].replace(
                '{reason}',
                duplicateName,
              ),
            );
            break;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const result = await GMUtils.createArtifact(interaction, {
            uid,
            itemId: id,
            mainPropId,
            level: 1, // Always level 1
            appendPropIdList: substats,
          });

          await DiscordResponse.sendApiResponse(interaction, result);
          break;
        }
        case 'send-mail': {
          const modal = new ModalBuilder().setCustomId('mailForm').setTitle('Soạn thư gửi');

          const receiver = new TextInputBuilder()
            .setCustomId('receiverInput')
            .setLabel('Người nhận (UID hoặc "all" cho tất cả)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Nhập UID cụ thể hoặc "all" để gửi cho tất cả người chơi')
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

          const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(receiver);
          const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(title);
          const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(content);
          const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(expiry);
          const fifthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(item);

          modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);
          await interaction.showModal(modal);
          break;
        }

        default:
          await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[103][locale]);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      } else if (error instanceof DiscordException) {
        await DiscordResponse.sendFailed(interaction, error.message);
      }
    }
  },
};

export default command;

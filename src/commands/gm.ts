import {
  type AutocompleteInteraction,
  CommandInteraction,
  Locale,
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
import { API_MESSAGE, DICT, ERROR_MESSAGE } from '@/constant';
import { DiscordException } from '@/exception';
import { ARTIFACT_COMPONENT, ARTIFACT_DATA, type ArtifactProps } from '@/data/artifact';
import { SUBSTAT_NAMES } from '@/constant/artifact';

const command: Command = {
  command: new SlashCommandBuilder()
    .setName('gm')
    .setDescription('GM admin command.')
    .setDescriptionLocalization(Locale["Vietnamese"], 'Lệnh dành cho quản trị viên GM.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('give')
        .setDescription('Give item to player.')
        .setDescriptionLocalization(Locale["Vietnamese"], 'Gửi item cho người chơi.')
        .addStringOption((option) =>
          option.setName('uid').setDescription('UID của người chơi').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('Item name')
            .setDescriptionLocalization(Locale["Vietnamese"], 'Tên item')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addNumberOption((option) => option.setName('amount').setDescription('Số lượng')),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete item from player.')
        .setDescriptionLocalization(Locale["Vietnamese"], 'Xóa item của người chơi.')
        .addStringOption((option) =>
          option.setName('uid').setDescription('UID của người chơi').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('Item name')
            .setDescriptionLocalization(Locale["Vietnamese"], 'Tên item')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addNumberOption((option) => option.setName('amount').setDescription('Số lượng')),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('give-artifact')
        .setDescription('Give artifact to player.')
        .setDescriptionLocalization(Locale["Vietnamese"], 'Gửi thánh di vật cho người chơi.')
        .addStringOption((option) =>
          option.setName('uid').setDescription('UID của người chơi').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('Artifact name')
            .setDescriptionLocalization(Locale["Vietnamese"], 'Tên thánh di vật')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((option) =>
          option
            .setName('main-prop-id')
            .setDescription('Artifact main stats')
            .setDescriptionLocalization(Locale["Vietnamese"], 'Main stat của thánh di vật')
            .setRequired(true)
            .addChoices(
              // Flower/Plume only
              { name: 'HP (Flower only)', value: '50980' },
              { name: 'ATK (Plume only)', value: '50990' },
              // Sands options
              { name: 'ATK % (Sands/Goblet/Circlet)', value: '50064' },
              { name: 'HP % (Sands/Goblet/Circlet)', value: '50034' },
              { name: 'DEF % (Sands/Goblet/Circlet)', value: '50094' },
              { name: 'Elemental Mastery (Sands/Goblet/Circlet)', value: '50244' },
              { name: 'Energy Recharge (Sands only)', value: '50234' },
              // Goblet elemental damage options
              { name: 'Pyro DMG Bonus (Goblet only)', value: '50144' },
              { name: 'Electro DMG Bonus (Goblet only)', value: '50154' },
              { name: 'Cryo DMG Bonus (Goblet only)', value: '50164' },
              { name: 'Hydro DMG Bonus (Goblet only)', value: '50174' },
              { name: 'Anemo DMG Bonus (Goblet only)', value: '50184' },
              { name: 'Geo DMG Bonus (Goblet only)', value: '50194' },
              { name: 'Dendro DMG Bonus (Goblet only)', value: '50214' },
              { name: 'Physical DMG Bonus (Goblet only)', value: '50134' },
              // Circlet crit options
              { name: 'Crit Rate (Circlet only)', value: '50204' },
              { name: 'Crit Damage (Circlet only)', value: '50224' },
              { name: 'Healing Bonus (Circlet only)', value: '50254' }
            ),
        )
        .addStringOption((option) =>
          option
            .setName('substat1')
            .setDescription('Substat 1')
            .setDescriptionLocalization(Locale["Vietnamese"], 'Dòng phụ 1')
            .setRequired(true)
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
            .setDescription('Substat 2')
            .setDescriptionLocalization(Locale["Vietnamese"], 'Dòng phụ 2')
            .setRequired(true)
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
            .setDescription('Substat 3')
            .setDescriptionLocalization(Locale["Vietnamese"], 'Dòng phụ 3')
            .setRequired(true)
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
            .setDescription('Substat 4')
            .setDescriptionLocalization(Locale["Vietnamese"], 'Dòng phụ 4')
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
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'give' || subcommand === 'delete') {
      const filtered: { value: string; name: string }[] = Item.filter((choice: ItemProps) =>
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
      );
      const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
      await interaction.respond(options);
      return options;
    }

    else if (subcommand === 'give-artifact') {
      const filtered: { name: string; value: string }[] = ARTIFACT_DATA.filter(
        (choice: ArtifactProps) => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
      );

      const expandedOptions: { name: string; value: string }[] = [];
      filtered.forEach(artifact => {
        const setId = artifact.value;
        const components = ARTIFACT_COMPONENT[setId];

        if (components) {
          expandedOptions.push({ name: `${artifact.name} - Flower`, value: components[0].toString() });
          expandedOptions.push({ name: `${artifact.name} - Plume`, value: components[1].toString() });
          expandedOptions.push({ name: `${artifact.name} - Sands`, value: components[2].toString() });
          expandedOptions.push({ name: `${artifact.name} - Goblet`, value: components[3].toString() });
          expandedOptions.push({ name: `${artifact.name} - Circlet`, value: components[4].toString() });
        }
      });

      const options = expandedOptions.length > 25 ? expandedOptions.slice(0, 25) : expandedOptions;
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
          const id: string = interaction.options.getString('name', true);
          const amount: number = interaction.options.getNumber('amount') ?? 1;
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const result = await GMUtils.giveItem(interaction, {
            uid,
            id,
            amount,
          });
          const retcode: number = result.retcode;
          if (result.success) {
            await DiscordResponse.sendSuccess(interaction, API_MESSAGE[retcode][locale].replace('{desc}', DICT['item_add'][locale]));
          } else {
            await DiscordResponse.sendFailed(interaction, API_MESSAGE[retcode][locale].replace('{desc}', result.msg));
          }
          break;
        }
        //--- Delete item ---
        case 'delete': {
          const uid: string = interaction.options.getString('uid', true);
          const id: string = interaction.options.getString('name', true);
          const amount: number = interaction.options.getNumber('amount') ?? 1;
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const result = await GMUtils.deleteItem(interaction, {
            uid,
            id,
            amount,
          });
          const retcode: number = result.retcode;
          if (result.success) {
            await DiscordResponse.sendSuccess(interaction, API_MESSAGE[retcode][locale].replace('{desc}', DICT['item_remove'][locale]));
          } else {
            await DiscordResponse.sendFailed(interaction, API_MESSAGE[retcode][locale]);
          }
          break;
        }
        //--- Give artifact ---
        case 'give-artifact': {
          const uid: string = interaction.options.getString('uid', true);
          const id: string = interaction.options.getString('name', true);
          const mainPropId: string = interaction.options.getString('main-prop-id', true);

          const substats: string[] = [];
          const substatNames: string[] = [];
          let duplicateFound = false;
          let duplicateName = '';

          for (const n of ['substat1', 'substat2', 'substat3', 'substat4']) {
            const val = interaction.options.getString(n);
            if (val) {
              const displayName = SUBSTAT_NAMES[parseInt(val)] || val;
              if (substatNames.includes(mainPropId)) {
                duplicateFound = true;
                duplicateName = displayName;
                break;
              } else if (substatNames.includes(displayName)) {
                duplicateFound = true;
                duplicateName = displayName;
                break;
              } else if (substatNames.length >= 4) {
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
            level: 1,
            appendPropIdList: substats,
          });
          const retcode: number = result.retcode;
          if (result.success) {
            await DiscordResponse.sendSuccess(interaction, API_MESSAGE[retcode][locale].replace('{desc}', result.msg));
          } else {
            await DiscordResponse.sendFailed(interaction, API_MESSAGE[retcode][locale]);
          }
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

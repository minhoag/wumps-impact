import dayjs from 'dayjs';
import {
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { prisma_config } from '../prisma/prisma';
import { schedule } from '../refs/ref.schedule';
import { GachaDatabase, SlashCommand } from '../types';
import { embeds, translate } from '../utils';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Create a new limited event.')
    .setDescriptionLocalization('vi', 'Khởi chạy sự kiện giới hạn.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addNumberOption((option) =>
      option
        .setName('type')
        .setDescription(
          'Type of Gacha (must be unique and MUST BE accurate).',
        )
        .setDescriptionLocalization(
          'vi',
          'Phân loại (không được trùng lặp).',
        )
        .setRequired(true)
        .addChoices(
          { name: 'Character 1', value: 301 },
          { name: 'Character 2', value: 400 },
          { name: 'Weapon 1', value: 426 },
          { name: 'Weapon 2', value: 302 },
        ),
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription(
          'Event name. Must be unique and MUST BE accurate.',
        )
        .setDescriptionLocalization(
          'vi',
          'Tên sự kiện. Không được trùng lặp.',
        )
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addNumberOption((option) =>
      option
        .setName('enable')
        .setDescription('Start the event immediately?')
        .setDescriptionLocalization('vi', 'Bắt đầu ngay?')
        .setRequired(true)
        .addChoices(
          { name: 'Yes', value: 1 },
          { name: 'No', value: 0 },
        ),
    )
    .addStringOption((option) =>
      option
        .setName('start')
        .setDescription('Time to start event. Default: Today.')
        .setDescriptionLocalization(
          'vi',
          'Thời gian bắt đầu sự kiện. Mặc định: Hôm nay.',
        ),
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration of event. Default: 2 weeks.')
        .setDescriptionLocalization(
          'vi',
          'Thời gian kéo dài sự kiện. Mặc định: 2 tuần.',
        ),
    ),
  cooldown: 1,
  autocomplete: async (interaction) => {
    const locale = interaction.locale;
    const focusedOption = interaction.options.getFocused(true);
    const choices = schedule.map((item: any) => {
      const weapon: boolean = item.bannerType.includes('WEAPON');
      if (locale === 'vi') {
        return {
          name: weapon
            ? item.vietnameseName.length > 0
              ? 'Vũ khí: ' + item.vietnameseName
              : 'Vũ khí: ' + item.globalName
            : item.vietnameseName.length > 0
              ? 'Nhân vật: ' + item.vietnameseName
              : 'Nhân vật: ' + item.globalName,
          value: item.value,
        };
      }
      return {
        name: weapon
          ? 'Weapon: ' + item.globalName
          : 'Character: ' + item.globalName,
        value: item.value,
      };
    });
    const filtered: {
      name: string;
      value: string;
    }[] = choices.filter((choice: any) =>
      choice.name.includes(focusedOption.value),
    );
    const options =
      filtered.length > 25 ? filtered.slice(0, 25) : filtered;
    await interaction.respond(options);
  },
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) return;
    /** Capture params input **/
    const name: string = interaction.options.getString('name', true);
    const enable: number = interaction.options.getNumber(
      'enable',
      true,
    );
    const start: string = interaction.options.getString('start')
      ? dayjs(interaction.options.getString('start'))
          .startOf('day')
          .toISOString()
      : dayjs().startOf('day').toISOString();
    const gachaType: number = interaction.options.getNumber(
      'type',
      true,
    );
    const duration: number =
      interaction.options.getNumber('duration') ?? 2;
    /** Calculate end time **/
    const end: string = interaction.options.getString('end')
      ? dayjs(interaction.options.getString('end')).toISOString()
      : dayjs(start).add(duration, 'w').toISOString();
    /** Locale **/
    const locale = interaction.locale;
    /** Process data **/
    const data = schedule.find((item) => item.value === name);
    if (!data) return;
    /** Send response**/
    if (!data) {
      const notfound = embeds.setDescription(
        translate({
          message: 'event:notfound',
          locale,
        }),
      );
      return interaction.reply({ embeds: [notfound] });
    }
    /** Defer reply first **/
    await interaction.deferReply({ ephemeral: true });
    /** Finalize data **/
    const finalized: GachaDatabase = {
      gacha_type: gachaType,
      begin_time: start,
      end_time: end,
      cost_item_id: 223,
      cost_item_num: 1,
      gacha_pool_id: 201,
      gacha_prob_rule_id: data.bannerType === 'WEAPON' ? 2 : 1,
      gacha_up_config: `{"gacha_up_list":[{"item_parent_type":1,"prob":${
        data.bannerType === 'WEAPON' ? '750' : '500'
      },"item_list":[${data.rateUpItems5.toString()}]},{"item_parent_type":2,"prob":500,"item_list":[${data.rateUpItems4.toString()}]}]}`,
      gacha_rule_config: '{}',
      gacha_prefab_path: data.prefabPath,
      gacha_preview_prefab_path: `UI_Tab_${data.prefabPath}`,
      gacha_prob_url: '',
      gacha_record_url: '',
      gacha_prob_url_oversea: '',
      gacha_record_url_oversea: '',
      gacha_sort_id: data.bannerType === 'WEAPON' ? 3 : 982,
      enabled: enable,
      title_textmap:
        data.bannerType === 'WEAPON'
          ? 'UI_GACHA_SHOW_PANEL_A020_TITLE'
          : data.titlePath,
      display_up4_item_list: data.rateUpItems4,
    };
    /** Validate data **/
    try {
      await prisma_config.t_gacha_schedule_config.create({
        data: finalized,
      });
    } catch (error: any) {
      const unknown: string = translate({
        message: 'error:unknown',
        locale,
      });
      embeds.setTitle(unknown);
      embeds.setDescription(error.message);
      return interaction.editReply({ embeds: [embeds] });
    }
    const success = embeds.setDescription(
      translate({
        message: 'event:success',
        locale,
      }),
    );
    return interaction.editReply({ embeds: [success] });
  },
};

export default command;

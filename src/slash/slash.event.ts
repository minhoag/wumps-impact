import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ActionRowBuilder,
  type AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction, DiscordAPIError,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

import { prisma_config } from '../prisma/prisma';
import { schedule } from '../refs/ref.schedule';
import type { GachaDatabase, SlashCommand } from '../types';
import { checkSupplyTime, embeds, translate } from '../utils';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage limited events.')
    .setDescriptionLocalization('vi', 'Quản lý sự kiện giới hạn.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Create a new limited event.')
        .setDescriptionLocalization('vi', 'Tạo sự kiện giới hạn mới.')
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
              { name: 'Weapon 1', value: 202 },
              { name: 'Weapon 2', value: 302 },
            ),
        )
        .addStringOption((option) =>
          option
            .setName('name')
            .setDescription('Event name. Must be unique and MUST BE accurate.')
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
            .addChoices({ name: 'Yes', value: 1 }, { name: 'No', value: 0 }),
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a created limited event.')
        .setDescriptionLocalization('vi', 'Xóa sự kiện giới hạn đã tạo.'),
    ),
  cooldown: 1,
  // Autocomplete handler for the command
  autocomplete: async (interaction: AutocompleteInteraction) => {
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
      choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
    );
    const options = filtered.length > 25 ? filtered.slice(0, 25) : filtered;
    await interaction.respond(options);
  },
  // Execute handler for the command
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) return;
    /**
     * Start event
     * **/
    if (interaction.options.getSubcommand() === 'add') {
      // Capture params input
      const name: string = interaction.options.getString('name', true);
      const enable: number = interaction.options.getNumber('enable', true);
      const start: string = interaction.options.getString('start')
        ? dayjs(interaction.options.getString('start'))
            .startOf('day')
            .toISOString()
        : dayjs().startOf('day').toISOString();
      const gachaType: number = interaction.options.getNumber('type', true);
      const duration: number = interaction.options.getNumber('duration') ?? 2;
      // Calculate end time
      const end: string = interaction.options.getString('end')
        ? dayjs(interaction.options.getString('end')).toISOString()
        : dayjs(start).add(duration, 'w').toISOString();
      // Locale
      const locale = interaction.locale;
      // Process data
      const data = schedule.find((item) => item.value === name);
      if (!data) return;
      // Send response
      if (!data) {
        const notfound = embeds.setDescription(
          translate({
            message: 'event:notfound',
            locale,
          }),
        );
        return interaction.reply({ embeds: [notfound] });
      }
      // Defer reply first
      await interaction.deferReply({ flags: 'Ephemeral' });
      // Finalize data
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
      // Validate data
      try {
        await prisma_config.t_gacha_schedule_config.create({
          data: finalized,
        });
        embeds.setTitle('Success')
        const success = embeds.setDescription(
          translate({
            message: 'event:success',
            locale,
          }),
        );
        return interaction.editReply({ embeds: [success] });
      } catch (error: any) {
        const unknown: string = translate({
          message: 'error:unknown',
          locale,
        });
        embeds.setTitle(unknown);
        embeds.setDescription(error.message);
        return interaction.editReply({ embeds: [embeds] });
      }
    } else if (interaction.options.getSubcommand() === 'remove') {
      /**
       * Remove active event
       * **/
      // Defer reply first
      await interaction.deferReply({ flags: 'Ephemeral' });
      // Fetch all events
      const events = await prisma_config.t_gacha_schedule_config.findMany();
      if (!events) return interaction.editReply('No events found.');
      // Create select menu
      const select = new StringSelectMenuBuilder()
        .setCustomId('end')
        .setPlaceholder('Make a selection!');
      events.map((event: any): StringSelectMenuBuilder => {
        const label = schedule.find(
          (item: any) => item.prefabPath === event.gacha_prefab_path,
        );
        if (!label) return select;
        // Add options, dayjs is used to calculate time from now
        dayjs.extend(relativeTime);
        return select.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(`${label.gachaType}. ${label.globalName}`)
            .setDescription('Time: ' + checkSupplyTime(event.end_time))
            .setValue(event.schedule_id.toString()),
        );
      });
      // Create row
      const row: ActionRowBuilder<any> = new ActionRowBuilder().addComponents(
        select,
      );
      // Create embeds
      embeds.setTitle('Currently active events');
      embeds.setDescription('Select a currently active event to end it.');
      embeds.setFooter({ text: 'Manage Event' });
      // Send reply with select menu and row and embeds
      await interaction.editReply({
        embeds: [embeds],
        components: [row],
      });
      // Create filter base on user id
      const filter = (i: any) => i.user.id === interaction.user.id;
      // Fetch reply
      const fetchReply = await interaction.fetchReply();
      try {
        // Create collector for select menu
        const collector = fetchReply.createMessageComponentCollector({
          filter,
          time: 120_000,
        });
        // On collect
        collector.on('collect', async (i: any) => {
          // Create new embed
          const newEmbed = new EmbedBuilder()
            .setTitle('Confirmation')
            .setDescription('Do you want to remove this event?');
          // Create buttons
          const confirm = new ButtonBuilder()
            .setCustomId('confirm_remove')
            .setLabel('Confirm Remove')
            .setStyle(ButtonStyle.Success);
          const cancel = new ButtonBuilder()
            .setCustomId('cancel_remove')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);
          // Create row with buttons
          const row = new ActionRowBuilder().addComponents(cancel, confirm);
          // Send reply with new embed and row
          const interactionWithButtonRow = await i.reply({
            embeds: [newEmbed],
            components: [row],
            flags: 'Ephemeral',
            withResponse: true,
          })
          // Create filter for button collector
          const buttonCollector= (i: CommandInteraction) => i.user.id === interaction.user.id;
          const confirmation = await interactionWithButtonRow.resource.message.awaitMessageComponent({ filter: buttonCollector, time: 120_000 });
          if (confirmation.customId === 'confirm_remove') {
            await prisma_config.t_gacha_schedule_config.delete({
              where: {
                schedule_id: Number(i.values[0])
              }
            })
            newEmbed.setTitle('Success')
            newEmbed.setDescription(`Event Id: ${i.values[0]} delete successfully`)
            await confirmation.update({ components: [], embeds: [newEmbed] });
          } else if (confirmation.customId === 'cancel_remove') {
            newEmbed.setTitle('Cancel')
            newEmbed.setDescription('Action cancelled')
            await confirmation.update({ components: [], embeds: [newEmbed] });
          }
        });
      } catch (error: unknown) {
        // If no confirmation is received within 45s, cancel the action
        if(error instanceof Error) {
          await interaction.editReply({
            content: error.message,
            components: [],
            embeds: [],
          });
        } else if (error instanceof DiscordAPIError) {
          await interaction.editReply({
            content: 'Confirmation not received within 1 minute, cancelling',
            components: [],
            embeds: [],
          });
        } else console.log(error);
      }
    }
  },
};

export default command;

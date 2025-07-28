import {
  ChatInputCommandInteraction,
  Locale,
  SlashCommandBuilder,
  AutocompleteInteraction,
  type ApplicationCommandOptionChoiceData,
  PermissionFlagsBits,
} from 'discord.js';
import { DiscordResponse } from '@/utils/discord-utils';
import { DiscordPrisma } from '@/utils/prisma-utils';
import { parseTimeRange } from '@/utils/utils';
import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constant/response';
import { GachaUtils } from '@/utils/gacha-utils';
import type { GachaScheduleData } from '@/interface';
import { format } from 'date-fns';
import type { Command } from '@/type';
import type { t_discord_gacha_schedule } from '@prisma-discord/client';

const GACHA_TYPE = { WEAPON: [302, 202], EVENT: [301, 400] };

const Gacha: Command = {
  command: new SlashCommandBuilder()
    .setName('gacha')
    .setDescription('Manage gacha schedules')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescriptionLocalizations({
      [Locale.Vietnamese]: 'Quản lý lịch trình gacha',
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a new gacha schedule')
        .setDescriptionLocalizations({
          [Locale.Vietnamese]: 'Tạo lịch trình gacha mới',
        })
        .addStringOption((option) =>
          option
            .setName('value')
            .setDescription('Event item value (e.g. 15509)')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((option) =>
          option
            .setName('start')
            .setDescription('ISO start time, e.g. 2024-08-01T00:00:00Z')
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName('end')
            .setDescription('ISO end time, e.g. 2024-08-15T00:00:00Z')
            .setRequired(false),
        )
        .addNumberOption((option) =>
          option
            .setName('enabled')
            .setDescription('Start the gacha now?')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Bắt đầu sự kiện ngay?',
            })
            .addChoices(
              {
                name: 'Yes',
                value: 1,
                name_localizations: { [Locale.Vietnamese]: 'Có' },
              },
              {
                name: 'No',
                value: 0,
                name_localizations: { [Locale.Vietnamese]: 'Không' },
              },
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('update')
        .setDescription('Update an existing gacha schedule')
        .setDescriptionLocalizations({
          [Locale.Vietnamese]: 'Cập nhật lịch trình gacha',
        })
        .addIntegerOption((option) =>
          option
            .setName('schedule_id')
            .setDescription('Schedule ID to update')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((option) =>
          option
            .setName('start')
            .setDescription('ISO start time, e.g. 2024-08-01T00:00:00Z')
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName('end')
            .setDescription('ISO end time, e.g. 2024-08-15T00:00:00Z')
            .setRequired(false),
        )
        .addNumberOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable the gacha')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Bật hoặc tắt gacha',
            })
            .addChoices(
              {
                name: 'Yes',
                value: 1,
                name_localizations: { [Locale.Vietnamese]: 'Có' },
              },
              {
                name: 'No',
                value: 0,
                name_localizations: { [Locale.Vietnamese]: 'Không' },
              },
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete a gacha schedule')
        .setDescriptionLocalizations({
          [Locale.Vietnamese]: 'Xóa lịch trình gacha',
        })
        .addIntegerOption((option) =>
          option
            .setName('schedule_id')
            .setDescription('Schedule ID to delete')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    ),
  cooldown: 5,
  defer: true,
  autocomplete: async (
    interaction: AutocompleteInteraction,
  ): Promise<ApplicationCommandOptionChoiceData[]> => {
    const subcommand = interaction.options.getSubcommand();
    const focusedOption = interaction.options.getFocused(true);

    // Autocomplete for 'value' option in 'create' subcommand
    if (subcommand === 'create' && focusedOption.name === 'value') {
      const search = (focusedOption.value as string) || '';
      const isVietnamese =
        interaction.locale === Locale.Vietnamese || interaction.locale.startsWith('vi');
      const allBanners: any[] = interaction.client.gacha_data || [];
      const banners = allBanners
        .filter((b) => {
          return (
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.vietnameseName?.toLowerCase().includes(search.toLowerCase())
          );
        })
        .slice(0, 25);
      const choices: ApplicationCommandOptionChoiceData[] = banners.map((b: any) => {
        const name = isVietnamese && b.vietnameseName ? b.vietnameseName : b.name;
        const choice = { name: name, value: String(b.value) };
        return choice;
      });
      await interaction.respond(choices);
      return choices;
    }

    //--- Delete are update gacha schedule ---
    if (
      (subcommand === 'update' || subcommand === 'delete') &&
      focusedOption.name === 'schedule_id'
    ) {
      const search = (focusedOption.value as string) || '';
      const isVietnamese =
        interaction.locale === Locale.Vietnamese || interaction.locale.startsWith('vi');
      const gachaSchedules: t_discord_gacha_schedule[] = interaction.client.gacha_schedule || [];
      const filteredSchedules = gachaSchedules
        .filter((schedule: t_discord_gacha_schedule) => {
          // Find the corresponding gacha data to get the name
          const gachaData = interaction.client.gacha_data?.find(
            (data: any) => data.value === schedule.value,
          );
          const name = gachaData
            ? isVietnamese && gachaData.vietnameseName
              ? gachaData.vietnameseName
              : gachaData.name
            : schedule.value;
          const haystack = `${name} ${schedule.type} ${name}`.toLowerCase();
          return haystack.includes(search.toLowerCase());
        })
        .slice(0, 25);

      const choices: ApplicationCommandOptionChoiceData[] = filteredSchedules.map(
        (schedule: t_discord_gacha_schedule) => {
          const gachaData = interaction.client.gacha_data?.find(
            (data: any) => data.value === schedule.value,
          );
          const name = gachaData
            ? isVietnamese && gachaData.vietnameseName
              ? gachaData.vietnameseName
              : gachaData.name
            : schedule.value;
          const gachaTypeText =
            schedule.type === 302 || schedule.type === 202 ? 'WEAPON' : 'EVENT';

          return {
            name: `[${gachaTypeText}:${schedule.type}] ${name}`,
            value: schedule.id,
          };
        },
      );

      await interaction.respond(choices);
      return choices;
    }

    await interaction.respond([]);
    return [];
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case 'create':
        await executeCreateGacha(interaction);
        break;
      case 'update':
        await executeUpdateGacha(interaction);
        break;
      case 'delete':
        await executeDeleteGacha(interaction);
        break;
      default:
        await DiscordResponse.sendFailed(interaction, 'Unknown subcommand');
    }
  },
};

async function executeCreateGacha(interaction: ChatInputCommandInteraction) {
  const value = interaction.options.getString('value', true);
  const startTime = interaction.options.getString('start');
  const endTime = interaction.options.getString('end');
  const enabled = interaction.options.getNumber('enabled') ?? 1;

  const start = startTime ? parseTimeRange(startTime) || new Date() : new Date();
  const end = endTime
    ? parseTimeRange(endTime) || new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
    : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

  if (start >= end) {
    await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[201][interaction.locale]);
    return;
  }

  // Get gacha data
  const gachaData = interaction.client.gacha_data.find((gacha) => gacha.value === value);
  if (!gachaData) {
    await DiscordResponse.sendFailed(
      interaction,
      ERROR_MESSAGE[204][interaction.locale].replace('{value}', value),
    );
    return;
  }

  // Determine gacha type
  const eventGachaType = gachaData.bannerType;
  const possibleGachaTypes = eventGachaType === 'WEAPON' ? GACHA_TYPE.WEAPON : GACHA_TYPE.EVENT;
  let selectedGachaType = null;

  // Find available gacha type that doesn't overlap with existing schedules
  for (const gachaType of possibleGachaTypes) {
    const hasOverlap = interaction.client.gacha_schedule.some(
      (schedule) =>
        schedule.type === gachaType && schedule.beginTime < end && schedule.endTime > start,
    );

    if (!hasOverlap) {
      selectedGachaType = gachaType;
      break;
    }
  }

  if (!selectedGachaType) {
    const typeList =
      eventGachaType === 'WEAPON'
        ? GACHA_TYPE.WEAPON.join(' and ')
        : GACHA_TYPE.EVENT.join(' and ');
    await DiscordResponse.sendFailed(
      interaction,
      `All ${eventGachaType.toLowerCase()} gacha types (${typeList}) are already scheduled during this time period`,
    );
    return;
  }

  // Check if this specific item is already scheduled during this time period
  const itemAlreadyScheduled = interaction.client.gacha_schedule.some(
    (schedule) =>
      schedule.type === selectedGachaType && schedule.beginTime < end && schedule.endTime > start,
  );

  if (itemAlreadyScheduled) {
    await DiscordResponse.sendFailed(
      interaction,
      ERROR_MESSAGE[202][interaction.locale].replace('{value}', value),
    );
    return;
  }

  const options: GachaScheduleData = {
    schedule_id: gachaData.scheduleId,
    begin_time: start,
    end_time: end,
    gacha_type: selectedGachaType,
    enabled: enabled,
  };
  const gachaUtils = new GachaUtils(options, gachaData);
  const result = await gachaUtils.create();

  if (result.schedule_id !== 0) {
    const characterName = interaction.client.gacha_data.find((gacha) => gacha.value === value)?.name;
    await DiscordResponse.sendSuccess(
      interaction,
      SUCCESS_MESSAGE[200][interaction.locale]
        .replace('{characterName}', characterName ?? value)
        .replace('{beginTime}', format(start, 'dd/MM/yyyy HH:mm'))
        .replace('{endTime}', format(end, 'dd/MM/yyyy HH:mm')),
    );
    await DiscordPrisma.t_discord_gacha_schedule.create({
      data: {
        id: result.schedule_id,
        name: gachaData.name,
        value: gachaData.value,
        type: selectedGachaType,
        beginTime: start,
        endTime: end,
      },
    });
    interaction.client.gacha_schedule.push({
      id: result.schedule_id,
      name: gachaData.name,
      value: gachaData.value,
      type: selectedGachaType,
      beginTime: start,
      endTime: end,
    });
  } else {
    await DiscordResponse.sendFailed(
      interaction,
      ERROR_MESSAGE[205][interaction.locale].replace('{reason}', result.schedule_id.toString()),
    );
  }
}

async function executeUpdateGacha(interaction: ChatInputCommandInteraction) {
  const scheduleId = interaction.options.getInteger('schedule_id', true);
  const startTime = interaction.options.getString('start');
  const endTime = interaction.options.getString('end');
  const enabled = interaction.options.getNumber('enabled');

  const start = startTime ? parseTimeRange(startTime) : null;
  const end = endTime ? parseTimeRange(endTime) : null;

  if (start && end && start >= end) {
    await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[201][interaction.locale]);
    return;
  }

  const options: GachaScheduleData = {
    schedule_id: scheduleId,
    begin_time: start || new Date(),
    end_time: end || new Date(),
    gacha_type: 0,
    enabled: enabled ?? 1,
  };

  const gachaUtils = new GachaUtils(options, {});
  const result = await gachaUtils.update();

  if (result.schedule_id !== 0) {
    await DiscordResponse.sendSuccess(
      interaction,
      SUCCESS_MESSAGE[200][interaction.locale]
        .replace('{characterName}', scheduleId.toString())
        .replace('{beginTime}', format(start || new Date(), 'dd/MM/yyyy HH:mm'))
        .replace('{endTime}', format(end || new Date(), 'dd/MM/yyyy HH:mm')),
    );
  } else {
    await DiscordResponse.sendFailed(
      interaction,
      ERROR_MESSAGE[205][interaction.locale].replace('{reason}', result.schedule_id.toString()),
    );
  }
}

async function executeDeleteGacha(interaction: ChatInputCommandInteraction) {
  const scheduleId = interaction.options.getInteger('schedule_id', true);

  const options: GachaScheduleData = {
    schedule_id: scheduleId,
    begin_time: new Date(),
    end_time: new Date(),
    gacha_type: 0,
    enabled: 0,
  };

  const gachaUtils = new GachaUtils(options, {});
  const result = await gachaUtils.delete();

  if (result) {
    await DiscordResponse.sendSuccess(
      interaction,
      SUCCESS_MESSAGE[200][interaction.locale].replace('{characterName}', scheduleId.toString()),
    );
    const scheduleIndex = interaction.client.gacha_schedule.findIndex(
      (schedule: any) => schedule.id === scheduleId,
    );
    if (scheduleIndex !== -1) {
      interaction.client.gacha_schedule.splice(scheduleIndex, 1);
    }
  } else {
    await DiscordResponse.sendFailed(
      interaction,
      ERROR_MESSAGE[205][interaction.locale].replace('{reason}', result),
    );
  }
}

export default Gacha;

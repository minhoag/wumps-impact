import {
  ChatInputCommandInteraction,
  Locale,
  SlashCommandBuilder,
  AutocompleteInteraction,
  type ApplicationCommandOptionChoiceData,
  PermissionFlagsBits,
} from 'discord.js';
import { DiscordResponse } from '@/utils/discord-utils';
import { parseTimeRange } from '@/utils/utils';
import { MESSAGE_CODES } from '@/constant/response';
import { Gacha, GachaType } from '@/utils/gacha-utils';
import type { Command } from '@/type';
import type { t_discord_gacha_schedule } from '@prisma-discord/client';
import { DiscordPrisma } from '@/utils/prisma-utils';

const GachaCommand: Command = {
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
        .addNumberOption((option) =>
          option
            .setName('id')
            .setDescription('Gacha value (e.g. 15509)')
            .setRequired(true)
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Giá trị gacha (ví dụ: 15509)',
            })
            .setAutocomplete(true),
        )
        .addNumberOption((option) =>
          option
            .setName('gacha_type')
            .setDescription('Gacha type')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Loại gacha',
            })
            .addChoices(
              {
                name: 'Character 1',
                value: GachaType.CHARACTER_1,
                name_localizations: { [Locale.Vietnamese]: 'Nhân vật 1' },
              },
              {
                name: 'Character 2',
                value: GachaType.CHARACTER_2,
                name_localizations: { [Locale.Vietnamese]: 'Nhân vật 2' },
              },
              {
                name: 'Weapon 1',
                value: GachaType.WEAPON_1,
                name_localizations: { [Locale.Vietnamese]: 'Vũ khí 1' },
              },
              {
                name: 'Weapon 2',
                value: GachaType.WEAPON_2,
                name_localizations: { [Locale.Vietnamese]: 'Vũ khí 2' },
              },
            )
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('start')
            .setDescription('Start time, e.g. 2024-08-01T00:00:00Z')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Thời gian bắt đầu, ví dụ: 2024-08-01T00:00:00Z',
            })
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName('end')
            .setDescription('End time, e.g. 2024-08-15T00:00:00Z')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Thời gian kết thúc, ví dụ: 2024-08-15T00:00:00Z',
            })
            .setRequired(false),
        )
        .addNumberOption((option) =>
          option
            .setName('enabled')
            .setDescription('Start the gacha now? (Yes/No)')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Bắt đầu sự kiện ngay? (Có/Không)',
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
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'ID lịch trình gacha cần cập nhật',
            })
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addNumberOption((option) =>
          option
            .setName('gacha_type')
            .setDescription('Gacha type')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Loại gacha',
            })
            .addChoices(
              {
                name: 'Character 1',
                value: GachaType.CHARACTER_1,
                name_localizations: { [Locale.Vietnamese]: 'Nhân vật 1' },
              },
            )
            .addChoices(
              {
                name: 'Character 2',
                value: GachaType.CHARACTER_2,
                name_localizations: { [Locale.Vietnamese]: 'Nhân vật 2' },
              },
            )
            .addChoices(
              {
                name: 'Weapon 1',
                value: GachaType.WEAPON_1,
                name_localizations: { [Locale.Vietnamese]: 'Vũ khí 1' },
              },
            )
            .addChoices(
              {
                name: 'Weapon 2',
                value: GachaType.WEAPON_2,
                name_localizations: { [Locale.Vietnamese]: 'Vũ khí 2' },
              },
            )
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('start')
            .setDescription('Start time, e.g. 2024-08-01T00:00:00Z')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Thời gian bắt đầu, ví dụ: 2024-08-01T00:00:00Z',
            })
            .setRequired(false),
        )
        .addStringOption((option) =>
          option
            .setName('end')
            .setDescription('End time, e.g. 2024-08-15T00:00:00Z')
            .setDescriptionLocalizations({
              [Locale.Vietnamese]: 'Thời gian kết thúc, ví dụ: 2024-08-15T00:00:00Z',
            })
            .setRequired(false),
        )
        .addNumberOption((option) =>
          option
            .setName('enabled')
            .setDescription('Enable or disable the gacha (Yes/No)')
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

    //--- Autocomplete for 'id' option in 'create' subcommand ---
    if (subcommand === 'create' && focusedOption.name === 'id') {
      const search = (focusedOption.value as string) || '';
      const isVietnamese =
        interaction.locale === Locale.Vietnamese || interaction.locale.startsWith('vi');
      const allBanners: any[] = interaction.client.gacha_data || [];
      
      const banners = allBanners
        .filter((banner) => {
          const searchTerm = search.toLowerCase();
          return (
            banner.name.toLowerCase().includes(searchTerm) ||
            banner.vietnameseName?.toLowerCase().includes(searchTerm) ||
            banner.value.toString().includes(searchTerm) ||
            banner.globalName?.toLowerCase().includes(searchTerm)
          );
        })
        .slice(0, 25);
        
      const choices: ApplicationCommandOptionChoiceData[] = banners.map((banner: any) => {
        const displayName = isVietnamese && banner.vietnameseName ? banner.vietnameseName : banner.name;
        const bannerTypeText = banner.bannerType === 'CHARACTER' ? '🎭' : '⚔️';
        const choiceName = `${bannerTypeText} ${displayName} (${banner.value})`;
        
        return {
          name: choiceName.length > 100 ? choiceName.substring(0, 97) + '...' : choiceName,
          value: banner.value
        };
      });
      
      await interaction.respond(choices);
      return choices;
    }

    //--- Autocomplete for 'schedule_id' option in 'update' and 'delete' subcommands ---
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
          const gachaData: any[] = interaction.client.gacha_data || [];
          const bannerData = gachaData.find(
            (data: any) => data.value === schedule.value,
          );
          
          if (!bannerData) {
            const searchTerm = search.toLowerCase();
            const haystack = `schedule ${schedule.id} type ${schedule.type}`.toLowerCase();
            return haystack.includes(searchTerm);
          }
          
          const displayName = isVietnamese && bannerData.vietnameseName 
            ? bannerData.vietnameseName 
            : bannerData.name;
          
          const searchTerm = search.toLowerCase();
          const haystack = `${displayName} ${bannerData.bannerType} ${bannerData.value} ${schedule.id}`.toLowerCase();
          return haystack.includes(searchTerm);
        })
        .slice(0, 25);

      const choices: ApplicationCommandOptionChoiceData[] = filteredSchedules.map(
        (schedule: t_discord_gacha_schedule) => {
          const gachaData: any[] = interaction.client.gacha_data || [];
          const bannerData = gachaData.find(
            (data: any) => data.value === schedule.value,
          );
          
          if (!bannerData) {
            return {
              name: `Unknown Banner (Type: ${schedule.type}) - Schedule #${schedule.id}`,
              value: schedule.id,
            };
          }
          
          const displayName = isVietnamese && bannerData.vietnameseName 
            ? bannerData.vietnameseName 
            : bannerData.name;
          
          const bannerTypeIcon = bannerData.bannerType === 'CHARACTER' ? '🎭' : '⚔️';
          const statusIcon = schedule.enabled ? '✅' : '❌';
          
          const choiceName = `${statusIcon} ${bannerTypeIcon} ${displayName} (ID: ${schedule.id})`;

          return {
            name: choiceName.length > 100 ? choiceName.substring(0, 97) + '...' : choiceName,
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

//--- Create Gacha ---
async function executeCreateGacha(interaction: ChatInputCommandInteraction) {
  //--- Get options ---
  const id = interaction.options.getNumber('id', true);
  const gachaType = interaction.options.getNumber('gacha_type', true);
  const startTime = interaction.options.getString('start');
  const endTime = interaction.options.getString('end');
  const enabled = interaction.options.getNumber('enabled') ?? 1;
  //--- Parse time ---
  const start = startTime ? parseTimeRange(startTime) || new Date() : new Date();
  const end = endTime
    ? parseTimeRange(endTime) || new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
    : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
  //--- Check time ---
  if (start >= end) {
    await DiscordResponse.sendFailed(interaction, {
      messageCode: MESSAGE_CODES.GACHA.START_BEFORE_END
    });
    return;
  }

  //--- Create Gacha ---
  const gacha = new Gacha({
    id: id,
    gacha_type: gachaType,
    begin_time: start,
    end_time: end,
    enabled: enabled,
    // pass in character database on client to class
    data: interaction.client.gacha_data,
  });

  const gachaCreate = await gacha.create();
  if (gachaCreate.success) {
    try {
      // Find the banner data for the created gacha
      const bannerData = interaction.client.gacha_data?.find((data: any) => data.value == id.toString());
      const bannerName = bannerData ? bannerData.name : `Unknown Banner (${id})`;
      
      // Create entry in Discord database for tracking
      await DiscordPrisma.t_discord_gacha_schedule.create({
        data: {
          name: bannerName,
          value: id.toString(),
          type: gachaType,
          beginTime: start,
          endTime: end,
          enabled: enabled === 1,
        },
      });

      // Update the client cache
      const newSchedule = {
        id: 0, // Will be set by database
        name: bannerName,
        value: id.toString(),
        type: gachaType,
        beginTime: start,
        endTime: end,
        enabled: enabled === 1,
      };
      interaction.client.gacha_schedule.push(newSchedule);

      await DiscordResponse.sendSuccess(interaction, {
        messageCode: MESSAGE_CODES.GACHA.SCHEDULE_SUCCESS,
        placeholders: { characterName: gachaCreate.message },
        title: 'Gacha Schedule Created'
      });
    } catch (discordError) {
      console.error('Failed to create Discord schedule entry:', discordError);
      await DiscordResponse.sendSuccess(interaction, {
        messageCode: MESSAGE_CODES.GACHA.SCHEDULE_SUCCESS,
        placeholders: { characterName: gachaCreate.message },
        title: 'Gacha Schedule Created (Warning: Discord tracking failed)'
      });
    }
  } else {
    await DiscordResponse.sendFailed(interaction, {
      messageCode: MESSAGE_CODES.GACHA.SCHEDULE_FAILED,
      placeholders: { reason: gachaCreate.message }
    });
  }
}

//--- Update Gacha ---
async function executeUpdateGacha(interaction: ChatInputCommandInteraction) {
  //--- Get options ---
  const scheduleId = interaction.options.getInteger('schedule_id', true);
  const startTime = interaction.options.getString('start');
  const gachaType = interaction.options.getNumber('gacha_type', true);
  const endTime = interaction.options.getString('end');
  const enabled = interaction.options.getNumber('enabled') ?? 1;
  //--- Update time ---
  const start = startTime ? parseTimeRange(startTime) || new Date() : new Date();
  const end = endTime
    ? parseTimeRange(endTime) || new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
    : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
  //--- Check time ---
  if (start && end && start >= end) {
    await DiscordResponse.sendFailed(interaction, {
      messageCode: MESSAGE_CODES.GACHA.START_BEFORE_END
    });
    return;
  }

  //--- Update Gacha ---
  const gacha = new Gacha({
    id: scheduleId,
    gacha_type: gachaType,
    begin_time: start,
    end_time: end,
    enabled: enabled,
    // pass in database on client
    data: interaction.client.gacha_data,
  });

  const gachaUpdate = await gacha.update(scheduleId);
  if (gachaUpdate.success) {
    try {
      // Update Discord database tracking
      await DiscordPrisma.t_discord_gacha_schedule.update({
        where: { id: scheduleId },
        data: {
          beginTime: start,
          endTime: end,
          enabled: enabled === 1,
        },
      });

      // Update the client cache
      const scheduleCache = interaction.client.gacha_schedule;
      const scheduleIndex = scheduleCache.findIndex((s: any) => s.id === scheduleId);
      if (scheduleIndex !== -1) {
        scheduleCache[scheduleIndex] = {
          ...scheduleCache[scheduleIndex],
          beginTime: start,
          endTime: end,
          enabled: enabled === 1,
        };
      }

      await DiscordResponse.sendSuccess(interaction, {
        messageCode: MESSAGE_CODES.GACHA.SCHEDULE_SUCCESS,
        placeholders: { characterName: gachaUpdate.message },
        title: 'Gacha Schedule Updated'
      });
    } catch (discordError) {
      console.error('Failed to update Discord schedule entry:', discordError);
      await DiscordResponse.sendSuccess(interaction, {
        messageCode: MESSAGE_CODES.GACHA.SCHEDULE_SUCCESS,
        placeholders: { characterName: gachaUpdate.message },
        title: 'Gacha Schedule Updated (Warning: Discord tracking failed)'
      });
    }
  } else {
    await DiscordResponse.sendFailed(interaction, {
      messageCode: MESSAGE_CODES.GACHA.SCHEDULE_FAILED,
      placeholders: { reason: gachaUpdate.message }
    });
  }
}

//--- Delete Gacha ---
async function executeDeleteGacha(interaction: ChatInputCommandInteraction) {
  //--- Get options ---
  const scheduleId = interaction.options.getInteger('schedule_id', true);
  //--- Delete Gacha ---
  const gacha = new Gacha({ id: scheduleId });
  const gachaDelete = await gacha.delete(scheduleId);
  if (gachaDelete.success) {
    try {
      // Delete from Discord database tracking
      await DiscordPrisma.t_discord_gacha_schedule.delete({
        where: { id: scheduleId },
      });

      // Remove from client cache
      const scheduleCache = interaction.client.gacha_schedule;
      const scheduleIndex = scheduleCache.findIndex((s: any) => s.id === scheduleId);
      if (scheduleIndex !== -1) {
        scheduleCache.splice(scheduleIndex, 1);
      }

      await DiscordResponse.sendSuccess(interaction, {
        messageCode: MESSAGE_CODES.GACHA.SCHEDULE_SUCCESS,
        placeholders: { characterName: gachaDelete.message },
        title: 'Gacha Schedule Deleted'
      });
    } catch (discordError) {
      console.error('Failed to delete Discord schedule entry:', discordError);
      await DiscordResponse.sendSuccess(interaction, {
        messageCode: MESSAGE_CODES.GACHA.SCHEDULE_SUCCESS,
        placeholders: { characterName: gachaDelete.message },
        title: 'Gacha Schedule Deleted (Warning: Discord tracking cleanup failed)'
      });
    }
  } else {
    await DiscordResponse.sendFailed(interaction, {
      messageCode: MESSAGE_CODES.GACHA.SCHEDULE_FAILED,
      placeholders: { reason: gachaDelete.message }
    });
  }
}

export default GachaCommand;

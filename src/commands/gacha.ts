import {
  ChatInputCommandInteraction,
  Locale,
  SlashCommandBuilder,
  AutocompleteInteraction,
  type AutocompleteFocusedOption,
  type ApplicationCommandOptionChoiceData,
} from 'discord.js';
import { DiscordResponse } from '@/utils/discord-utils';
import { PrismaClient } from '@prisma-discord';
import { parseTimeRange } from '@/utils/utils';
import { DiscordException } from '@/exception';
import { ERROR_MESSAGE, SUCCESS_MESSAGE } from '@/constant';

const prisma = new PrismaClient();

const Gacha = {
  command: new SlashCommandBuilder()
    .setName('create-gacha')
    .setDescription('Create a limited gacha schedule')
    .setDescriptionLocalizations({
      [Locale.Vietnamese]: 'Tạo sự kiện Gacha Giới Hạn',
    })
    .addStringOption((option) =>
      option
        .setName('value')
        .setDescription('Event item value (e.g. 15509)')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('gacha_type')
        .setDescription('Gacha type (301, 302, 400, …)')
        .addChoices(
          { name: 'Character 1', value: 301 },
          { name: 'Character 2', value: 400 },
          { name: 'Weapon 1', value: 302 },
          { name: 'Weapon 2', value: 202 },
        )
        .setRequired(true),
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
    ),
  cooldown: 5,
  autocomplete: async (
    interaction: AutocompleteInteraction,
    option?: AutocompleteFocusedOption,
  ): Promise<ApplicationCommandOptionChoiceData[]> => {
    const search = (option?.value as string) || '';
    const isVietnamese =
      interaction.locale === Locale.Vietnamese ||
      interaction.locale.startsWith('vi');
    const allBanners: any[] = (interaction.client as any).gachaData || [];
    const banners = allBanners.filter((b) => {
      const haystack = `${b.name} ${b.vietnameseName ?? ''} ${b.value}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    }).slice(0, 25);
    const choices: ApplicationCommandOptionChoiceData[] = banners.map(
      (b: any) => ({
        name: isVietnamese && b.vietnameseName ? b.vietnameseName : b.name,
        value: b.value,
      }),
    );
    await interaction.respond(choices);
    return choices;
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    const value = interaction.options.getString('value', true);
    const gachaType = interaction.options.getInteger('gacha_type', true);
    const startTime = interaction.options.getString('start');
    const endTime = interaction.options.getString('end');
    
    let start = startTime ? parseTimeRange(startTime) : new Date();
    let end = endTime ? parseTimeRange(endTime) : null;
    
    if (!end) {
      end = new Date(start!.getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    if (start! >= end!) {
      await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[1000][interaction.locale]);
      return;
    }

    await interaction.deferReply();

    const overlappingType = await (prisma as any).t_discord_gacha_schedule.findFirst({
      where: {
        gachaType,
        NOT: {
          OR: [
            { endTime: { lt: start } },
            { beginTime: { gt: end } },
          ],
        },
      },
    });

    if (overlappingType) {
      await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[1001][interaction.locale].replace('{gachaType}', gachaType.toString()));
      return;
    }

    const overlappingValue = await (prisma as any).t_discord_gacha_schedule.findFirst({
      where: {
        gachaData: { value },
        NOT: {
          OR: [
            { endTime: { lt: start } },
            { beginTime: { gt: end } },
          ],
        },
      },
      include: { gachaData: true },
    });

    if (overlappingValue) {
      await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[1002][interaction.locale].replace('{value}', value));
      return;
    }

    const gachaData = await (prisma as any).t_discord_gacha_data.findFirst({
      where: { value },
    });

    if (gachaData) {
      await DiscordResponse.sendFailed(interaction, ERROR_MESSAGE[1003][interaction.locale].replace('{value}', value));
      return;
    }

    await prisma.t_discord_gacha_schedule.create({
      data: {
        gachaDataId: gachaData.id,
        gachaType,
        beginTime: start || new Date(),
        endTime: end || new Date(start!.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await DiscordResponse.sendSuccess(interaction, SUCCESS_MESSAGE[1000][interaction.locale]);
  }
};

export default Gacha;

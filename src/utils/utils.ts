import { parse, isValid, startOfDay } from 'date-fns';
import { DiscordPrisma } from './prisma-utils';

//--- Helper functions ----
/**
 * Parse a time range string into a Date object.
 * @param input - The input string to parse.
 * @returns The parsed Date object or null if the input is invalid.
 */
export const parseTimeRange = (input: string | null): Date | null => {
  if (!input) return null;

  const currentYear = new Date().getFullYear();
  const formats = [
    'dd/MM/yyyy', // 20/07/2025
    'dd.MM.yyyy', // 20.07.2025
    'dd/MM', // 20/07 -> 20/07/currentYear
    'dd.MM', // 20.07 -> 20/07/currentYear
    'yyyy-MM-dd', // 2025-07-20
    'MM/dd/yyyy', // 07/20/2025
  ];

  for (const fmt of formats) {
    let testInput = input;

    // For short formats without year, append current year
    if (fmt === 'dd/MM' && /^\d{1,2}\/\d{1,2}$/.test(input)) {
      testInput = `${input}/${currentYear}`;
      const parsed = parse(testInput, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) return startOfDay(parsed);
    }
    if (fmt === 'dd.MM' && /^\d{1,2}\.\d{1,2}$/.test(input)) {
      testInput = `${input}.${currentYear}`;
      const parsed = parse(testInput, 'dd.MM.yyyy', new Date());
      if (isValid(parsed)) return startOfDay(parsed);
    }

    try {
      const parsed = parse(testInput, fmt, new Date());
      if (isValid(parsed)) return startOfDay(parsed);
    } catch {
      continue;
    }
  }

  // Try ISO format last
  const isoDate = new Date(input);
  if (isValid(isoDate)) return isoDate;

  return null;
};

/**
 * Normalize a string by trimming and converting to lowercase.
 * @param s - The string to normalize.
 * @returns The normalized string.
 */
export const normalize = (s: string) => s.trim().toLowerCase();


/**
 * Check if a server is whitelisted.
 * @param id - The discord id to check.
 * @returns True if the user is whitelisted, false otherwise.
 */
export const checkWhiteList = async (guildId: string): Promise<boolean> => {
  if (guildId === '0' || guildId === '' || guildId === null) return false;
  const whitelist = await DiscordPrisma.t_discord_whitelist.findUnique({
    where: {
      discordId: guildId,
    }
  });
  return whitelist !== null;
};

export function extractGachaUpConfig(gachaSchedule: any): string {
  let bannerValue = gachaSchedule.gacha_type.toString(); // fallback
  try {
    if (gachaSchedule.gacha_up_config) {
      const gachaConfig = JSON.parse(gachaSchedule.gacha_up_config);
      if (gachaConfig.gacha_up_list) {
        const fiveStarItems = gachaConfig.gacha_up_list.find((list: any) => list.item_parent_type === 1);
        if (fiveStarItems && fiveStarItems.item_list && fiveStarItems.item_list.length > 0) {
          bannerValue = fiveStarItems.item_list[0].toString(); // Use first 5-star item as banner value
        }
      }
    }
  } catch (parseError) {
    // Use fallback value if parsing fails
  }
  return bannerValue;
}
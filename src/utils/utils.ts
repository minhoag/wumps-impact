import { parse, isValid, startOfDay } from 'date-fns';

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

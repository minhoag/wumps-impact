import { parse, isValid, startOfDay } from 'date-fns';

export const parseDuration = (duration: string): number => {
  const durationLower = duration.toLowerCase().trim();
  const patterns = {
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
  };

  const match = durationLower.match(
    /(\d+)\s*(day|days|week|weeks|hour|hours|minute|minutes)/,
  );
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2] as keyof typeof patterns;
    return value * patterns[unit];
  }

  // Default to 2 weeks if parsing fails
  return 14 * 24 * 60 * 60 * 1000;
};

export const parseTimeRange = (input: string | null): Date | null => {
  if (!input) return null;

  const currentYear = new Date().getFullYear();
  const formats = [
    'dd/MM/yyyy',     // 20/07/2025
    'dd.MM.yyyy',     // 20.07.2025
    'dd/MM',          // 20/07 -> 20/07/currentYear
    'dd.MM',          // 20.07 -> 20/07/currentYear
    'yyyy-MM-dd',     // 2025-07-20
    'MM/dd/yyyy',     // 07/20/2025
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
}


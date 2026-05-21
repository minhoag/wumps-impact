import type { SlashCommand } from '../types/bot';

export const getAllowedUserIds = (): string[] => {
  const raw = process.env.ALLOW ?? '';
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

export const isUserAllowed = (userId: string): boolean => {
  return getAllowedUserIds().includes(userId);
};

export const canUseSlashCommand = (command: SlashCommand, userId: string): boolean => {
  if (command.public) return true;
  return isUserAllowed(userId);
};

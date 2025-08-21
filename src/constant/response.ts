// @ts-nocheck

import { Locale } from 'discord.js';

// Message Code Constants for easier reference
export const MESSAGE_CODES = {
  // General/System codes (100-199)
  GENERAL: {
    COOLDOWN_ACTIVE: 101,
    ADMIN_ONLY: 102,
    UNKNOWN_ERROR: 103,
  },
  // Gacha related codes (200-299)
  GACHA: {
    SCHEDULE_SUCCESS: 200,
    START_BEFORE_END: 201,
    OVERLAP_EXISTS: 202,
    VALUE_EXISTS: 203,
    DATA_NOT_FOUND: 204,
    SCHEDULE_FAILED: 205,
  },
  // GM/Player management codes (300-399)
  GM: {
    PLAYER_ACTION_SUCCESS: 300,
    PLAYER_ACTION_FAILED: 301,
    ARTIFACT_DUPLICATE_SUBSTAT: 302,
  },
  // API response codes
  API: {
    SUCCESS: 0,
    INVALID_PARAMS: 1002,
    UID_NOT_FOUND: 2001,
  },
} as const;

// Dictionary for common actions/terms
export const DICT: { [key: string]: Record<Locale, string> } = {
  item_add: {
    [Locale.Vietnamese]: 'Thêm vật phẩm',
    [Locale.EnglishUS]: 'Add item',
  },
  item_remove: {
    [Locale.Vietnamese]: 'Xóa vật phẩm',
    [Locale.EnglishUS]: 'Remove item',
  },
  whitelist_add: {
    [Locale.Vietnamese]: 'Thêm vào danh sách trắng',
    [Locale.EnglishUS]: 'Add to whitelist',
  },
  whitelist_remove: {
    [Locale.Vietnamese]: 'Xóa khỏi danh sách trắng',
    [Locale.EnglishUS]: 'Remove from whitelist',
  },
  mail_send: {
    [Locale.Vietnamese]: 'Gửi thư',
    [Locale.EnglishUS]: 'Send mail',
  },
};

// Error messages organized by category
export const ERROR_MESSAGE: { [key: number]: Record<Locale, string> } = {
  //--- General/System Errors (100-199) ---
  [MESSAGE_CODES.GENERAL.COOLDOWN_ACTIVE]: {
    [Locale.Vietnamese]: 'Vui lòng đợi `{time}` giây trước khi sử dụng lại lệnh này.',
    [Locale.EnglishUS]: 'Please wait `{time}` seconds before re-using this command.',
  },
  [MESSAGE_CODES.GENERAL.ADMIN_ONLY]: {
    [Locale.Vietnamese]: 'Lệnh này chỉ có thể được sử dụng bởi người quản trị.',
    [Locale.EnglishUS]: 'This command can only be used by administrators.',
  },
  [MESSAGE_CODES.GENERAL.UNKNOWN_ERROR]: {
    [Locale.Vietnamese]: 'Đã có lỗi không xác định xảy ra. Chi tiết: {detail}',
    [Locale.EnglishUS]: 'An unknown error occurred. Detail: {detail}',
  },

  //--- Gacha Errors (200-299) ---
  [MESSAGE_CODES.GACHA.START_BEFORE_END]: {
    [Locale.Vietnamese]: '`start` phải trước `end`.',
    [Locale.EnglishUS]: '`start` must be before `end`.',
  },
  [MESSAGE_CODES.GACHA.OVERLAP_EXISTS]: {
    [Locale.Vietnamese]: 'Một sự kiện Gacha khác đã được tạo trong khoảng thời gian này.',
    [Locale.EnglishUS]: 'Another gacha is already active in this time range.',
  },
  [MESSAGE_CODES.GACHA.VALUE_EXISTS]: {
    [Locale.Vietnamese]: 'Giá trị sự kiện `{value}` đã tồn tại trong khoảng thời gian này.',
    [Locale.EnglishUS]: 'Event value `{value}` is already scheduled during this time range.',
  },
  [MESSAGE_CODES.GACHA.DATA_NOT_FOUND]: {
    [Locale.Vietnamese]:
      'Không tìm thấy dữ liệu Gacha cho giá trị `{value}`. Vui lòng tải lên trước.',
    [Locale.EnglishUS]: 'No gacha data found for value `{value}`. Please upload it first.',
  },
  [MESSAGE_CODES.GACHA.SCHEDULE_FAILED]: {
    [Locale.Vietnamese]: 'Lên lịch Gacha thất bại. Nguyên nhân: {reason}',
    [Locale.EnglishUS]: 'Gacha schedule creation failed. Reason: {reason}',
  },

  //--- GM Command Errors (300-399) ---
  [MESSAGE_CODES.GM.PLAYER_ACTION_FAILED]: {
    [Locale.Vietnamese]:
      'Thất bại `{action}` `{itemName}` cho người chơi `{playerName}`. Số lượng: `{quantity}`. Nguyên nhân: {reason}',
    [Locale.EnglishUS]:
      'Failed `{action}` `{itemName}` for player `{playerName}`. Quantity: `{quantity}`. Reason: {reason}',
  },
  [MESSAGE_CODES.GM.ARTIFACT_DUPLICATE_SUBSTAT]: {
    [Locale.Vietnamese]: 'Tạo thánh dị vật thất bại. Nguyên nhân: Dòng phụ trùng lặp `{reason}`',
    [Locale.EnglishUS]: 'Artifact creation failed. Reason: Duplicate substat `{reason}`',
  },
};

// API response messages
export const API_MESSAGE: { [key: number]: Record<Locale, string> } = {
  [MESSAGE_CODES.API.SUCCESS]: {
    [Locale.Vietnamese]: 'Thành công {desc}.',
    [Locale.EnglishUS]: '{desc} successfully.',
  },
  [MESSAGE_CODES.API.INVALID_PARAMS]: {
    [Locale.Vietnamese]: 'Gửi request GM thất bại. Nguyên nhân: Lỗi param.',
    [Locale.EnglishUS]: 'Failed to send request GM. Reason: Invalid param.',
  },
  [MESSAGE_CODES.API.UID_NOT_FOUND]: {
    [Locale.Vietnamese]: 'Gửi request GM thất bại. UID không tồn tại',
    [Locale.EnglishUS]: 'Failed to send request GM. UID not found.',
  },
};

// Success messages
export const SUCCESS_MESSAGE: { [key: number]: Record<Locale, string> } = {
  [MESSAGE_CODES.GACHA.SCHEDULE_SUCCESS]: {
    [Locale.Vietnamese]: 'Lên lịch thành công. Nhân vật: `{characterName}`',
    [Locale.EnglishUS]: 'Gacha schedule created successfully. Character: `{characterName}`',
  },
  [MESSAGE_CODES.GM.PLAYER_ACTION_SUCCESS]: {
    [Locale.Vietnamese]:
      'Thành công `{action}` `{itemName}` cho người chơi `{playerName}`. Số lượng: `{quantity}`.',
    [Locale.EnglishUS]:
      'Successfully `{action}` `{itemName}` for player `{playerName}`. Quantity: `{quantity}`.',
  },
};

// Helper function to get localized message with placeholder replacement
export const getLocalizedMessage = (
  messageMap: { [key: number]: Record<Locale, string> },
  code: number,
  locale: string,
  placeholders: Record<string, string> = {}
): string => {
  const message = messageMap[code]?.[locale] || messageMap[code]?.[Locale.EnglishUS] || 'Message not found';
  
  // Replace placeholders
  let result = message;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
};

// Convenience functions for each message type
export const getErrorMessage = (code: number, locale: string, placeholders?: Record<string, string>) =>
  getLocalizedMessage(ERROR_MESSAGE, code, locale, placeholders);

export const getSuccessMessage = (code: number, locale: string, placeholders?: Record<string, string>) =>
  getLocalizedMessage(SUCCESS_MESSAGE, code, locale, placeholders);

export const getApiMessage = (code: number, locale: string, placeholders?: Record<string, string>) =>
  getLocalizedMessage(API_MESSAGE, code, locale, placeholders);

export const getDictMessage = (key: string, locale: string) =>
  DICT[key]?.[locale] || DICT[key]?.[Locale.EnglishUS] || key;

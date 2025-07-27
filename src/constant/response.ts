// @ts-nocheck

import { Locale } from 'discord.js';

export const ERROR_MESSAGE: { [key: number]: Record<Locale, string> } = {
  //--- General Error ---
  101: {
    [Locale.Vietnamese]: 'Vui lòng đợi `{time}` giây trước khi sử dụng lại lệnh này.',
    [Locale.EnglishUS]: 'Please wait `{time}` seconds before re-using this command.',
  },
  102: {
    [Locale.Vietnamese]: 'Lệnh này chỉ có thể được sử dụng bởi người quản trị.',
    [Locale.EnglishUS]: 'This command can only be used by administrators.',
  },
  103: {
    [Locale.Vietnamese]: 'Đã có lỗi không xác định xảy ra. Chi tiết: {detail}',
    [Locale.EnglishUS]: 'An unknown error occurred. Detail: {detail}',
  },
  //--- Gacha Command ---
  201: {
    [Locale.Vietnamese]: '`start` phải trước `end`.',
    [Locale.EnglishUS]: '`start` must be before `end`.',
  },
  202: {
    [Locale.Vietnamese]: 'Một sự kiện Gacha khác đã được tạo trong khoảng thời gian này.',
    [Locale.EnglishUS]: 'Another gacha is already active in this time range.',
  },
  203: {
    [Locale.Vietnamese]: 'Giá trị sự kiện `{value}` đã tồn tại trong khoảng thời gian này.',
    [Locale.EnglishUS]: 'Event value `{value}` is already scheduled during this time range.',
  },
  204: {
    [Locale.Vietnamese]:
      'Không tìm thấy dữ liệu Gacha cho giá trị `{value}`. Vui lòng tải lên trước.',
    [Locale.EnglishUS]: 'No gacha data found for value `{value}`. Please upload it first.',
  },
  //--- Database Error related ---
  205: {
    [Locale.Vietnamese]: 'Lên lịch Gacha thất bại. Nguyên nhân: {reason}',
    [Locale.EnglishUS]: 'Gacha schedule creation failed. Reason: {reason}',
  },
  //--- GM Command ---
  301: {
    [Locale.Vietnamese]:
      'Thất bại `{action}` `{itemName}` cho người chơi `{playerName}`. Số lượng: `{quantity}`. Nguyên nhân: {reason}',
    [Locale.EnglishUS]:
      'Failed `{action}` `{itemName}` for player `{playerName}`. Quantity: `{quantity}`. Reason: {reason}',
  },
};

export const SUCCESS_MESSAGE: { [key: number]: Record<Locale, string> } = {
  200: {
    [Locale.Vietnamese]:
      'Lên lịch thành công cho `{characterName}` Thời gian: `{beginTime}` - `{endTime}`.',
    [Locale.EnglishUS]:
      'Gacha schedule created successfully for `{characterName}`. Time: `{beginTime}` - `{endTime}`.',
  },
  300: {
    [Locale.Vietnamese]:
      'Thành công `{action}` `{itemName}` cho người chơi `{playerName}`. Số lượng: `{quantity}`.',
    [Locale.EnglishUS]:
      'Successfully `{action}` `{itemName}` for player `{playerName}`. Quantity: `{quantity}`.',
  },
};

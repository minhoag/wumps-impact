import { Locale } from "discord.js";

export const GACHA_TYPE_NEWBIE = 100;
export const GACHA_TYPE_STANDARD = 200;
export const GACHA_TYPE_STANDARD_AVATAR = 201;
export const GACHA_TYPE_STANDARD_WEAPON = 202;
export const GACHA_TYPE_ACTIVITY = 300;
export const GACHA_TYPE_ACTIVITY_AVATAR = 301;
export const GACHA_TYPE_ACTIVITY_WEAPON = 302;
export const GACHA_TYPE_SPECIAL_ACTIVITY_AVATAR = 400;

export const ERROR_MESSAGE: {
    [key: number]: Record<Locale, string>;
} = {
    //--- Gacha Command ---
    1001: {
        [Locale.Vietnamese]: '`start` phải trước `end`.',
        [Locale.EnglishUS]: '`start` must be before `end`.',
    },
    1002: {
        [Locale.Vietnamese]: 'Một sự kiện Gacha khác đã được tạo trong khoảng thời gian này.',
        [Locale.EnglishUS]: 'Another gacha is already active in this time range.',
    },
    1003: {
        [Locale.Vietnamese]: 'Giá trị sự kiện `{value}` đã được lên lịch trong khoảng thời gian này.',
        [Locale.EnglishUS]: 'Event value `{value}` is already scheduled during this time range.',
    },
    1004: {
        [Locale.Vietnamese]: 'Không tìm thấy dữ liệu Gacha cho giá trị `{value}`. Vui lòng tải lên trước.',
        [Locale.EnglishUS]: 'No gacha data found for value `{value}`. Please upload it first.',
    },
}

export const SUCCESS_MESSAGE: {
    [key: number]: Record<Locale, string>;
} = {
    1000: {
        [Locale.Vietnamese]: 'Lên lịch Gacha thành công.',
        [Locale.EnglishUS]: 'Gacha schedule created successfully.',
    },
}

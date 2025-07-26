import { Locale } from "discord.js";

export const GACHA_TYPE_NEWBIE = 100;
export const GACHA_TYPE_STANDARD = 200;
export const GACHA_TYPE_STANDARD_AVATAR = 201;
export const GACHA_TYPE_STANDARD_WEAPON = 202;
export const GACHA_TYPE_ACTIVITY = 300;
export const GACHA_TYPE_ACTIVITY_AVATAR = 301;
export const GACHA_TYPE_ACTIVITY_WEAPON = 302;
export const GACHA_TYPE_SPECIAL_ACTIVITY_AVATAR = 400;

//--- Endpoints ---
export const BASE_URL = 'http://localhost';
export const ENDPOINT = {
    GM: "14861"
}
//--- Config ---
export const CONFIG = {
    REGION: {
        DEV_GIO: "dev_gio",
        DEV_GIO_OVERSEA: "dev_gio_oversea",
    },
    CMD: {
        SEND_MAIL: "1005",
        GUEST_BIND_ACCOUNT: "1110",
        DEL_ITEM: "1111",
        PLAYER_GOTO: "1112",
        GM_TALK: "1116",
        REFRESH_SHOP: "1118",
        UNLOCK_TALENT: "1119",
        FINISH_DAILY_TASK: "1122",
        UNLOCK_AREA: "1124",
        ADD_ITEM: "1127",
        SUB_COIN_NEGATIVE: "1135",
        SET_QUEST_CONTENT_PROGRESS: "1139",
        QUERY_PLAYER_FRIEND_LIST: "1151",
        QUERY_PLAYER_BRIEF_DATA: "1153",
        QUERY_PLAYER_EXTRA_BIN_DATA: "1154",
        UPDATE_PLAYER_SECURITY_LEVEL: "1155",
        CHANGE_BIND_ACCOUNT: "1162",
        SET_FINISH_PARENT_QUEST_CHILD_QUEST_STATE: "1174",
        SET_LEVEL1_AREA_EXPLORE_POINT: "1175",
        ADD_MCOIN_VIP_POINT: "1200",
        FINISH_ROUTINE: "1221",
        FINISH_DAILY_TASK_UNLOAD_GROUP: "1222",
    }
}

export const ERROR_MESSAGE: {
    [key: number]: Record<Locale, string>;
} = {
    //--- Discord Related ---
    //--- Cooldown Related ---
    101: {
        [Locale.Vietnamese]: 'Vui lòng đợi `{time}` giây trước khi sử dụng lại lệnh này.',
        [Locale.EnglishUS]: 'Please wait `{time}` seconds before re-using this command.',
    },
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
            [Locale.Vietnamese]: 'Giá trị sự kiện `{value}` đã tồn tại trong khoảng thời gian này.',
            [Locale.EnglishUS]: 'Event value `{value}` is already scheduled during this time range.',
    },
    1004: {
        [Locale.Vietnamese]: 'Không tìm thấy dữ liệu Gacha cho giá trị `{value}`. Vui lòng tải lên trước.',
        [Locale.EnglishUS]: 'No gacha data found for value `{value}`. Please upload it first.',
    },
    //--- Database Error related ---
    2001: {
        [Locale.Vietnamese]: 'Lên lịch Gacha thất bại.',
        [Locale.EnglishUS]: 'Gacha schedule creation failed.',
    },
}

export const SUCCESS_MESSAGE: {
    [key: number]: Record<Locale, string>;
} = {
    1000: {
        [Locale.Vietnamese]: 'Lên lịch thành công cho `{characterName}` Thời gian: `{beginTime}` - `{endTime}`.',
        [Locale.EnglishUS]: 'Gacha schedule created successfully for `{characterName}`. Time: `{beginTime}` - `{endTime}`.',
    },
    2000: {
        [Locale.Vietnamese]: 'Tạo Gacha trên Game Server thành công.',
        [Locale.EnglishUS]: 'Gacha created on game server successfully.',
    },
}

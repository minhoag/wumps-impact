"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUseSlashCommand = exports.isUserAllowed = exports.getAllowedUserIds = void 0;
const getAllowedUserIds = () => {
    const raw = process.env.ALLOW ?? '';
    return raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
};
exports.getAllowedUserIds = getAllowedUserIds;
const isUserAllowed = (userId) => {
    return (0, exports.getAllowedUserIds)().includes(userId);
};
exports.isUserAllowed = isUserAllowed;
const canUseSlashCommand = (command, userId) => {
    if (command.public)
        return true;
    return (0, exports.isUserAllowed)(userId);
};
exports.canUseSlashCommand = canUseSlashCommand;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const command = {
    name: 'greet',
    permissions: ['Administrator', discord_js_1.PermissionFlagsBits.ManageEmojisAndStickers],
    aliases: ['sayhello'],
    cooldown: 10,
    execute: (message, args) => {
        const toGreet = message.mentions.members?.first();
        message.channel.send(`Hello there ${toGreet ? toGreet.user.username : message.member?.user.username}!`);
    },
};
exports.default = command;

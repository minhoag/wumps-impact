"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const function_1 = require("../function");
const event = {
    name: 'messageCreate',
    execute: async (message) => {
        if (!message.member || message.member.user.bot)
            return;
        if (!message.guild)
            return;
        let prefix = process.env.PREFIX ?? '!';
        if (!message.content.startsWith(prefix))
            return;
        if (message.channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const args = message.content.substring(prefix.length).split(' ');
        let command = message.client.commands.get(args[0]);
        if (!command) {
            const commandFromAlias = message.client.commands.find((command) => command.aliases.includes(args[0]));
            if (commandFromAlias)
                command = commandFromAlias;
            else
                return;
        }
        const cooldown = message.client.cooldowns.get(`${command.name}-${message.member.user.username}`);
        const neededPermissions = (0, function_1.checkPermissions)(message.member, command.permissions);
        if (neededPermissions !== null)
            return (0, function_1.sendTimedMessage)(`
            Bạn không có quyền sử dụng Bot. 
            \n Quyền để được sử dụng: ${neededPermissions.join(', ')}
            `, message.channel, 5000);
        if (command.cooldown && cooldown) {
            if (Date.now() < cooldown) {
                (0, function_1.sendTimedMessage)(`Bạn phải đợi ${Math.floor(Math.abs(Date.now() - cooldown) / 1000)} giây(s) để sự dụng lệnh này.`, message.channel, 5000);
                return;
            }
            message.client.cooldowns.set(`${command.name}-${message.member.user.username}`, Date.now() + command.cooldown * 1000);
            setTimeout(() => {
                message.client.cooldowns.delete(`${command?.name}-${message.member?.user.username}`);
            }, command.cooldown * 1000);
        }
        else if (command.cooldown && !cooldown) {
            message.client.cooldowns.set(`${command.name}-${message.member.user.username}`, Date.now() + command.cooldown * 1000);
        }
        command.execute(message, args);
    },
};
exports.default = event;

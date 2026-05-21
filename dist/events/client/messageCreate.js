"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../../config/config.json"));
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const event = {
    name: 'messageCreate',
    once: false,
    async execute(client, rawMessage) {
        const message = rawMessage;
        if (!message.content || message.author.bot)
            return;
        const prefix = config_json_1.default.prefix?.trim() ?? '';
        const botName = config_json_1.default.botName?.trim().toLowerCase() ?? '';
        const mentionRegex = client.user ? new RegExp(`^<@!?${escapeRegex(client.user.id)}>(?:\\s+|$)`) : null;
        let content = message.content.trim();
        let triggerMatched = false;
        if (prefix && content.startsWith(prefix)) {
            triggerMatched = true;
            content = content.slice(prefix.length).trim();
        }
        if (!triggerMatched && botName) {
            const match = content.match(new RegExp(`^${escapeRegex(botName)}(?:\\s+|$)`, 'i'));
            if (match) {
                triggerMatched = true;
                content = content.slice(match[0].length).trim();
            }
        }
        if (!triggerMatched && mentionRegex) {
            const match = content.match(mentionRegex);
            if (match) {
                triggerMatched = true;
                content = content.slice(match[0].length).trim();
            }
        }
        if (!triggerMatched)
            return;
        const args = content.split(/\s+/).filter(Boolean);
        const input = args.shift()?.toLowerCase();
        if (!input)
            return;
        const resolvedName = client.commands.has(input) ? input : client.aliases.get(input);
        if (!resolvedName)
            return;
        const command = client.commands.get(resolvedName);
        if (!command)
            return;
        try {
            await command.run(client, message, args, prefix);
        }
        catch (error) {
            console.error(`[MESSAGE COMMAND ERROR] ${resolvedName}:`, error);
            const sep = new discord_js_1.SeparatorBuilder();
            const container = new discord_js_1.ContainerBuilder().setAccentColor(parseInt(String(config_json_1.default.color || '000000').replace('#', ''), 16)).addSeparatorComponents(sep).addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent('⚠ **Command Error**\nAn unexpected error occurred while running that command.')).addSeparatorComponents(sep);
            await message.reply({ flags: discord_js_1.MessageFlags.IsComponentsV2, components: [container] });
        }
    },
};
module.exports = event;

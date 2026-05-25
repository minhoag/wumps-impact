"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const config_json_1 = __importDefault(require("../../config/config.json"));
const permission_1 = require("../../core/permission");
const config = config_json_1.default;
const event = {
    name: 'interactionCreate',
    once: false,
    async execute(client, rawInteraction) {
        const interaction = rawInteraction;
        if (!interaction.isChatInputCommand())
            return;
        console.log(`[INTERACTION] /${interaction.commandName} from ${interaction.user.tag}`);
        const command = client.slash.get(interaction.commandName);
        if (!command)
            return;
        if (!(0, permission_1.canUseSlashCommand)(command, interaction.user.id)) {
            await interaction.reply({
                content: 'You are not allowed to use this command.',
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        try {
            await command.run(client, interaction, interaction.options);
        }
        catch (error) {
            console.error(`[INTERACTION] Error in /${interaction.commandName}:`, error);
        }
    },
};
module.exports = event;

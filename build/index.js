"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
    ],
});
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
client.slashCommands = new discord_js_1.Collection();
client.commands = new discord_js_1.Collection();
client.cooldowns = new discord_js_1.Collection();
const handlersDir = (0, path_1.join)(__dirname, './handlers');
(0, fs_1.readdirSync)(handlersDir).forEach((handler) => {
    require(`${handlersDir}/${handler}`)(client);
});
exports.default = client;
client.login(process.env.TOKEN);

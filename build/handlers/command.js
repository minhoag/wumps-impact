"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const rest_1 = require("@discordjs/rest");
const fs_1 = require("fs");
const path_1 = require("path");
module.exports = (client) => {
    const slashCommands = [];
    const commands = [];
    const slashCommandsDir = (0, path_1.join)(__dirname, '../slashCommands');
    const commandsDir = (0, path_1.join)(__dirname, '../commands');
    (0, fs_1.readdirSync)(slashCommandsDir).forEach((file) => {
        if (!file.endsWith('.ts'))
            return;
        const command = require(`${slashCommandsDir}/${file}`)
            .default;
        slashCommands.push(command.command);
        client.slashCommands.set(command.command.name, command);
    });
    (0, fs_1.readdirSync)(commandsDir).forEach((file) => {
        if (!file.endsWith('.ts'))
            return;
        const command = require(`${commandsDir}/${file}`).default;
        commands.push(command);
        client.commands.set(command.name, command);
    });
    const rest = new rest_1.REST({ version: '10' }).setToken(process.env.TOKEN);
    rest
        .put(discord_js_1.Routes.applicationCommands(process.env.CLIENT), {
        body: slashCommands.map((command) => command.toJSON()),
    })
        .catch((e) => {
        console.log(e);
    });
};

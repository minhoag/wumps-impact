"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { PermissionsBitField, MessageFlags, TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, } = require('discord.js');
const config = require('../../config/config.json');
module.exports = {
    name: 'ping',
    aliases: ['p'],
    description: 'Check the app latency and status!',
    usage: 'ping',
    async run(client, message) {
        console.log("here");
        const sent = Date.now();
        const pingText = new TextDisplayBuilder().setContent(`# 🏓 **Pong!**\n` +
            `**WebSocket Ping:** ${client.ws.ping}ms\n` +
            `**API Response Time:** ${Date.now() - sent}ms`);
        const separator = new SeparatorBuilder();
        const container = new ContainerBuilder()
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(pingText)
            .addSeparatorComponents(separator);
        await message.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container],
        });
    },
};

"use strict";
const discord_js_1 = require("discord.js");
const event = {
    name: 'clientReady',
    once: true,
    execute(client) {
        if (!client.user)
            return;
        console.log(`Logged in as ${client.user.tag}`);
        client.user.setPresence({
            status: 'online',
            activities: [{ name: 'Make sure to leave a star ⭐ on the repo', type: discord_js_1.ActivityType.Custom }],
        });
    },
};
module.exports = event;

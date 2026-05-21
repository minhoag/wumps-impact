"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const event_1 = __importDefault(require("./handlers/event"));
const slash_1 = __importDefault(require("./handlers/slash"));
const message_1 = __importDefault(require("./handlers/message"));
const token = process.env.TOKEN;
if (!token) {
    console.error('TOKEN is required in environment.');
    process.exit(1);
}
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMessageReactions,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message, discord_js_1.Partials.User, discord_js_1.Partials.GuildMember, discord_js_1.Partials.Reaction],
});
client.commands = new discord_js_1.Collection();
client.events = new discord_js_1.Collection();
client.slash = new discord_js_1.Collection();
client.aliases = new discord_js_1.Collection();
void (0, event_1.default)(client);
void (0, slash_1.default)(client);
void (0, message_1.default)(client);
void client.login(token).catch((error) => {
    console.error('Failed to login:', error);
    process.exit(1);
});
client.on('error', (error) => console.error('[CLIENT ERROR]', error));
client.on('shardError', (error) => console.error('[SHARD ERROR]', error));
process.on('uncaughtException', (err) => console.error('[UNCAUGHT EXCEPTION]', err));
process.on('unhandledRejection', (reason) => console.error('[UNHANDLED REJECTION]', reason));
exports.default = client;

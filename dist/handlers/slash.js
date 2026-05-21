"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = loadSlash;
require("dotenv/config");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const discord_js_1 = require("discord.js");
const isSlashCommand = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    return !!v.data && typeof v.public === 'boolean' && typeof v.run === 'function' && typeof v.data.name === 'string' && typeof v.data.toJSON === 'function';
};
const getRuntimeCommandExtension = () => (node_path_1.default.extname(__filename) === '.ts' ? '.ts' : '.js');
const isCommandFile = (file) => {
    if (file.endsWith('.d.ts'))
        return false;
    return file.endsWith(getRuntimeCommandExtension());
};
const resolveSlashRoot = () => {
    const candidate = node_path_1.default.join(__dirname, '../slashCommands');
    if (!node_fs_1.default.existsSync(candidate)) {
        throw new Error(`[SLASH] Command directory not found: ${candidate}`);
    }
    return candidate;
};
async function loadSlash(client) {
    const slashRoot = resolveSlashRoot();
    const slash = [];
    const seen = new Set();
    let skippedDuplicates = 0;
    for (const dir of node_fs_1.default.readdirSync(slashRoot)) {
        const dirPath = node_path_1.default.join(slashRoot, dir);
        if (!node_fs_1.default.statSync(dirPath).isDirectory())
            continue;
        for (const file of node_fs_1.default.readdirSync(dirPath).filter(isCommandFile)) {
            const filePath = node_path_1.default.join(dirPath, file);
            const mod = require(filePath);
            const command = (mod.default ?? mod);
            if (!isSlashCommand(command)) {
                console.warn(`[SLASH] Skipped invalid module: ${filePath} (expected { data, public, run })`);
                continue;
            }
            if (seen.has(command.data.name)) {
                skippedDuplicates += 1;
                console.warn(`[SLASH] Skipped duplicate command name: ${command.data.name}`);
                continue;
            }
            seen.add(command.data.name);
            client.slash.set(command.data.name, command);
            slash.push(command.data.toJSON());
        }
    }
    console.log(`[SLASH] Loaded ${slash.length} command(s). Skipped duplicates: ${skippedDuplicates}.`);
    const token = process.env.TOKEN;
    const clientId = process.env.CLIENTID;
    if (!token || !clientId)
        throw new Error('TOKEN and CLIENTID are required for slash registration.');
    const guildId = process.env.GUILD_ID ?? process.env.GUILDID;
    const rest = new discord_js_1.REST({ version: '10' }).setToken(token);
    if (guildId) {
        await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: [] });
        console.log('[SLASH] Cleared global commands.');
        await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), { body: slash });
        console.log(`[SLASH] Registered ${slash.length} command(s) to guild ${guildId}.`);
        return;
    }
    await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: slash });
    console.log(`[SLASH] Registered ${slash.length} command(s) to global.`);
}

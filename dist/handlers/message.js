"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = loadMessage;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const isMessageCommand = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    return typeof v.name === 'string' && typeof v.run === 'function';
};
function loadMessage(client) {
    const commandsPath = node_path_1.default.join(__dirname, '../messageCommands');
    client.commands.clear();
    client.aliases.clear();
    if (!node_fs_1.default.existsSync(commandsPath))
        return;
    for (const entry of node_fs_1.default.readdirSync(commandsPath, { withFileTypes: true })) {
        const entryPath = node_path_1.default.join(commandsPath, entry.name);
        const files = entry.isDirectory()
            ? node_fs_1.default.readdirSync(entryPath).filter((f) => f.endsWith('.js')).map((f) => node_path_1.default.join(entryPath, f))
            : entry.isFile() && entry.name.endsWith('.js')
                ? [entryPath]
                : [];
        for (const filePath of files) {
            const mod = require(filePath);
            const command = (mod.default ?? mod);
            if (!isMessageCommand(command))
                continue;
            const commandName = command.name.toLowerCase();
            client.commands.set(commandName, command);
            for (const alias of command.aliases ?? [])
                client.aliases.set(alias.toLowerCase(), commandName);
        }
    }
}

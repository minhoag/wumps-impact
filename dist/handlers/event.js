"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = loadEvents;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const isBotEvent = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    const v = value;
    return typeof v.name === 'string' && typeof v.execute === 'function';
};
const isEventFile = (file) => {
    if (file.endsWith('.d.ts'))
        return false;
    return file.endsWith('.js') || file.endsWith('.ts');
};
function loadEvents(client) {
    const eventsRoot = node_path_1.default.join(__dirname, '../events');
    let loaded = 0;
    for (const dir of node_fs_1.default.readdirSync(eventsRoot)) {
        const dirPath = node_path_1.default.join(eventsRoot, dir);
        if (!node_fs_1.default.statSync(dirPath).isDirectory())
            continue;
        for (const file of node_fs_1.default.readdirSync(dirPath).filter(isEventFile)) {
            const mod = require(node_path_1.default.join(dirPath, file));
            const event = (mod.default ?? mod);
            if (!isBotEvent(event))
                continue;
            if (event.once)
                client.once(event.name, (...args) => event.execute(client, ...args));
            else
                client.on(event.name, (...args) => event.execute(client, ...args));
            client.events.set(event.name, event);
            loaded += 1;
        }
    }
    console.log(`[EVENT] Loaded ${loaded} event(s).`);
}

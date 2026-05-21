import fs from 'node:fs';
import path from 'node:path';
import type { BotClient, BotEvent } from '../types/bot';

const isBotEvent = (value: unknown): value is BotEvent => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<BotEvent>;
  return typeof v.name === 'string' && typeof v.execute === 'function';
};

const isEventFile = (file: string): boolean => {
  if (file.endsWith('.d.ts')) return false;
  return file.endsWith('.js') || file.endsWith('.ts');
};

export default function loadEvents(client: BotClient): void {
  const eventsRoot = path.join(__dirname, '../events');
  let loaded = 0;
  for (const dir of fs.readdirSync(eventsRoot)) {
    const dirPath = path.join(eventsRoot, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    for (const file of fs.readdirSync(dirPath).filter(isEventFile)) {
      const mod = require(path.join(dirPath, file));
      const event = (mod.default ?? mod) as unknown;
      if (!isBotEvent(event)) continue;
      if (event.once) client.once(event.name, (...args) => event.execute(client, ...args));
      else client.on(event.name, (...args) => event.execute(client, ...args));
      client.events.set(event.name, event);
      loaded += 1;
    }
  }
  console.log(`[EVENT] Loaded ${loaded} event(s).`);
}

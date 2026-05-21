import fs from 'node:fs';
import path from 'node:path';
import type { BotClient, MessageCommand } from '../types/bot';

const isMessageCommand = (value: unknown): value is MessageCommand => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<MessageCommand>;
  return typeof v.name === 'string' && typeof v.run === 'function';
};

export default function loadMessage(client: BotClient): void {
  const commandsPath = path.join(__dirname, '../messageCommands');
  client.commands.clear();
  client.aliases.clear();
  if (!fs.existsSync(commandsPath)) return;

  for (const entry of fs.readdirSync(commandsPath, { withFileTypes: true })) {
    const entryPath = path.join(commandsPath, entry.name);
    const files = entry.isDirectory()
      ? fs.readdirSync(entryPath).filter((f) => f.endsWith('.js')).map((f) => path.join(entryPath, f))
      : entry.isFile() && entry.name.endsWith('.js')
        ? [entryPath]
        : [];

    for (const filePath of files) {
      const mod = require(filePath);
      const command = (mod.default ?? mod) as unknown;
      if (!isMessageCommand(command)) continue;
      const commandName = command.name.toLowerCase();
      client.commands.set(commandName, command);
      for (const alias of command.aliases ?? []) client.aliases.set(alias.toLowerCase(), commandName);
    }
  }
}

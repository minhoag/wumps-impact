import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes } from 'discord.js';
import type { BotClient, SlashCommand } from '../types/bot';

const isSlashCommand = (value: unknown): value is SlashCommand => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<SlashCommand>;
  return !!v.data && typeof v.public === 'boolean' && typeof v.run === 'function' && typeof v.data.name === 'string' && typeof v.data.toJSON === 'function';
};

const getRuntimeCommandExtension = (): '.ts' | '.js' => (path.extname(__filename) === '.ts' ? '.ts' : '.js');

const isCommandFile = (file: string): boolean => {
  if (file.endsWith('.d.ts')) return false;
  return file.endsWith(getRuntimeCommandExtension());
};

const resolveSlashRoot = (): string => {
  const candidate = path.join(__dirname, '../slashCommands');
  if (!fs.existsSync(candidate)) {
    throw new Error(`[SLASH] Command directory not found: ${candidate}`);
  }
  return candidate;
};

export default async function loadSlash(client: BotClient): Promise<void> {
  const slashRoot = resolveSlashRoot();
  const slash: unknown[] = [];
  const seen = new Set<string>();
  let skippedDuplicates = 0;

  for (const dir of fs.readdirSync(slashRoot)) {
    const dirPath = path.join(slashRoot, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    for (const file of fs.readdirSync(dirPath).filter(isCommandFile)) {
      const filePath = path.join(dirPath, file);
      const mod = require(filePath);
      const command = (mod.default ?? mod) as unknown;
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
  if (!token || !clientId) throw new Error('TOKEN and CLIENTID are required for slash registration.');
  const guildId = process.env.GUILD_ID ?? process.env.GUILDID;
  const rest = new REST({ version: '10' }).setToken(token);
  if (guildId) {
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log('[SLASH] Cleared global commands.');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: slash });
    console.log(`[SLASH] Registered ${slash.length} command(s) to guild ${guildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), { body: slash });
  console.log(`[SLASH] Registered ${slash.length} command(s) to global.`);
}

import { REST } from '@discordjs/rest';
import { Client, Routes, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

import { Command, SlashCommand } from '../types';

module.exports = (client: Client) => {
  const slashCommands: SlashCommandBuilder[] = [];

  const slashCommandsDir = join(__dirname, '../slash');
  const commandsDir = join(__dirname, '../legacy');

  readdirSync(slashCommandsDir).forEach((file) => {
    if (!file.endsWith('.ts')) return;
    const command: SlashCommand = require(
      `${slashCommandsDir}/${file}`,
    ).default;
    slashCommands.push(command.command);
    client.slashCommands.set(command.command.name, command);
  });

  readdirSync(commandsDir).forEach((file) => {
    if (!file.endsWith('.ts')) return;
    const command: Command = require(
      `${commandsDir}/${file}`,
    ).default;
    client.commands.set(command.name, command);
  });

  const rest = new REST({ version: '10' }).setToken(
    process.env.DISCORD_TOKEN as string,
  );

  rest
    .put(
      Routes.applicationCommands(
        process.env.DISCORD_CLIENT as string,
      ),
      {
        body: slashCommands.map((command) => command.toJSON()),
      },
    )
    .catch((e) => {
      console.log(e);
    });
};

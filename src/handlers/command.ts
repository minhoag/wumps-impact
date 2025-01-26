import type { Client } from 'discord.js';

const { REST } = require('@discordjs/rest');
const { SlashCommandBuilder, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');

const { Command, SlashCommand } = require('../types');

module.exports = (client: Client) => {
  const slashCommands: ReturnType<typeof SlashCommandBuilder>[] = [];

  const slashCommandsDir = join(__dirname, '../slash');
  const commandsDir = join(__dirname, '../legacy');

  readdirSync(slashCommandsDir).forEach((file: string) => {
    if (!file.endsWith('.ts')) return;
    const command: typeof SlashCommand = require(
      `${slashCommandsDir}/${file}`,
    ).default;
    slashCommands.push(command.command);
    client.slashCommands.set(command.command.name, command);
    console.log('Loaded slash command:', command.command.name);
  });

  readdirSync(commandsDir).forEach((file: string) => {
    if (!file.endsWith('.ts')) return;
    const command: typeof Command = require(`${commandsDir}/${file}`).default;
    client.commands.set(command.name, command);
  });

  const rest = new REST({ version: '10' }).setToken(
    process.env['DISCORD_TOKEN'] as string,
  );

  rest
    .put(Routes.applicationCommands(process.env['DISCORD_CLIENT'] as string), {
      body: slashCommands.map(
        (command: ReturnType<typeof SlashCommandBuilder>) => command.toJSON(),
      ),
    })
    .catch((e: Error) => {
      console.log(e);
    });
};

import {
  Client,
  Collection,
  Routes
} from 'discord.js';
import { REST } from '@discordjs/rest';
import { readdirSync } from 'fs';
import { join } from 'path';
import { type Command, type Event } from './type';

export default async function Handlers(client: Client) {
  const commands: Command[] = [];
  const events: Event[] = [];

  client.commands = new Collection();
  client.events = new Collection();
  client.cooldowns = new Collection();

  const commandsDir = join(__dirname, 'commands');
  const eventsDir = join(__dirname, 'events');

  //--- Load events ----
  const eventFiles = readdirSync(eventsDir).filter(
    (file) => file.endsWith('.ts') || file.endsWith('.js'),
  );
  for (const file of eventFiles) {
    const event = await import(`${eventsDir}/${file}`);
    if (event.default) {
      events.push(event.default);
      console.log(`Loaded event: ${event.default.name}`);
      client.events.set(event.default.name, event.default);
      event.default.once
        ? client.once(event.default.name, (...args: any[]) =>
            event.default.execute(...args),
          )
        : client.on(event.default.name, (...args: any[]) =>
            event.default.execute(...args),
          );
    }
  }

  const commandFiles = readdirSync(commandsDir).filter(
    (file) => file.endsWith('.ts') || file.endsWith('.js'),
  );
  for (const file of commandFiles) {
    const command = await import(`${commandsDir}/${file}`);
    if (command.default) {
      commands.push(command.default);
      console.log(
        `Loaded command: ${command.default.command.name}`,
      );
      client.commands.set(
        command.default.command.name,
        command.default,
      );
    }
  }

  console.log(
    `Registering ${commands.length} commands with Discord...`,
  );

  const res = new REST({ version: '10' }).setToken(
    process.env['DISCORD_TOKEN']!,
  );

  res
    .put(
      Routes.applicationCommands(
        process.env['DISCORD_CLIENT'] as string,
      ),
      {
        body: commands.map((command: Command) =>
          command.command.toJSON(),
        ),
      },
    )
    .catch((e: Error) => {
      console.error(e);
    })
}

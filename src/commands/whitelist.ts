import { EmbedType, ResponseType, type Command } from "@/type";
import { DiscordResponse } from "@/utils/discord-utils";
import { DiscordPrisma } from "@/utils/prisma-utils";
import { checkWhiteList } from "@/utils/utils";
import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const WhiteList: Command = {
    command: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Whitelist a server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a server to the whitelist')
        .addStringOption(option => option.setName('server').setDescription('The server to whitelist').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a server from the whitelist')
        .addStringOption(option => option.setName('server').setDescription('The server to remove from the whitelist').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all servers in the whitelist')
    ),
  defer: true,
  cooldown: 5,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case 'add': {
        const serverId = interaction.options.getString('server', true);
        const isWhitelisted = await checkWhiteList(serverId);
        if (isWhitelisted) return await DiscordResponse.sendFailed(interaction, 'Server is already whitelisted');
        await DiscordPrisma.t_discord_whitelist.create({
          data: {
            discordId: serverId,
          },
        });
        await DiscordResponse.sendSuccess(interaction, 'Server added to the whitelist');
        break;
      }
      case 'remove': {
        const serverId = interaction.options.getString('server', true);
        const isWhitelisted = await checkWhiteList(serverId);
        if (!isWhitelisted) return await DiscordResponse.sendFailed(interaction, 'Server is not whitelisted');
        await DiscordPrisma.t_discord_whitelist.delete({
          where: { discordId: serverId },
        });
        await DiscordResponse.sendSuccess(interaction, 'Server removed from the whitelist');
        break;
      }
      case 'list': {
        const whitelist = await DiscordPrisma.t_discord_whitelist.findMany();
        const fields = whitelist.map(server => ({ name: `${server.discordId}`, value: `Time: ${server.createdAt.toLocaleString()}` }));
        const embed = DiscordResponse.createEmbed({
          title: 'White listed servers',
          type: EmbedType.DEFAULT,
          fields,
        });
        await DiscordResponse.sendResponse({
          interaction,
          types: [ResponseType.EMBED, ResponseType.EPHEMERAL],
          embed,
        });
        break;
      }
      default:
        await DiscordResponse.sendFailed(interaction, 'Invalid subcommand');
        break;
    }
  },
};

export default WhiteList;
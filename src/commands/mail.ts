import { type Command } from "@/type";
import { DiscordResponse } from "@/utils/discord-utils";
import { checkWhiteList } from "@/utils/utils";
import { 
  CommandInteraction, 
  SlashCommandBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} from "discord.js";

const Mail: Command = {
    command: new SlashCommandBuilder()
    .setName('mail')
    .setDescription('Send mail to players'),
  defer: false,
  cooldown: 5,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    
    // Check if user has permission (whitelist check for guild)
    const isWhitelisted = await checkWhiteList(interaction.guildId as string);
    if (!isWhitelisted) {
      return await DiscordResponse.sendFailed(interaction, 'This server is not whitelisted to use mail commands');
    }
    
    // Create initial modal for basic mail info
    const modal = new ModalBuilder()
      .setCustomId('mail-init')
      .setTitle('Send Mail');

    // UID input
    const uidInput = new TextInputBuilder()
      .setCustomId('uidInput')
      .setLabel('Player UID (or "all" for all players)')
      .setPlaceholder('Enter player UID or "all"...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(20)
      .setRequired(true);

    // Title input
    const titleInput = new TextInputBuilder()
      .setCustomId('titleInput')
      .setLabel('Mail Title')
      .setPlaceholder('Enter mail title...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    // Content input
    const contentInput = new TextInputBuilder()
      .setCustomId('contentInput')
      .setLabel('Mail Content')
      .setPlaceholder('Enter mail content...')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    // Expiry input
    const expiryInput = new TextInputBuilder()
      .setCustomId('expiryInput')
      .setLabel('Expiry (days from now)')
      .setPlaceholder('Default: 30 days')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(3)
      .setRequired(false);

    // Create action rows
    const uidRow = new ActionRowBuilder<TextInputBuilder>().addComponents(uidInput);
    const titleRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
    const contentRow = new ActionRowBuilder<TextInputBuilder>().addComponents(contentInput);
    const expiryRow = new ActionRowBuilder<TextInputBuilder>().addComponents(expiryInput);

    modal.addComponents(uidRow, titleRow, contentRow, expiryRow);

    await interaction.showModal(modal);
  },
};

export default Mail;
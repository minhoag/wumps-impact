import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  CommandInteraction,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('mail')
    .setDescription('Gửi lệnh Mail cho người chơi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 1,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    const modal = new ModalBuilder()
      .setCustomId('mailForm')
      .setTitle('Nội dung Thư');
    const receiver = new TextInputBuilder()
      .setCustomId('receiverInput')
      .setLabel('Nguời nhận:Người gửi')
      .setPlaceholder('1:Paimon')
      .setStyle(TextInputStyle.Short);

    const expiry = new TextInputBuilder()
      .setCustomId('expiryInput')
      .setLabel('Thời hạn thư (tính theo ngày)')
      .setPlaceholder('14')
      .setStyle(TextInputStyle.Short);

    const title = new TextInputBuilder()
      .setCustomId('titleInput')
      .setLabel('Tiêu đề thư')
      .setPlaceholder("Ví dụ: It's Paimon's Birthday!")
      .setStyle(TextInputStyle.Short);

    const description = new TextInputBuilder()
      .setCustomId('descriptionInput')
      .setLabel('Nội dung thư')
      .setPlaceholder(
        "Ví dụ: You might be only one of countless stars, but you're Paimon's whole world!"
      )
      .setStyle(TextInputStyle.Paragraph);

    const item = new TextInputBuilder()
      .setCustomId('itemInput')
      .setLabel('Vật phẩm thêm')
      .setPlaceholder('Ví dụ: 201:900')
      .setStyle(TextInputStyle.Paragraph);

    // An action row only holds one text input,
    // so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder().addComponents(receiver);
    const secondActionRow = new ActionRowBuilder().addComponents(expiry);
    const thirdActionRow = new ActionRowBuilder().addComponents(title);
    const fourthActionRow = new ActionRowBuilder().addComponents(description);
    const fifthActionRow = new ActionRowBuilder().addComponents(item);

    // Add inputs to the modal
    modal.addComponents(
      firstActionRow as ActionRowBuilder<TextInputBuilder>,
      secondActionRow as ActionRowBuilder<TextInputBuilder>,
      thirdActionRow as ActionRowBuilder<TextInputBuilder>,
      fourthActionRow as ActionRowBuilder<TextInputBuilder>,
      fifthActionRow as ActionRowBuilder<TextInputBuilder>
    );

    // Show the modal to the user
    await interaction.showModal(modal);
  },
};

export default command;

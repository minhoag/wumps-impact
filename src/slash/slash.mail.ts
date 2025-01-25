import {
  ActionRowBuilder,
  CommandInteraction,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import type { SlashCommand } from '../types';

// Define the slash command for sending mail
const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('mail')
    .setDescription('Gửi lệnh Mail cho người chơi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 1,
  execute: async (interaction: CommandInteraction) => {
    // Ensure the interaction is a chat input command and the client is defined
    if (!interaction.isChatInputCommand()) return;
    // Create and show the modal for mail input
    const modal = createModal();
    await interaction.showModal(modal);
  },
};

export default command;

// Function to create the modal for mail input
const createModal = () => {
  const modal = new ModalBuilder().setCustomId('mailForm').setTitle('Soạn thư gửi');

  // Define the input fields for the modal
  const expiry = new TextInputBuilder()
    .setCustomId('expiryInput')
    .setLabel('Thời hạn thư')
    .setPlaceholder('Tính theo ngày, mặc định là 7 ngày')
    .setValue("14")
    .setStyle(TextInputStyle.Short);

  const receiver = new TextInputBuilder()
    .setCustomId('receiverInput')
    .setLabel('Người nhận')
    .setPlaceholder('Ghi all để gửi tất cả mọi người.')
    .setStyle(TextInputStyle.Short);

  const sender = new TextInputBuilder()
    .setCustomId('senderInput')
    .setLabel('Người gửi')
    .setPlaceholder('Tiêu đề thư')
    .setValue("You got a mail!")
    .setStyle(TextInputStyle.Short);

  const content = new TextInputBuilder()
    .setCustomId('contentInput')
    .setPlaceholder('Enter some text!')
    .setLabel('Nội dung thư')
    .setValue('Thank you for supporting our server! Here is a gift for you.')
    .setStyle(TextInputStyle.Paragraph);

  const item = new TextInputBuilder()
    .setCustomId('itemInput')
    .setLabel('Đính kèm vật phẩm')
    .setPlaceholder('Thêm nhiều vật phẩm bằng dấu phẩm chia bằng dấu 2 chấm. Ví dụ: 201:10,202:10000')
    .setStyle(TextInputStyle.Paragraph);

  // Add the input fields to the modal
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(receiver),
    new ActionRowBuilder<TextInputBuilder>().addComponents(sender),
    new ActionRowBuilder<TextInputBuilder>().addComponents(expiry),
    new ActionRowBuilder<TextInputBuilder>().addComponents(content),
    new ActionRowBuilder<TextInputBuilder>().addComponents(item)
  );

  return modal;
};
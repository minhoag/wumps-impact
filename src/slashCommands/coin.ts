import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  CommandInteraction,
} from 'discord.js';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('coin')
    .setDescription('Gửi lệnh GM thêm tiền tệ cho người chơi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('uid')
        .setDescription('UID của người chơi')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Chọn loại tiền tệ')
        .setRequired(true)
        .addChoices(
          { name: 'Đá sáng thế', value: 'mcoin' },
          { name: 'Mora', value: 'scoin' },
          { name: 'Nguyên thạch', value: 'hcoin' },
          { name: 'Tiền Động Tiên', value: 'home_coin' }
        )
    )
    .addNumberOption((option) =>
      option.setName('amount').setDescription('Số lượng')
    ),
  cooldown: 1,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild)
      return interaction.reply('Không thể thực hiện ở DM');
    const ip = process.env.IP;
    const uid = interaction.options.getString('uid', true);
    const type = interaction.options.getString('type', true);
    const amount = interaction.options.getNumber('amount') ?? 1;
    const name = {
      mcoin: 'Đá sáng thế',
      scoin: 'Mora',
      hcoin: 'Nguyên thạch',
      home_coin: 'Tiền Động Tiên',
    };
    try {
      await fetch(
        `http://${ip}:14861/api?region=dev_gio&ticket=GM&cmd=1116&uid=${uid}&msg=${type}%20${amount}`
      );
      await interaction.reply({
        content: `Đã thêm ${
          name[type as keyof typeof name]
        } cho người chơi UID ${uid}`,
        ephemeral: true,
      });
    } catch (error) {
      console.log(`Error in GM coin: ${error.message}\nIP: ${ip}`);
    }
  },
};

export default command;

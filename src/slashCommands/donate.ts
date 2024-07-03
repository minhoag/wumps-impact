import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  CommandInteraction,
} from 'discord.js';
import { SlashCommand } from '../types';
import moment from 'moment';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Gửi mail quà Donate cho người chơi.')
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
        .setDescription('Chọn loại donate')
        .setRequired(true)
        .addChoices(
          { name: 'Nguyên thạch', value: '1' },
          { name: 'Không Nguyệt Chúc Phúc', value: '2' },
          { name: 'Nhật Ký Hành Trình', value: '3' }
        )
    ),
  cooldown: 1,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild)
      return interaction.reply('Không thể thực hiện ở DM');
    const ip = process.env.IP;
    const uid = interaction.options.getString('uid', true);
    const titleId = Number(interaction.options.getString('type', true));
    const title: {
      [key: number]: string;
    } = {
      1: 'Nạp Nguyên thạch',
      2: 'Nạp Không Nguyệt Chúc Phúc',
      3: 'Nạp Nhật Ký Hành Trình',
    };
    const sender = 'Wumpus';
    const type = Number(interaction.options.getString('type', true));
    const description = 'Cảm ơn bạn đã ủng hộ WumPS.';
    const item: {
      [key: number]: string;
    } = {
      1: '201:900,201:900,201:900,201:900,201:900,201:900,201:900,201:900,201:300',
      2: '1202:1',
      3: '1201:1',
    };
    try {
      const seconds = moment().add(365, 'days').unix();
      const uuid = new Date().getTime();
      const res = await fetch(
        `http://${ip}:14861/api?sender=${sender}&title=${title[titleId]}&content=${description}&item_list=${item[type]}&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`
      );
      const json = await res.json();
      if (json.msg !== 'succ') {
        await interaction.reply({
          content: 'Gửi thư không thành công. Lỗi: `' + json.msg + '`',
          ephemeral: true,
        });
        return;
      }
      await interaction.reply({
        content: 'Gửi thư thành công',
        ephemeral: true,
      });
    } catch (error) {
      console.log(`Error in Donate: ${error.message}\nIP: ${ip}`);
    }
  },
};

export default command;

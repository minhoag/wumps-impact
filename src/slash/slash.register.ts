import dayjs from 'dayjs';
import {
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { createClient } from 'redis';

import { prisma_discord } from '../prisma/prisma';
import { SlashCommand } from '../types';
import { translate } from '../utils';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Send verification code.')
    .setDescriptionLocalization('vi', 'Gửi mã xác minh.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('code')
        .setDescription('Send verification code.')
        .setDescriptionLocalization('vi', 'Gửi mã xác minh.')
        .addStringOption((option) =>
          option
            .setName('uid')
            .setRequired(true)
            .setDescription('Your UID in-game.')
            .setDescriptionLocalization(
              'vi',
              'UID của bạn trong game.',
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('verify')
        .setDescription('Input your verification code.')
        .setDescriptionLocalization('vi', 'Nhập mã xác minh.')
        .addStringOption((option) =>
          option
            .setName('code')
            .setRequired(true)
            .setDescription('Your verification code.')
            .setDescriptionLocalization('vi', 'Mã xác minh của bạn.'),
        ),
    ),

  cooldown: 3,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) return;
    const client = createClient({
      url: process.env.REDIS_URL,
    });
    client.on('error', (err) =>
      console.log('Redis Client Error', err),
    );
    client.on('ready', () => console.log('Redis Client Ready'));
    await client.connect();

    if (interaction.options.getSubcommand() === 'send') {
      const uid: string = interaction.options.getString('uid', true);
      await interaction.deferReply({ ephemeral: true });
      const user = await prisma_discord.user.findUnique({
        where: {
          id: interaction.user.id,
        },
      });
      if (user)
        return await interaction.editReply(
          translate({
            message: 'verify-send:already',
            locale: interaction.locale,
          }),
        );
      // send
      const otpCode = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 10),
      ).join('');

      await client.del(interaction.user.id);
      await client.set(interaction.user.id, otpCode, {
        EX: 15 * 60,
      });

      const sign = new Date().getTime().toString();
      const title = translate({
        message: 'verify-send:title',
        locale: interaction.locale,
      });
      const sender = 'P・A・I・M・O・N';
      const content =
        interaction.locale == 'vi'
          ? `Mã OTP của bạn cho tài khoản là ${otpCode}. Sử dụng mã này để nhập vào Form mở trên Discord để xác minh.`
          : `Your OTP for the account is ${otpCode}. Use this code to enter in the Form opened on Discord for verification.`;
      const expire_time = dayjs().add(15, 'minute').unix();

      const message = `http://localhost:14861/api?sender=${sender}&title=${title}&content=${content}&item_list=202:1&expire_time=${expire_time}&is_collectible=False&uid=${uid}&cmd=1005&region=dev_gio&ticket=GM%40${expire_time}&sign=${sign}`;

      try {
        await fetch(message);
      } catch (error: any) {
        console.error(error);
      }
      await client.disconnect();
      await interaction.editReply({
        content: translate({
          message: 'verify-send:send',
          locale: interaction.locale,
        }),
      });
    } else if (interaction.options.getSubcommand() === 'verify') {
      const code: string = interaction.options.getString(
        'code',
        true,
      );
      await interaction.deferReply({ ephemeral: true });
      const otp = await client.get(interaction.user.id);
      if (!otp)
        return await interaction.reply(
          translate({
            message: 'error:unknown',
            locale: interaction.locale,
          }),
        );
      if (otp !== code) {
        return await interaction.reply(
          translate({
            message: 'verify-send:wrong-code',
            locale: interaction.locale,
          }),
        );
      }
    }
  },
};

export default command;

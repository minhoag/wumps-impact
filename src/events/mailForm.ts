import dayjs from 'dayjs';
import { CommandInteraction } from 'discord.js';

import { prisma_user } from '../prisma/prisma.ts';
import type { Event } from '../types';

const event: Event = {
  name: 'interactionCreate',
  execute: async (interaction) => {
    if (!interaction.isModalSubmit() && interaction.customId !== 'mailForm')
      return;
    const receiver = interaction.fields.getTextInputValue('receiverInput');
    const sender = interaction.fields.getTextInputValue('senderInput');
    const expiry = interaction.fields.getTextInputValue('expiryInput');
    const content = interaction.fields.getTextInputValue('contentInput');
    const item = interaction.fields
      .getTextInputValue('itemInput')
      .replace(/\s/g, '');
    const seconds = dayjs().add(Number(expiry), 'days').unix();
    const uuid = new Date().getTime();

    if (receiver === 'all') {
      const users = await prisma_user.t_player_uid.findMany();
      if (!users.length) return;
      const error: number[] = [];
      for (const user of users) {
        const success = await sendMail(
          interaction as any,
          user.uid,
          sender,
          content,
          item,
          seconds,
          uuid,
        );
        if (!success) error.push(user.uid);
      }
      if (error.length) {
        await interaction.reply({
          content:
            'Gửi thư không thành công ở các UID: `' + error.join(', ') + '`',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'Gửi thư thành công',
          flags: 'Ephemeral',
        });
      }
    } else {
      const success = await sendMail(
        interaction as any,
        receiver,
        sender,
        content,
        item,
        seconds,
        uuid,
      );
      if (success) {
        await interaction.reply({
          content: 'Gửi thư thành công',
          flags: 'Ephemeral',
        });
      }
    }
  },
};

export default event;

const sendMail = async (
  interaction: CommandInteraction,
  uid: number,
  title: string,
  content: string,
  item: string,
  seconds: number,
  uuid: number,
) => {
  const url = `http://localhost:14861/api?sender=${'P・A・I・M・O・N'}&title=${title}&content=${content}&item_list=${item}&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.msg !== 'succ') {
    await interaction.reply({
      content: 'Gửi thư không thành công. Lỗi: `' + json.msg + '`',
      flags: 'Ephemeral',
    });
    return false;
  }
  return true;
};

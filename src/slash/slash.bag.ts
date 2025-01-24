import Canvas, { GlobalFonts } from '@napi-rs/canvas';
import {
  AttachmentBuilder,
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  User,
} from 'discord.js';

import { SlashCommand } from '../types';

GlobalFonts.registerFromPath('./src/assets/font/zhcn.ttf', 'Genshin');
const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('bag')
    .setDescription('View storage data.')
    .setDescriptionLocalization('vi', 'Xem túi đồ của bạn.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('view')
        .setDescription('Check what item you have in-game')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('View another user bags.')
            .setDescriptionLocalization(
              'vi',
              'Xem túi đồ của người khác.',
            ),
        )
        .addNumberOption((option) =>
          option
            .setName('number')
            .setDescription(
              'Type a number to view a specific bag page.',
            )
            .setDescriptionLocalization(
              'vi',
              'Xem túi đồ ở trang cụ thể.',
            ),
        ),
    ),
  cooldown: 1,
  autocomplete: async (interaction) => {},
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild) return;
    if (interaction.options.getSubcommand() === 'view') {
      const user: User =
        interaction.options.getUser('user') ?? interaction.user;
      const number: number =
        interaction.options.getNumber('number') ?? 1;
      // Use the helpful Attachment class structure to process the file for you
      const canvas = Canvas.createCanvas(1800, 1220);
      const context = canvas.getContext('2d');
      const background = await Canvas.loadImage(
        './src/assets/bag/bag.png',
      );
      context.drawImage(
        background,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      /**
       *
       * Style Currency
       *
       * **/
      context.font = applyText(canvas, '123123');
      context.fillStyle = '#000000';
      const height_currency = canvas.height / 4.91;
      /**
       *
       * PRIMOGEMS TEXT
       *
       * **/
      context.fillText('123123', canvas.width / 2.5, height_currency);
      /**
       *
       * MORA TEXT
       *
       * **/
      context.fillText(
        '789789',
        canvas.width / 8.75,
        height_currency,
      );
      /**
       *
       * Masterless Stardust TEXT
       *
       * **/
      context.fillText(
        '789789',
        canvas.width / 1.435,
        height_currency,
      );

      const attachment = new AttachmentBuilder(
        await canvas.encode('png'),
        { name: 'inventory.png' },
      );
      await interaction.reply({ files: [attachment] });
      /*try {
        let Embeds: EmbedBuilder[] = [];

        const player = await prisma_discord.user.findUnique({
          where: {
            id: interaction.user.id,
          },
        });
        if (!player) {
          await interaction.editReply({
            content: translate({
              message: 'bag:view:notfound',
              locale: interaction.locale,
            }),
          });
          return;
        }
        Pagination
        const res: Response = await fetch(
          `http://localhost:14861/api?cmd=1016&region=dev_gio&ticket=GM&uid=${1}`,
        );
        const item = await res.json();
        // Materials are type 2
        let all_item: any =
          item.data.item_bin_data.pack_store.item_list.filter(
            (i: any) => i.item_type === 2,
          );
        console.log(all_item);
        const pagination = new Pagination(interaction);
        pagination.setEmbeds(Embeds, (embed, index, array) => {
          return embed.setFooter({
            text: `Page: ${index + 1}/${array.length}`,
          });
        });
        await pagination.render();
      } catch (error: any) {
        embeds.setDescription('Error: ' + error.message);
        await interaction.editReply({
          content: translate({
            message: 'error:unknown',
            locale: interaction.locale,
          }),
        });
      }*/
    }
  },
};

export default command;

const applyText = (canvas: any, text: string) => {
  const context = canvas.getContext('2d');
  let fontSize = 45;
  do {
    context.font = `${(fontSize -= 10)}px Genshin`;
  } while (context.measureText(text).width > canvas.width - 300);
  return context.font;
};

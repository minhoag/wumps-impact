import Canvas, { GlobalFonts } from '@napi-rs/canvas';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  User,
} from 'discord.js';

import { ItemProps } from '../refs/ref.item';
import { getItemsInBag } from '../utils';

GlobalFonts.registerFromPath('./src/assets/font/zhcn.ttf', 'Genshin');
const ITEMS_PER_PAGE = 10;

const command = {
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
            .setDescriptionLocalization('vi', 'Xem túi đồ của người khác.'),
        )
        .addNumberOption((option) =>
          option
            .setName('page')
            .setDescription('Type a number to view a specific bag page.')
            .setDescriptionLocalization('vi', 'Xem túi đồ ở trang cụ thể.'),
        ),
    ),
  cooldown: 1,
  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand() || !interaction.guild) return;

    if (interaction.options.getSubcommand() === 'view') {
      /** Get params **/
      const user: User =
        interaction.options.getUser('user') ?? interaction.user;
      let page: number = interaction.options.getNumber('page') ?? 1;
      /** Get item **/
      await interaction.deferReply();
      let items = await getItemsInBag(interaction.user.id);
      /** Filter item **/
      if (!items) return interaction.editReply('No item found in your bag.');
      const sortedItems = items.item.sort(
        (a: any, b: any) => a.item_id - b.item_id,
      );
      /** Generate Canvas **/
      const generateCanvas = async (page: number) => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const itemsToDisplay = sortedItems.slice(start, end);

        const canvas = Canvas.createCanvas(1800, 1000);
        const context = canvas.getContext('2d');
        const background = await Canvas.loadImage('./src/assets/bag/bag.png');
        context.drawImage(background, 0, 0, canvas.width, canvas.height);
        /** Draw currency on canvas **/
        const drawCurrency = (canvas: any, context: any) => {
          context.font = applyText(canvas, '123123');
          context.fillStyle = '#000000';
          const height_currency = canvas.height / 4.25;
          context.fillText(
            items?.s_coin.toString() ?? '0',
            canvas.width / 2.5,
            height_currency,
          );
          context.fillText(
            items?.m_coin.toString() ?? '0',
            canvas.width / 8.75,
            height_currency,
          );
          context.fillText(
            items?.masterless.toString() ?? '0',
            canvas.width / 1.435,
            height_currency,
          );
        };

        drawCurrency(canvas, context);

        /** Draw items on Canvas **/
        const itemBackgrounds = await Promise.all(
          itemsToDisplay.map(async (item: ItemProps) => {
            console.log(item);
            const background = await Canvas.loadImage(
              `./src/assets/container/bg_item_${5}.png`,
            );
            const itemImage = await Canvas.loadImage(
              item.assets ?? './src/assets/item/Item_Amakumo_Fruit.png',
            );
            return {
              background,
              itemImage,
              amount: item.count?.toString(),
            };
          }),
        );
        /** Draw items on Canvas by new cols **/
        itemBackgrounds.forEach(({ background, itemImage, amount }, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          const xOffset = 155 + col * 275;
          const yOffset = 320 + row * 325;
          context.drawImage(background, xOffset, yOffset, 239.05, 239.05);
          context.drawImage(itemImage, xOffset, yOffset, 239.05, 239.05);
          context.fillStyle = '#ffffff';
          amount = amount ?? '0';
          context.fillText(
            //amount.toString()
            amount ?? '0',
            xOffset + 75 + amount.length * 5,
            yOffset + 220,
          );
        });

        context.fillStyle = '#444347';
        context.fillText(
          interaction.user.username,
          canvas.width / 18.35,
          canvas.height / 1.045,
        );

        return new AttachmentBuilder(await canvas.encode('png'), {
          name: 'inventory.png',
        });
      };

      const attachment = await generateCanvas(page);
      /** Pagination Canvas **/
      const row = createPaginationRow(
        page,
        Math.ceil(sortedItems.length / ITEMS_PER_PAGE),
      );
      /** Send Response Canvas **/
      await interaction.editReply({
        files: [attachment],
        components: [row],
      });

      /** Fetch response **/
      const fetchReply = await interaction.fetchReply();
      const collector = fetchReply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      /** Collect interaction fetch response **/
      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: 'This button is not for you!',
            ephemeral: true,
          });
        }

        if (i.customId === 'previous') page--;
        else if (i.customId === 'next') page++;

        const newAttachment = await generateCanvas(page);

        await i.update({
          files: [newAttachment],
          components: [
            createPaginationRow(
              page,
              Math.ceil(sortedItems.length / ITEMS_PER_PAGE),
            ),
          ],
        });
      });

      collector.on('end', async () => {
        await interaction.editReply({ components: [] });
      });
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

const createPaginationRow = (page: number, totalPages: number) => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('previous')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 1),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPages),
  );
};

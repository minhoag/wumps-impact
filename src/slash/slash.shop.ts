import Canvas, { GlobalFonts } from '@napi-rs/canvas';
import dayjs from 'dayjs';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  type Locale,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

import { prisma_discord } from '../prisma/prisma.ts';
import { embeds, translate } from '../utils.ts';
import { type ShopItem, ShopView } from './store/store.ts';

// Register custom font
GlobalFonts.registerFromPath('./src/assets/font/zhcn.ttf', 'Genshin');

const ITEMS_PER_PAGE = 10;

// Define the command
const command = {
  command: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View server shop.')
    .setDescriptionLocalization('vi', 'Xem cửa hàng server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('mora')
        .setDescription('View server Mora shop.')
        .setDescriptionLocalization('vi', 'Xem cửa hàng Mora.')
        .addNumberOption((option) =>
          option
            .setName('quantity')
            .setDescription('How many items do you want to buy?')
            .setDescriptionLocalization(
              'vi',
              'Số lượng vật phẩm bạn muốn mua?',
            ),
        )
        .addNumberOption((option) =>
          option
            .setName('page')
            .setDescription('Type a number to view a specific bag page.')
            .setDescriptionLocalization('vi', 'Xem túi đồ ở trang cụ thể.'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('primogems')
        .setDescription('View server Primogems shop.')
        .setDescriptionLocalization('vi', 'Xem cửa hàng Primogems.')
        .addNumberOption((option) =>
          option
            .setName('page')
            .setDescription('Type a number to view a specific bag page.')
            .setDescriptionLocalization('vi', 'Xem túi đồ ở trang cụ thể.'),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('points')
        .setDescription('View server Points shop.')
        .setDescriptionLocalization('vi', 'Xem cửa hàng Points.')
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

    if (
      interaction.options.getSubcommand() === 'mora' ||
      interaction.options.getSubcommand() === 'primogems' ||
      interaction.options.getSubcommand() === 'points'
    ) {
      // Get page number from interaction options
      const quantity: number = interaction.options.getNumber('quantity') ?? 1;
      let page: number = interaction.options.getNumber('page') ?? 1;
      // Locale for the user
      const locale: Locale = interaction.locale;
      // Check quantity
      if (quantity < 1 || quantity > 15) {
        return interaction.reply({
          content: translate({
            message:
              quantity < 1
                ? 'shop:view:quantity:lt0'
                : 'shop:view:quantity:gt15',
            locale: locale,
          }),
          flags: 'Ephemeral',
        });
      }
      // Defer the reply to allow time for data fetching and canvas generation
      await interaction
        .deferReply()
        .catch((e: Error) => console.error('Here: ' + e));
      // Fetch user currency data from the database
      const currency = await prisma_discord.user
        .findUnique({
          where: { id: interaction.user.id },
          select: {
            uid: true,
            masterless: true,
            points: true,
          },
        })
        .then(async (data) => {
          if (!data) return;
          const response = await fetch(
            `http://localhost:14861/api?cmd=5003&region=dev_gio&ticket=GM&uid=${data.uid}`,
          );
          const res = await response.json();
          if (!res) return;
          return {
            ...data,
            primogems: res.data.hcoin,
            mora: res.data.scoin,
          };
        });
      if (!currency)
        return interaction.editReply(
          translate({ message: 'error:user:notfound', locale: locale }),
        );

      // Determine the shop type
      const shopType = interaction.options.getSubcommand();

      // Filter and sort items for the selected shop
      const sortedItems = ShopView.filter(
        (item: ShopItem) => item.type === shopType,
      ).sort((a: any, b: any) => a.item_id - b.item_id);

      // Generate the canvas image
      const attachment = await generateCanvas(page, sortedItems, currency);

      // Create pagination buttons
      const row = createPaginationRow(
        page,
        Math.ceil(sortedItems.length / ITEMS_PER_PAGE),
      );

      const selectMenus = createSelectMenus(sortedItems, locale, quantity);
      // Send the response with the canvas image and pagination buttons
      await interaction.editReply({
        files: [attachment],
        components: [...selectMenus, row],
      });

      // Fetch the reply to set up a collector for button interactions
      const fetchReply = await interaction.fetchReply();
      const collector = fetchReply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
      });

      // Handle button interactions for pagination
      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: 'This button is not for you!',
            flags: 'Ephemeral',
          });
        }

        if (i.customId === 'previous') page--;
        else if (i.customId === 'next') page++;

        const newAttachment = await generateCanvas(page, sortedItems, currency);

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

      // Clear components after the collector ends
      collector.on('end', async () => {
        await interaction.editReply({ components: [] });
      });

      const selectCollector = fetchReply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      selectCollector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: 'This menu is not for you!',
            flags: 'Ephemeral',
          });
          return;
        }

        const selectedItemId = i.values[0];
        const selectedItem = sortedItems.find(
          (item) => item.itemId.toString() === selectedItemId,
        );

        if (!selectedItem) {
          await i.reply({
            content: 'Item not found.',
            flags: 'Ephemeral',
          });
          return;
        }

        // Handle item purchase
        if (selectedItem.price > currency.mora) {
          await i.reply({
            content: 'You do not have enough currency to purchase this item.',
            flags: 'Ephemeral',
          });
          return;
        }
        const totalPrice: number = selectedItem.price * quantity;
        const confirmationEmbed = createConfirmationEmbed(
          selectedItem,
          quantity,
          totalPrice,
          locale,
        );
        const confirmationButtons = createConfirmationButtons();
        const fetchButton = await interaction.followUp({
          embeds: [confirmationEmbed],
          components: [confirmationButtons],
          flags: 'Ephemeral',
          withResponse: true,
        });
        const filter = (i: any) => i.user.id === interaction.user.id;
        const buttonCollector = fetchButton.createMessageComponentCollector({
          filter,
          componentType: ComponentType.Button,
          time: 15000,
        });

        buttonCollector.on('collect', async (i) => {
          if (i.customId === 'confirm') {
            // Handle the purchase logic
            if (selectedItem.price > currency.mora) {
              await i.reply({
                content:
                  'You do not have enough currency to purchase this item.',
              });
              return;
            } else {
              await prisma_discord.user.update({
                where: { id: interaction.user.id },
                data: {
                  mora: { decrement: selectedItem.price },
                },
              });
            }

            const description: string = translate({
              message: 'shop:view:thankyou:content',
              locale: locale,
            });
            const paimon_card = new AttachmentBuilder(
              './src/assets/image/paimon_card.png',
            ).setName('paimon_card.png');
            const paimon = new AttachmentBuilder(
              './src/assets/image/paimon.png',
            ).setName('paimon.png');
            const newEmbeds = new EmbedBuilder()
              .setTitle(
                translate({
                  message: 'shop:view:thankyou:title',
                  locale: locale,
                }),
              )
              .setDescription(description)
              .setImage('attachment://paimon_card.png')
              .setThumbnail('attachment://paimon.png')
              .addFields({
                name: locale === 'vi' ? 'Bạn đã mua' : 'Your purchase',
                value: `${quantity} x ${selectedItem.name[locale]} = ${formatter.format(totalPrice)} <:Mora:1184076471841599528>`,
              })
              .setFooter({
                text: 'PAIMON SHOP',
                iconURL:
                  'https://raw.githubusercontent.com/minhoag/wumps-impact/refs/heads/main/src/assets/image/footer.png',
              });

            await i.reply({
              embeds: [newEmbeds],
              files: [paimon_card, paimon],
            });
            await sendThankYouMail(
              selectedItem,
              totalPrice,
              quantity,
              currency.uid,
            );
          } else if (i.customId === 'cancel') {
            await i.reply({
              content: 'Purchase cancelled.',
              flags: 'Ephemeral',
            });
          }
        });
        const price: number = selectedItem.price * quantity;
        await sendThankYouMail(selectedItem, price, quantity, currency.uid);
      });

      selectCollector.on('end', async () => {
        await interaction.editReply({ components: [] });
      });
    }
  },
};

export default command;

// Create pagination buttons
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

// Formatter for currency values
let formatter = Intl.NumberFormat('en', { notation: 'compact' });

// Apply text to canvas with dynamic font size
const applyText = (canvas: any, text: string) => {
  const context = canvas.getContext('2d');
  let fontSize = 45;
  do {
    context.font = `${(fontSize -= 10)}px Genshin`;
  } while (context.measureText(text).width > canvas.width - 300);
  return context.font;
};

// Generate the canvas image for the shop
const generateCanvas = async (
  page: number,
  sortedItems: ShopItem[],
  currency: any,
) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const itemsToDisplay = sortedItems.slice(start, end);

  const canvas = Canvas.createCanvas(1800, 1000);
  const context = canvas.getContext('2d');
  const background = await Canvas.loadImage('./src/assets/bag/bag.png');
  context.drawImage(
    background as Canvas.Image,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  // Draw user currency on the canvas
  const drawCurrency = (
    canvas: Canvas.Canvas,
    context: Canvas.SKRSContext2D,
  ) => {
    context.font = applyText(canvas, '123123');
    context.fillStyle = '#000000';
    const height_currency = canvas.height / 4.25;
    context.fillText(
      currency.mora.toString(),
      canvas.width / 8.75,
      height_currency,
    );
    context.fillText(
      currency.primogems.toString(),
      canvas.width / 2.5,
      height_currency,
    );
    context.fillText(
      currency.points.toString(),
      canvas.width / 1.435,
      height_currency,
    );
  };

  drawCurrency(canvas, context);

  // Load item images and backgrounds
  const itemBackgrounds = await Promise.all(
    itemsToDisplay.map(async (item: ShopItem) => {
      const background = await Canvas.loadImage(
        `./src/assets/container/bg_item_${item.quality}.png`,
      );
      const itemImage = await Canvas.loadImage(
        `./src/assets/item/${item.itemId}.png`,
      );
      return {
        background,
        itemImage,
        amount: item.price.toString(),
      };
    }),
  );

  // Draw items on the canvas
  itemBackgrounds.forEach(({ background, itemImage, amount }, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const xOffset = 155 + col * 275;
    const yOffset = 320 + row * 325;
    context.drawImage(background, xOffset, yOffset, 239.05, 239.05);
    context.drawImage(itemImage, xOffset, yOffset, 239.05, 239.05);
    context.fillStyle = '#ffffff';
    amount = formatter.format(Number(amount)) ?? '0';
    const textWidth = context.measureText(amount).width;
    context.fillText(amount, xOffset + (239.05 - textWidth) / 2, yOffset + 220);
  });

  // Draw the username on the canvas
  context.fillStyle = '#FFFFFF';
  context.fillText(
    page.toString(),
    canvas.width / 1.0925,
    canvas.height / 17.7,
  );

  context.fillStyle = '#FFFFFF';
  context.fillText('/', canvas.width / 1.075, canvas.height / 17.7);

  context.fillStyle = '#FFFFFF';
  context.fillText(
    Math.ceil(sortedItems.length / ITEMS_PER_PAGE).toString(),
    canvas.width / 1.059,
    canvas.height / 17.7,
  );

  // Return the canvas as an attachment
  return new AttachmentBuilder(await canvas.encode('png'), {
    name: 'inventory.png',
  });
};

// Create select menu options
const createSelectMenuOptions = (
  items: ShopItem[],
  start: number,
  end: number,
  locale: Locale,
  quantity: number,
) => {
  const itemsToDisplay = items.slice(start, end);
  return itemsToDisplay.map((item) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(
        `${item.name[locale]} - ${formatter.format(item.price * quantity)}/${item.quantity * quantity} ${translate(
          {
            message: 'shop:view:unit',
            locale: locale,
          },
        )}`,
      )
      .setValue(item.itemId.toString()),
  );
};

const createSelectMenus = (
  items: ShopItem[],
  locale: Locale,
  quantity: number,
) => {
  const menus = [];
  for (let i = 0; i < items.length; i += 25) {
    const options = createSelectMenuOptions(items, i, i + 25, locale, quantity);
    const selectMenu =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`select-item-${i / 25}`)
          .setPlaceholder(
            translate({ message: 'shop:view:select', locale: locale }),
          )
          .addOptions(options),
      );
    menus.push(selectMenu);
  }
  return menus;
};

// Send thank you mail
export async function sendThankYouMail(
  item: ShopItem,
  price: number,
  quantity: number,
  uid: string,
) {
  const uuid: number = Date.now();
  const title: string = 'Thank you for your purchasing';
  const sender: string = 'P・A・I・M・O・N';
  const description: string =
    'Thank you very much for shopping with PAIMON SHOP. We hope you enjoy the game.';
  const seconds = dayjs().add(Number(365), 'days').unix();
  await fetch(
    `http://localhost:14861/api?region=dev_gio&ticket=GM@${uuid}&cmd=1135&uid=${uid}&scoin=${price}`,
  ).then(async () => {
    return fetch(
      `http://localhost:14861/api?sender=${sender}&title=${title}&content=${description}&item_list=${item.itemId}:${item.quantity * quantity}&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
    );
  });
}

// Function to create a confirmation embed
const createConfirmationEmbed = (
  item: ShopItem,
  quantity: number,
  price: number,
  locale: Locale,
) => {
  return embeds
    .setTitle('Confirm Purchase')
    .setDescription(
      locale === 'vi'
        ? `Bạn cá xác nhận muốn mua ${quantity} x ${item.name[locale]} giá tổng ${formatter.format(price)}?`
        : `Are you sure you want to buy ${quantity} x ${item.name[locale]} for ${formatter.format(price)}?`,
    )
    .setColor('#00FF00');
};

// Function to create confirmation buttons
const createConfirmationButtons = () => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger),
  );
};

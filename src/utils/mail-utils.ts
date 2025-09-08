import { EmbedType } from '@/type';
import {
  CommandInteraction,
  MessageFlags,
  ChannelType,
  TextChannel,
  ModalSubmitInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { GMUtils } from './gm-utils';
import { Item, type ItemProps } from '@/data/item';
import { DiscordResponse } from './discord-utils';

interface MailDraft {
  id: string;
  userId: string;
  uid: string;
  title: string;
  content: string;
  expiry: number;
  items: { id: string; name: string; count: number }[];
  createdAt: number;
}

const mailDrafts = new Map<string, MailDraft>();
const buttonDataCache = new Map<string, { draftId: string; itemId: string; itemName: string }>();

const getDraftForUser = (userId: string, draftId: string) => {
  const d = mailDrafts.get(draftId);
  return d && d.userId === userId ? d : undefined;
};

export const Mail = {
  mailDrafts,
  buttonDataCache,

  //--- Modal Interactions ---//
  handleMailInitModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
    if (interaction.replied || interaction.deferred) return;
    const uid = interaction.fields.getTextInputValue('uidInput');
    const title = interaction.fields.getTextInputValue('titleInput');
    const content = interaction.fields.getTextInputValue('contentInput');
    const expiryInput = interaction.fields.getTextInputValue('expiryInput') || '30';

    const expiry = parseInt(expiryInput);
    if (!Number.isFinite(expiry) || expiry <= 0) {
      await interaction.reply({
        content: 'Expiry must be a valid number of days (> 0)',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const draftId = `draft-${interaction.user.id}-${Date.now()}`;
    const draft: MailDraft = {
      id: draftId,
      userId: interaction.user.id,
      uid,
      title,
      content,
      expiry,
      items: [],
      createdAt: Date.now(),
    };
    mailDrafts.set(draftId, draft);
    await Mail.showDraftPanel(interaction, draft);
  },

  //--- Show Modal Interactions ---//
  showDraftPanel: async (
    interaction: ModalSubmitInteraction | ButtonInteraction,
    draft: MailDraft,
  ): Promise<void> => {
    const itemsText =
      draft.items.length > 0
        ? draft.items.map((item) => `• ${item.name} x${item.count}`).join('\n')
        : 'No items added yet';

    const draftEmbed = DiscordResponse.createEmbed({
      title: 'Mail Draft',
      type: EmbedType.INFO,
      fields: [
        { name: 'Recipient', value: draft.uid.toLowerCase() === 'all' ? 'All Players' : `UID: ${draft.uid}` },
        { name: 'Title', value: draft.title },
        { name: 'Content', value: draft.content.length > 200 ? draft.content.substring(0, 200) + '...' : draft.content },
        { name: 'Expiry', value: `${draft.expiry} days` },
        { name: 'Items', value: itemsText },
      ],
    });

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`mail-add-item-${draft.id}`).setLabel('➕ Add Item').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`mail-done-${draft.id}`).setLabel('✅ Done').setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`mail-clear-${draft.id}`)
        .setLabel('🗑️ Clear')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(draft.items.length === 0),
      new ButtonBuilder().setCustomId(`mail-cancel-draft-${draft.id}`).setLabel('❌ Cancel').setStyle(ButtonStyle.Danger),
    );

    if (interaction instanceof ModalSubmitInteraction) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [draftEmbed], components: [buttonRow], flags: MessageFlags.Ephemeral });
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.update({ embeds: [draftEmbed], components: [buttonRow] });
      }
    }
  },

  //--- Handle Modal Interactions ---//
  handleMailSearchModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
    if (interaction.replied || interaction.deferred) return;

    const draftId = interaction.customId.replace('mail-search-', '');
    const draft = getDraftForUser(interaction.user.id, draftId);
    if (!draft) {
      await interaction.reply({ content: 'Draft not found', flags: MessageFlags.Ephemeral });
      return;
    }

    const searchTerm = interaction.fields.getTextInputValue('searchInput').trim();

    // Handle empty search term
    if (!searchTerm) {
      await interaction.reply({
        content: 'Please enter a search term to find items.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const searchResults = Item.filter(
      (item) => item.name.toLowerCase().includes(searchTermLower) || item.value.includes(searchTerm),
    ).slice(0, 100); // allow more; paginated below

    if (searchResults.length === 0) {
      await interaction.reply({
        content: `No items found for "${searchTerm}". Try a different search term.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await Mail.showItemSelectMenu(interaction, draft, searchResults, 0);
  },
  
  //--- Show Item Select Menu ---//
  showItemSelectMenu: async (
    interaction: ModalSubmitInteraction | ButtonInteraction,
    draft: MailDraft,
    items: ItemProps[],
    page: number,
  ): Promise<void> => {
    const itemsPerPage = 25;
    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = items.slice(startIndex, endIndex);

    // Handle case when no items are available for the current page
    if (pageItems.length === 0) {
      const embed = DiscordResponse.createEmbed({
        title: '🔍 No Items Found',
        description: 'No items available on this page. Try going back to the previous page.',
        type: EmbedType.ERROR,
      });

      const components = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`mail-page-prev-${draft.id}-${page}`)
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`mail-back-to-draft-${draft.id}`)
            .setLabel('🔙 Back to Draft')
            .setStyle(ButtonStyle.Primary),
        ),
      ];

      if (interaction instanceof ModalSubmitInteraction) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [embed], components, flags: MessageFlags.Ephemeral });
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.update({ embeds: [embed], components });
        }
      }
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`mail-item-select-${draft.id}`)
      .setPlaceholder('Choose an item...')
      .addOptions(
        pageItems.map((item) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(item.name.length > 100 ? item.name.substring(0, 97) + '...' : item.name)
            .setDescription(`ID: ${item.value}`)
            .setValue(`${item.value}|${item.name}`),
        ),
      );

    const components: any[] = [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)];

    if (items.length > itemsPerPage) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`mail-page-prev-${draft.id}-${page}`)
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`mail-page-next-${draft.id}-${page}`)
            .setLabel('Next ▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(endIndex >= items.length),
          new ButtonBuilder()
            .setCustomId(`mail-back-to-draft-${draft.id}`)
            .setLabel('🔙 Back to Draft')
            .setStyle(ButtonStyle.Primary),
        ) as any,
      );
    }

    const embed = DiscordResponse.createEmbed({
      title: '🔍 Select Item',
      description: `Found ${items.length} items. Page ${page + 1}/${Math.ceil(items.length / itemsPerPage)}`,
      type: EmbedType.INFO,
    });

    if (interaction instanceof ModalSubmitInteraction) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [embed], components, flags: MessageFlags.Ephemeral });
      }
    } else {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.update({ embeds: [embed], components });
      }
    }
  },

  handleMailQuantityModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
    if (interaction.replied || interaction.deferred) return;

    const cacheKey = interaction.customId.replace('mail-quantity-', '');
    const cachedData = buttonDataCache.get(cacheKey);
    if (!cachedData) {
      await interaction.reply({ content: 'Modal expired', flags: MessageFlags.Ephemeral });
      return;
    }

    const { draftId, itemId, itemName } = cachedData;
    buttonDataCache.delete(cacheKey);

    const draft = getDraftForUser(interaction.user.id, draftId);
    if (!draft) {
      await interaction.reply({ content: 'Draft not found', flags: MessageFlags.Ephemeral });
      return;
    }

    const quantity = parseInt(interaction.fields.getTextInputValue('quantityInput'));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      await interaction.reply({ content: 'Quantity must be a positive number', flags: MessageFlags.Ephemeral });
      return;
    }

    const idx = draft.items.findIndex((i) => i.id === itemId);
    if (idx >= 0) draft.items[idx].count += quantity;
    else draft.items.push({ id: itemId, name: itemName, count: quantity });

    mailDrafts.set(draftId, draft);
    await Mail.showDraftPanel(interaction, draft);
  },

  handleMailButtonInteraction: async (interaction: ButtonInteraction): Promise<void> => {
    if (!interaction.customId.startsWith('mail-')) return;
    if (interaction.replied || interaction.deferred) return;

    if (interaction.customId.startsWith('mail-add-item-')) {
      const draftId = interaction.customId.replace('mail-add-item-', '');
      await Mail.showSearchModal(interaction, draftId);
      return;
    }

    if (interaction.customId.startsWith('mail-clear-')) {
      const draftId = interaction.customId.replace('mail-clear-', '');
      const draft = getDraftForUser(interaction.user.id, draftId);
      if (!draft) return;
      draft.items = [];
      mailDrafts.set(draftId, draft);
      await Mail.showDraftPanel(interaction, draft);
      return;
    }

    if (interaction.customId.startsWith('mail-cancel-draft-')) {
      const draftId = interaction.customId.replace('mail-cancel-draft-', '');
      mailDrafts.delete(draftId);
      await interaction.update({ content: 'Draft cancelled.', embeds: [], components: [] });
      return;
    }

    if (interaction.customId.startsWith('mail-done-')) {
      const draftId = interaction.customId.replace('mail-done-', '');
      const draft = getDraftForUser(interaction.user.id, draftId);
      if (!draft) return;
      await Mail.showMailPreview(interaction, draft);
      return;
    }

    if (interaction.customId.startsWith('mail-back-to-draft-')) {
      const draftId = interaction.customId.replace('mail-back-to-draft-', '');
      const draft = getDraftForUser(interaction.user.id, draftId);
      if (!draft) return;
      await Mail.showDraftPanel(interaction, draft);
      return;
    }

    if (interaction.customId.includes('-page-')) return;

    if (interaction.customId.startsWith('mail-qty-')) {
      const parts = interaction.customId.split('-');
      if (parts[2] === 'custom') {
        const cacheKey = parts.slice(3).join('-');
        const cachedData = buttonDataCache.get(cacheKey);
        if (!cachedData) {
          await interaction.reply({ content: 'Button expired', flags: MessageFlags.Ephemeral });
          return;
        }
        const { draftId, itemId, itemName } = cachedData;
        await Mail.showQuantityModal(interaction, draftId, itemId, itemName);
      } else {
        const quantity = parseInt(parts[2]);
        const cacheKey = parts.slice(3).join('-');
        const cachedData = buttonDataCache.get(cacheKey);
        if (!cachedData) {
          await interaction.reply({ content: 'Button expired', flags: MessageFlags.Ephemeral });
          return;
        }
        const { draftId, itemId, itemName } = cachedData;
        buttonDataCache.delete(cacheKey);
        await Mail.addItemToDraft(interaction, draftId, itemId, itemName, quantity);
      }
      return;
    }

    if (interaction.customId.startsWith('mail-preview-back-')) {
      const draftId = interaction.customId.replace('mail-preview-back-', '');
      const draft = getDraftForUser(interaction.user.id, draftId);
      if (!draft) return;
      await Mail.showDraftPanel(interaction, draft);
      return;
    }

    if (interaction.customId.startsWith('mail-preview-confirm-')) {
      const draftId = interaction.customId.replace('mail-preview-confirm-', '');
      await Mail.sendMailFromDraft(interaction, draftId);
      return;
    }
  },

  handleMailSelectMenuInteraction: async (interaction: StringSelectMenuInteraction): Promise<void> => {
    if (!interaction.customId.startsWith('mail-item-select-')) return;
    if (interaction.replied || interaction.deferred) return;

    const draftId = interaction.customId.replace('mail-item-select-', '');
    const draft = getDraftForUser(interaction.user.id, draftId);
    if (!draft) {
      await interaction.reply({ content: 'Draft not found', flags: MessageFlags.Ephemeral });
      return;
    }
    const [itemId, itemName] = interaction.values[0].split('|');
    await Mail.showQuantityPicker(interaction, draftId, itemId, itemName);
  },

  showSearchModal: async (interaction: ButtonInteraction, draftId: string): Promise<void> => {
    const modal = new ModalBuilder().setCustomId(`mail-search-${draftId}`).setTitle('Search Items');
    const searchInput = new TextInputBuilder()
      .setCustomId('searchInput')
      .setLabel('Search Term')
      .setPlaceholder('Enter item name or ID...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(searchInput));
    await interaction.showModal(modal);
  },

  showQuantityPicker: async (
    interaction: StringSelectMenuInteraction,
    draftId: string,
    itemId: string,
    itemName: string,
  ): Promise<void> => {
    if (interaction.replied || interaction.deferred) return;

    const embed = DiscordResponse.createEmbed({
      title: '🔢 Select Quantity',
      description: `How many **${itemName}** to add?`,
      type: EmbedType.INFO,
    });

    const cacheKey = `qty-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    buttonDataCache.set(cacheKey, { draftId, itemId, itemName });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`mail-qty-1-${cacheKey}`).setLabel('1').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`mail-qty-5-${cacheKey}`).setLabel('5').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`mail-qty-10-${cacheKey}`).setLabel('10').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`mail-qty-custom-${cacheKey}`).setLabel('Custom').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`mail-back-to-draft-${draftId}`).setLabel('🔙 Back').setStyle(ButtonStyle.Danger),
    );

    await interaction.update({ embeds: [embed], components: [row] });
  },

  showQuantityModal: async (
    interaction: ButtonInteraction,
    draftId: string,
    itemId: string,
    itemName: string,
  ): Promise<void> => {
    const cacheKey = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    buttonDataCache.set(cacheKey, { draftId, itemId, itemName });

    const modal = new ModalBuilder().setCustomId(`mail-quantity-${cacheKey}`).setTitle('Enter Quantity');
    const quantityInput = new TextInputBuilder()
      .setCustomId('quantityInput')
      .setLabel(`Quantity for ${itemName.length > 40 ? itemName.substring(0, 40) + '...' : itemName}`)
      .setPlaceholder('Enter a number...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(10)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput));
    await interaction.showModal(modal);
  },

  addItemToDraft: async (
    interaction: ButtonInteraction,
    draftId: string,
    itemId: string,
    itemName: string,
    quantity: number,
  ): Promise<void> => {
    const draft = getDraftForUser(interaction.user.id, draftId);
    if (!draft) {
      await interaction.reply({ content: 'Draft not found', flags: MessageFlags.Ephemeral });
      return;
    }
    const idx = draft.items.findIndex((i) => i.id === itemId);
    if (idx >= 0) draft.items[idx].count += quantity;
    else draft.items.push({ id: itemId, name: itemName, count: quantity });
    mailDrafts.set(draftId, draft);
    await Mail.showDraftPanel(interaction, draft);
  },

  showMailPreview: async (interaction: ButtonInteraction, draft: MailDraft): Promise<void> => {
    if (interaction.replied || interaction.deferred) return;

    const itemsText =
      draft.items.length > 0 ? draft.items.map((i) => `• ${i.name} x${i.count}`).join('\n') : 'No items';
    const expiryDate = new Date(Date.now() + draft.expiry * 24 * 60 * 60 * 1000);

    const previewEmbed = DiscordResponse.createEmbed({
      title: '📧 Mail Preview - Final Check',
      type: EmbedType.INFO,
      fields: [
        { name: 'Sender', value: 'P・A・I・M・O・N' },
        { name: 'Recipient', value: draft.uid.toLowerCase() === 'all' ? 'All Players' : `UID: ${draft.uid}` },
        { name: 'Title', value: draft.title },
        { name: 'Content', value: draft.content },
        { name: 'Items', value: itemsText },
        { name: 'Expires', value: expiryDate.toLocaleString() },
      ],
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`mail-preview-confirm-${draft.id}`).setLabel('✅ Send Mail').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`mail-preview-back-${draft.id}`).setLabel('🔙 Back to Draft').setStyle(ButtonStyle.Secondary),
    );

    await interaction.update({ embeds: [previewEmbed], components: [row] });
  },

  sendMailFromDraft: async (interaction: ButtonInteraction, draftId: string): Promise<void> => {
    const draft = getDraftForUser(interaction.user.id, draftId);
    if (!draft) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Draft not found', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate();
    }

    const itemList = draft.items.map((i) => `${i.id}:${i.count}`).join(',');
    try {
      const result =
        draft.uid.toLowerCase() === 'all'
          ? await GMUtils.sendMailToAll(draft.title, draft.content, itemList, draft.expiry)
          : await GMUtils.sendMailToPlayer(draft.uid, draft.title, draft.content, itemList, draft.expiry);

      mailDrafts.delete(draftId);

      const ok: boolean = result.msg === 'succ';
      const embed = DiscordResponse.createEmbed({
        title: ok ? '✅ Mail Sent Successfully' : '❌ Mail Send Failed',
        description: ok
          ? `Mail "${draft.title}" sent to ${draft.uid.toLowerCase() === 'all' ? 'all players' : `UID ${draft.uid}`}`
          : `Failed to send: ${result.msg || 'Unknown error'}`,
        type: ok ? EmbedType.SUCCESS : EmbedType.ERROR,
      });

      await interaction.editReply({ embeds: [embed], components: [] });

      await Mail.recordMailLog(interaction, {
        title: draft.title,
        content: draft.content,
        recipient: draft.uid.toLowerCase() === 'all' ? 'All Players' : `UID: ${draft.uid}`,
        items: JSON.stringify(draft.items),
        expiry: draft.expiry,
        success: ok,
      });
    } catch (e) {
      const embed = DiscordResponse.createEmbed({
        title: '❌ Mail Send Error',
        description: `Error sending mail.`,
        type: EmbedType.ERROR,
      });
      await interaction.editReply({ embeds: [embed], components: [] });
    }
  },

  recordMailLog: async (
    interaction: CommandInteraction | ButtonInteraction,
    mailDetails: {
      title: string;
      content: string;
      recipient: string;
      items: string;
      expiry: number;
      success: boolean;
    },
  ) => {
    let channel = interaction.guild?.channels.cache.find((c) => c.name === 'gm-mail-log') as TextChannel;
    if (!channel) {
      channel = (await interaction.guild?.channels.create({
        name: 'gm-mail-log',
        type: ChannelType.GuildText,
      })) as TextChannel;
    }

    const logEmbed = DiscordResponse.createEmbed({
      title: `📧 Mail ${mailDetails.success ? 'Sent' : 'Failed'}`,
      type: mailDetails.success ? EmbedType.SUCCESS : EmbedType.ERROR,
      fields: [
        { name: 'Sender (Discord)', value: `${interaction.user.username} (${interaction.user.id})` },
        { name: 'Sender (Game)', value: 'P・A・I・M・O・N' },
        { name: 'Title', value: mailDetails.title },
        {
          name: 'Content',
          value: mailDetails.content.length > 500 ? mailDetails.content.substring(0, 500) + '...' : mailDetails.content,
        },
        { name: 'Recipient', value: mailDetails.recipient },
        { name: 'Items', value: mailDetails.items || 'No items' },
        { name: 'Expiry', value: `${mailDetails.expiry} days` },
        { name: 'Timestamp', value: new Date().toISOString() },
      ],
    });

    await channel?.send({ embeds: [logEmbed] });
  },
};
import { EmbedType } from '@/type';
import {
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
import {
  mailDrafts,
  buttonDataCache,
  getDraft
} from './helper-utils';
import { UserPrisma } from './prisma-utils';

interface MailDraft {
  id: string;
  userId: string;
  uid: string;
  title: string;
  content: string;
  expiry: number;
  items: { id: string; name: string; count: number }[];
  createdAt: number;
  lastSearchTerm?: string;
  lastSearchResults?: any[];
  lastSearchPage?: number;
}

const ITEM_LIMITATIONS: Record<string, number> = {
  '201': 900, // Primogems - maximum 900 per item
};

const SENDER = 'P・A・I・M・O・N';

export const Mail = {
  mailDrafts,
  buttonDataCache,

  

  sendMailToPlayer: async (
    uid: string,
    title: string,
    content: string,
    item: string,
    expiry: number
  ) => {
    return await GMUtils.sendMail(uid, title, content, item, expiry);
  },

  sendMailToAll: async (
    title: string,
    content: string,
    item: string,
    expiry: number,
  ) => {
    const users = await UserPrisma.t_player_uid.findMany();
    const failedSent: string[] = [];
    let successCount = 0;
    for (const user of users) {
      const response = await GMUtils.sendMail(
        user.uid.toString(),
        title,
        content,
        item,
        expiry
      );
      if (response.data) {
        successCount++;
      } else {
        failedSent.push(user.uid.toString());
      }
    }
    return DiscordResponse.createEmbed({
      title: 'Send mail to all',
      description: successCount > 0 ? `Some mails failed to send` : '',
      type: EmbedType.INFO,
    });
  },

  addItemsToDraft: (draft: MailDraft, itemId: string, itemName: string, quantity: number) => {
    const limit = ITEM_LIMITATIONS[itemId];
    if (!limit || quantity <= limit) {
      const existing = draft.items.find(item => item.id === itemId);
      if (existing) existing.count += quantity;
      else draft.items.push({ id: itemId, name: itemName, count: quantity });
      return;
    }

    let remaining = quantity;
    while (remaining > 0) {
      const chunk = Math.min(remaining, limit);
      draft.items.push({ id: itemId, name: itemName, count: chunk });
      remaining -= chunk;
    }
  },

  handleMailInitModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
    await interaction.deferReply({ ephemeral: true });
    const uid = interaction.fields.getTextInputValue('uidInput');
    const title = interaction.fields.getTextInputValue('titleInput');
    const content = interaction.fields.getTextInputValue('contentInput');
    const expiryInput = interaction.fields.getTextInputValue('expiryInput') || '30';

    const expiry = parseInt(expiryInput);
    if (!Number.isFinite(expiry) || expiry <= 0) {
      await DiscordResponse.sendFailed(interaction, 'Expiry must be a valid number of days (> 0)');
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

  showDraftPanel: async (
    interaction: ModalSubmitInteraction | ButtonInteraction,
    draft: MailDraft,
  ): Promise<void> => {
    const itemsText = draft.items.length > 0
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
    await interaction.editReply({
      embeds: [draftEmbed],
      components: [buttonRow],
    });
  },

  handleMailSearchModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
    await interaction.deferReply({ ephemeral: true });
    const draftId = interaction.customId.replace('mail-search-', '');
    const draft = getDraft(interaction.user.id, draftId);
    const searchTerm = interaction.fields.getTextInputValue('searchInput').trim();
    if (!searchTerm) {
      await DiscordResponse.sendFailed(interaction, 'Please enter a search term to find items.');
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const searchResults = Item.filter(
      (item) => item.name.toLowerCase().includes(searchTermLower) || item.value.includes(searchTerm),
    ).slice(0, 100);

    if (searchResults.length === 0) {
      await DiscordResponse.sendFailed(interaction, `No items found for "${searchTerm}". Try a different search term.`);
      return;
    } else if (!draft) {
      await DiscordResponse.sendFailed(interaction, 'Draft not found');
      return;
    }

    draft.lastSearchTerm = searchTerm;
    draft.lastSearchResults = searchResults;
    draft.lastSearchPage = 0;
    mailDrafts.set(draftId, draft);

    await Mail.showItemSelectMenu(interaction, draft, searchResults, 0);
  },

  showItemSelectMenu: async (
    interaction: ModalSubmitInteraction | ButtonInteraction,
    draft: MailDraft,
    items: ItemProps[],
    page: number,
  ): Promise<void> => {
    draft.lastSearchPage = page;
    mailDrafts.set(draft.id, draft);

    const itemsPerPage = 25;
    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = items.slice(startIndex, endIndex);

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
            .setCustomId(`mail-new-search-${draft.id}`)
            .setLabel('🔍 New Search')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`mail-back-to-draft-${draft.id}`)
            .setLabel('📧 Back to Draft')
            .setStyle(ButtonStyle.Secondary),
        ),
      ];

      await interaction.editReply({
        embeds: [embed],
        components: components,
      });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`mail-item-select-${draft.id}`)
      .setPlaceholder('Choose an item...')
      .addOptions(
        pageItems.map((item, index) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(item.name.length > 100 ? item.name.substring(0, 97) + '...' : item.name)
            .setDescription(`ID: ${item.value}`)
            .setValue(`${item.value}|${item.name}|${startIndex + index}`),
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
            .setCustomId(`mail-new-search-${draft.id}`)
            .setLabel('🔍 New Search')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`mail-back-to-draft-${draft.id}`)
            .setLabel('📧 Back to Draft')
            .setStyle(ButtonStyle.Secondary),
        ),
      );
    } else {
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`mail-new-search-${draft.id}`)
            .setLabel('🔍 New Search')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`mail-back-to-draft-${draft.id}`)
            .setLabel('📧 Back to Draft')
            .setStyle(ButtonStyle.Secondary),
        ) as any,
      );
    }

    const embed = DiscordResponse.createEmbed({
      title: '🔍 Select Item',
      description: `Found ${items.length} items. Page ${page + 1}/${Math.ceil(items.length / itemsPerPage)}`,
      type: EmbedType.INFO,
    });

    await interaction.editReply({
      embeds: [embed],
      components: components,
    });
  },

  handleMailQuantityModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
    await interaction.deferReply({ ephemeral: true });
    const cacheKey = interaction.customId.replace('mail-quantity-', '');
    const cachedData = buttonDataCache.get(cacheKey);
    if (!cachedData) {
      await DiscordResponse.sendFailed(interaction, 'Modal expired');
      return;
    }

    const { draftId, itemId, itemName } = cachedData;
    buttonDataCache.delete(cacheKey);

    const draft = getDraft(interaction.user.id, draftId);
    if (!draft) {
      await DiscordResponse.sendFailed(interaction, 'Draft not found');
      return;
    }

    const quantity = parseInt(interaction.fields.getTextInputValue('quantityInput'));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      await DiscordResponse.sendFailed(interaction, 'Quantity must be a positive number');
      return;
    }

    Mail.addItemsToDraft(draft, itemId, itemName, quantity);

    mailDrafts.set(draftId, draft);
    await Mail.showDraftPanel(interaction, draft);
  },

  handleMailButtonInteraction: async (interaction: ButtonInteraction): Promise<void> => {
    if (!interaction.customId.startsWith('mail-')) return;
    const { customId } = interaction;
    
    if (customId.startsWith('mail-add-item-')) {
      const draftId = customId.replace('mail-add-item-', '');
      await Mail.showSearchModal(interaction, draftId);
      return;
    } else if (customId.startsWith('mail-qty-custom-')) {
      const cacheKey = customId.replace('mail-qty-custom-', '');
      const cachedData = buttonDataCache.get(cacheKey);
      if (cachedData) {
        const { draftId, itemId, itemName } = cachedData;
        await Mail.showQuantityModal(interaction, draftId, itemId, itemName);
      }
      return;
    } else if (customId.startsWith('mail-new-search-')) {
      const draftId = customId.replace('mail-new-search-', '');
      await Mail.showSearchModal(interaction, draftId);
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    if (customId.startsWith('mail-clear-')) {
      const draftId = customId.replace('mail-clear-', '');
      const draft = getDraft(interaction.user.id, draftId);
      if (draft) {
        draft.items = [];
        mailDrafts.set(draftId, draft);
        await Mail.showDraftPanel(interaction, draft);
      }
    } else if (customId.startsWith('mail-cancel-draft-')) {
      const draftId = customId.replace('mail-cancel-draft-', '');
      mailDrafts.delete(draftId);
    } else if (customId.startsWith('mail-done-')) {
      const draftId = customId.replace('mail-done-', '');
      const draft = getDraft(interaction.user.id, draftId);
      if (draft) await Mail.showMailPreview(interaction, draft);
    } else if (customId.startsWith('mail-back-to-draft-')) {
      const draftId = customId.replace('mail-back-to-draft-', '');
      const draft = getDraft(interaction.user.id, draftId);
      if (draft) await Mail.showDraftPanel(interaction, draft);
    } else if (customId.startsWith('mail-back-to-items-')) {
      const draftId = customId.replace('mail-back-to-items-', '');
      const draft = getDraft(interaction.user.id, draftId);
      if (draft && draft.lastSearchResults) {
        await Mail.showItemSelectMenu(interaction, draft, draft.lastSearchResults, draft.lastSearchPage || 0);
      } else {
        await Mail.showSearchModal(interaction, draftId);
      }
    } else if (customId.startsWith('mail-qty-') && !customId.includes('-custom-')) {
      const parts = customId.split('-');
      const quantity = parseInt(parts[2]);
      const cacheKey = parts.slice(3).join('-');
      const cachedData = buttonDataCache.get(cacheKey);
      if (cachedData) {
        const { draftId, itemId, itemName } = cachedData;
        buttonDataCache.delete(cacheKey);
        await Mail.addItemToDraft(interaction, draftId, itemId, itemName, quantity);
      } else {
        await DiscordResponse.sendFailed(interaction, 'Button expired');
      }
    } else if (customId.startsWith('mail-preview-back-')) {
      const draftId = customId.replace('mail-preview-back-', '');
      const draft = getDraft(interaction.user.id, draftId);
      if (draft) await Mail.showDraftPanel(interaction, draft);
    } else if (customId.startsWith('mail-preview-confirm-')) {
      const draftId = customId.replace('mail-preview-confirm-', '');
      await Mail.sendMailFromDraft(interaction, draftId);
    }
  },

  handleMailSelectMenuInteraction: async (interaction: StringSelectMenuInteraction): Promise<void> => {
    if (!interaction.customId.startsWith('mail-item-select-')) return;
    await interaction.deferReply({ ephemeral: true });
    const draftId = interaction.customId.replace('mail-item-select-', '');
    const draft = getDraft(interaction.user.id, draftId);
    if (!draft) {
      await DiscordResponse.sendFailed(interaction, 'Draft not found');
      return;
    }
    const [itemId, itemName] = interaction.values[0].split('|').slice(0, 2);
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
      new ButtonBuilder().setCustomId(`mail-back-to-items-${draftId}`).setLabel('🔙 Back to Items').setStyle(ButtonStyle.Secondary),
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
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
    const draft = getDraft(interaction.user.id, draftId);
    if (!draft) {
      await DiscordResponse.sendFailed(interaction, 'Draft not found');
      return;
    }
    Mail.addItemsToDraft(draft, itemId, itemName, quantity);
    mailDrafts.set(draftId, draft);
    await Mail.showDraftPanel(interaction, draft);
  },

  showMailPreview: async (interaction: ButtonInteraction, draft: MailDraft): Promise<void> => {
    const itemsText = draft.items.length > 0 ? draft.items.map((i) => `• ${i.name} x${i.count}`).join('\n') : 'No items';
    const expiryDate = new Date(Date.now() + draft.expiry * 24 * 60 * 60 * 1000);

    const previewEmbed = DiscordResponse.createEmbed({
      title: '📧 Mail Preview - Final Check',
      type: EmbedType.INFO,
      fields: [
        { name: 'Sender', value: SENDER },
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

    await interaction.editReply({
      embeds: [previewEmbed],
      components: [row],
    });
  },

  sendMailFromDraft: async (interaction: ButtonInteraction, draftId: string): Promise<void> => {
    const draft = getDraft(interaction.user.id, draftId);
    if (!draft) {
      await DiscordResponse.sendFailed(interaction, 'Draft not found');
      return;
    }

    const itemList = draft.items.map((i) => `${i.id}:${i.count}`).join(',');
    draft.uid.toLowerCase() === 'all'
        ? await Mail.sendMailToAll(draft.title, draft.content, itemList, draft.expiry)
        : await Mail.sendMailToPlayer(draft.uid, draft.title, draft.content, itemList, draft.expiry);
    
  },

  recordMailLog: async (
    interaction: any,
    mailDetails: {
      title: string;
      content: string;
      recipient: string;
      items: string;
      expiry: number;
      success: boolean;
    },
  ) => {
    if (!interaction.guild) return;

    let channel = interaction.guild.channels.cache.find((c: any) => c.name === 'gm-mail-log') as TextChannel;
    if (!channel) {
      channel = await interaction.guild.channels.create({
        name: 'gm-mail-log',
        type: ChannelType.GuildText,
      }) as TextChannel;
    }

    const logEmbed = DiscordResponse.createEmbed({
      title: `📧 Mail ${mailDetails.success ? 'Sent' : 'Failed'}`,
      type: mailDetails.success ? EmbedType.SUCCESS : EmbedType.ERROR,
      fields: [
        { name: 'Sender (Discord)', value: `${interaction.user.username} (${interaction.user.id})` },
        { name: 'Sender (Game)', value: SENDER },
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

    await channel.send({ embeds: [logEmbed] });
  },
};
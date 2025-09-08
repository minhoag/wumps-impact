import { EmbedType, ResponseType } from '@/type';
import {
  CommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  MessageFlags,
  type ColorResolvable,
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

const COOLDOWN_SEPARATOR = '-';

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

const getCooldownKey = (commandName: string, userId: string): string =>
  `${commandName}${COOLDOWN_SEPARATOR}${userId}`;

const getDraftForUser = (userId: string, draftId: string) => {
  const d = mailDrafts.get(draftId);
  return d && d.userId === userId ? d : undefined;
};

export const DiscordResponse = {
  createEmbed: (options: {
    title?: string;
    description?: string;
    type: EmbedType;
    fields?: { name: string; value: string }[];
    image?: string | null;
  }) => {
    const { title, description, type, fields, image } = options;
    const color: { [key in EmbedType]: ColorResolvable } = {
      SUCCESS: '#57F287' as ColorResolvable,
      ERROR: '#ED4245' as ColorResolvable,
      INFO: '#FEE75C' as ColorResolvable,
      DEFAULT: '#FEE75C' as ColorResolvable,
    };
    const embed = new EmbedBuilder();
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    embed.setColor(color[type]);
    if (fields) embed.addFields(fields);
    if (image) embed.setImage(image);
    return embed;
  },

  sendResponse: async (options: {
    interaction: CommandInteraction;
    types: ResponseType[];
    embed?: EmbedBuilder;
    content?: string;
  }) => {
    const { interaction, types, embed, content } = options;
    
    if (!interaction.isRepliable()) {
      console.warn('Attempted to respond to non-repliable interaction');
      return;
    }

    const response = {
      embeds: embed && types.includes(ResponseType.EMBED) ? [embed] : [],
      content: types.includes(ResponseType.STRING) ? content || '' : '',
      flags: types.includes(ResponseType.EPHEMERAL) ? MessageFlags.Ephemeral : 0,
    };

    try {
      if (interaction.replied) {
        console.warn('Interaction already replied to, skipping response');
        return;
      }
      
      if (interaction.deferred) {
        await interaction.editReply(response);
      } else {
        await interaction.reply(response);
      }
    } catch (error: any) {
      console.error('Failed to send response:', error);
      
      // If it's a 10008 error (Unknown Message), the interaction has expired
      if (error.code === 10008) {
        console.warn('Interaction has expired or is no longer valid');
        return;
      }
      
      // Re-throw other errors
      throw error;
    }
  },

  sendSuccess: async (
    interaction: CommandInteraction,
    messageOrOptions:
      | string
      | {
          message?: string;
          messageCode?: number;
          placeholders?: Record<string, string>;
          title?: string;
          ephemeral?: boolean;
          fields?: { name: string; value: string }[];
          image?: string;
        },
  ) => {
    const options =
      typeof messageOrOptions === 'string' ? { message: messageOrOptions } : messageOrOptions;

    const {
      message,
      messageCode,
      placeholders = {},
      title = 'Success',
      ephemeral = true,
      fields,
      image,
    } = options;

    let description = message;
    if (messageCode && !message) {
      description = DiscordResponse.getMessageByCode(
        'SUCCESS',
        messageCode,
        interaction.locale,
        placeholders,
      );
    } else if (message && Object.keys(placeholders).length > 0) {
      description = DiscordResponse.replacePlaceholders(message, placeholders);
    }

    const embed = DiscordResponse.createEmbed({
      title,
      description,
      type: EmbedType.SUCCESS,
      fields,
      image,
    });

    await DiscordResponse.sendResponse({
      interaction,
      types: [ResponseType.EMBED, ...(ephemeral ? [ResponseType.EPHEMERAL] : [])],
      embed,
    });
  },

  sendFailed: async (
    interaction: CommandInteraction,
    messageOrOptions:
      | string
      | {
          message?: string;
          messageCode?: number;
          placeholders?: Record<string, string>;
          title?: string;
          ephemeral?: boolean;
          fields?: { name: string; value: string }[];
          image?: string;
        },
  ) => {
    const options =
      typeof messageOrOptions === 'string' ? { message: messageOrOptions } : messageOrOptions;

    const {
      message,
      messageCode,
      placeholders = {},
      title = 'Failed',
      ephemeral = true,
      fields,
      image,
    } = options;

    let description = message;
    if (messageCode && !message) {
      description = DiscordResponse.getMessageByCode(
        'ERROR',
        messageCode,
        interaction.locale,
        placeholders,
      );
    } else if (message && Object.keys(placeholders).length > 0) {
      description = DiscordResponse.replacePlaceholders(message, placeholders);
    }

    const embed = DiscordResponse.createEmbed({
      title,
      description,
      type: EmbedType.ERROR,
      fields,
      image,
    });

    await DiscordResponse.sendResponse({
      interaction,
      types: [ResponseType.EMBED, ...(ephemeral ? [ResponseType.EPHEMERAL] : [])],
      embed,
    });
  },

  getMessageByCode: (
    category: 'SUCCESS' | 'ERROR' | 'API' | 'DICT',
    code: number | string,
    locale: string,
    placeholders: Record<string, string> = {},
  ): string => {
    const { SUCCESS_MESSAGE, ERROR_MESSAGE, API_MESSAGE, DICT } = require('@/constant/response');
    const map =
      category === 'SUCCESS'
        ? SUCCESS_MESSAGE
        : category === 'ERROR'
        ? ERROR_MESSAGE
        : category === 'API'
        ? API_MESSAGE
        : DICT;
    const message = map[code]?.[locale] || map[code]?.['en-US'] || 'Message not found';
    return DiscordResponse.replacePlaceholders(message, placeholders);
  },

  replacePlaceholders: (message: string, placeholders: Record<string, string>): string => {
    let result = message;
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  },
};

export const DiscordEvent = {
  handleChatInput: async (interaction: CommandInteraction): Promise<void> => {
    try {
      const { client, commandName, user } = interaction;
      const command = client.commands.get(commandName);
      if (!command) return;

      if (command.defer) await interaction.deferReply();

      if (command.cooldown) {
        const cooldownKey = getCooldownKey(commandName, user.id);
        const now = Date.now();
        const expiresAt = client.cooldowns.get(cooldownKey);
        if (expiresAt && now < expiresAt) {
          const timeLeft = ((expiresAt - now) / 1000).toFixed(1);
          await DiscordResponse.sendFailed(interaction, {
            messageCode: 101,
            placeholders: { time: timeLeft },
          });
          return;
        }
        client.cooldowns.set(cooldownKey, now + command.cooldown * 1000);
        setTimeout(() => client.cooldowns.delete(cooldownKey), command.cooldown * 1000);
      }
      await command.execute(interaction);
    } catch (error) {
      console.error('Error in handleChatInput:', error);
      
      // Try to respond with an error message
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while executing this command. Please try again.',
            ephemeral: true
          });
        } else if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({
            content: 'An error occurred while executing this command. Please try again.'
          });
        }
      } catch (responseError) {
        console.error('Failed to send error response for chat input:', responseError);
      }
    }
  },

  handleAutocomplete: async (interaction: AutocompleteInteraction): Promise<void> => {
    try {
      const { client, commandName } = interaction;
      const command = client.commands.get(commandName);
      if (!command?.autocomplete) return;
      await command.autocomplete(interaction, interaction.options.getFocused(true));
    } catch (error) {
      console.error('Error in handleAutocomplete:', error);
      // Autocomplete errors are handled differently - we don't send error messages
      // just log the error and let it fail silently
    }
  },

  handleModalSubmit: async (interaction: ModalSubmitInteraction): Promise<void> => {
    try {
      if (!interaction.isModalSubmit()) return;

      if (interaction.customId === 'mail-init') {
        await DiscordEvent.handleMailInitModal(interaction);
      } else if (interaction.customId.startsWith('mail-search-')) {
        await DiscordEvent.handleMailSearchModal(interaction);
      } else if (interaction.customId.startsWith('mail-quantity-')) {
        await DiscordEvent.handleMailQuantityModal(interaction);
      }
    } catch (error) {
      console.error('Error in handleModalSubmit:', error);
      await DiscordEvent.safeReply(interaction, { 
        content: 'An error occurred while processing your request. Please try again.', 
        ephemeral: true 
      });
    }
  },

  handleMailInitModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
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
    await DiscordEvent.showDraftPanel(interaction, draft);
  },

  showDraftPanel: async (
    interaction: ModalSubmitInteraction | ButtonInteraction,
    draft: MailDraft,
  ): Promise<void> => {
    const itemsText =
      draft.items.length > 0
        ? draft.items.map((item) => `• ${item.name} x${item.count}`).join('\n')
        : 'No items added yet';

    const draftEmbed = DiscordResponse.createEmbed({
      title: '📧 Mail Draft',
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
      await interaction.reply({ embeds: [draftEmbed], components: [buttonRow], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.update({ embeds: [draftEmbed], components: [buttonRow] });
    }
  },

  handleMailSearchModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
    const draftId = interaction.customId.replace('mail-search-', '');
    const draft = getDraftForUser(interaction.user.id, draftId);
    if (!draft) {
      await interaction.reply({ content: 'Draft not found', flags: MessageFlags.Ephemeral });
      return;
    }

    const searchTerm = interaction.fields.getTextInputValue('searchInput').toLowerCase();
    const searchResults = Item.filter(
      (item) => item.name.toLowerCase().includes(searchTerm) || item.value.includes(searchTerm),
    ).slice(0, 100); // allow more; paginated below

    if (searchResults.length === 0) {
      await interaction.reply({ content: `No items for "${searchTerm}"`, flags: MessageFlags.Ephemeral });
      return;
    }
    await DiscordEvent.showItemSelectMenu(interaction, draft, searchResults, 0);
  },

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
      await interaction.reply({ embeds: [embed], components, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.update({ embeds: [embed], components });
    }
  },

  handleMailQuantityModal: async (interaction: ModalSubmitInteraction): Promise<void> => {
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
    await DiscordEvent.showDraftPanel(interaction, draft);
  },

  handleButtonInteraction: async (interaction: ButtonInteraction): Promise<void> => {
    try {
      if (!interaction.customId.startsWith('mail-')) return;

      if (interaction.customId.startsWith('mail-add-item-')) {
        const draftId = interaction.customId.replace('mail-add-item-', '');
        await DiscordEvent.showSearchModal(interaction, draftId);
        return;
      }

      if (interaction.customId.startsWith('mail-clear-')) {
        const draftId = interaction.customId.replace('mail-clear-', '');
        const draft = getDraftForUser(interaction.user.id, draftId);
        if (!draft) {
          await DiscordEvent.safeReply(interaction, { content: 'Draft not found.', ephemeral: true });
          return;
        }
        draft.items = [];
        mailDrafts.set(draftId, draft);
        await DiscordEvent.showDraftPanel(interaction, draft);
        return;
      }

      if (interaction.customId.startsWith('mail-cancel-draft-')) {
        const draftId = interaction.customId.replace('mail-cancel-draft-', '');
        mailDrafts.delete(draftId);
        await DiscordEvent.safeUpdate(interaction, { content: 'Draft cancelled.', embeds: [], components: [] });
        return;
      }

      if (interaction.customId.startsWith('mail-done-')) {
        const draftId = interaction.customId.replace('mail-done-', '');
        const draft = getDraftForUser(interaction.user.id, draftId);
        if (!draft) {
          await DiscordEvent.safeReply(interaction, { content: 'Draft not found.', ephemeral: true });
          return;
        }
        await DiscordEvent.showMailPreview(interaction, draft);
        return;
      }

      if (interaction.customId.startsWith('mail-back-to-draft-')) {
        const draftId = interaction.customId.replace('mail-back-to-draft-', '');
        const draft = getDraftForUser(interaction.user.id, draftId);
        if (!draft) {
          await DiscordEvent.safeReply(interaction, { content: 'Draft not found.', ephemeral: true });
          return;
        }
        await DiscordEvent.showDraftPanel(interaction, draft);
        return;
      }

      if (interaction.customId.includes('-page-')) return;

      if (interaction.customId.startsWith('mail-qty-')) {
        const parts = interaction.customId.split('-');
        if (parts[2] === 'custom') {
          const cacheKey = parts.slice(3).join('-');
          const cachedData = buttonDataCache.get(cacheKey);
          if (!cachedData) {
            await DiscordEvent.safeReply(interaction, { content: 'Button expired', ephemeral: true });
            return;
          }
          const { draftId, itemId, itemName } = cachedData;
          await DiscordEvent.showQuantityModal(interaction, draftId, itemId, itemName);
        } else {
          const quantity = parseInt(parts[2]);
          const cacheKey = parts.slice(3).join('-');
          const cachedData = buttonDataCache.get(cacheKey);
          if (!cachedData) {
            await DiscordEvent.safeReply(interaction, { content: 'Button expired', ephemeral: true });
            return;
          }
          const { draftId, itemId, itemName } = cachedData;
          buttonDataCache.delete(cacheKey);
          await DiscordEvent.addItemToDraft(interaction, draftId, itemId, itemName, quantity);
        }
        return;
      }

      if (interaction.customId.startsWith('mail-preview-back-')) {
        const draftId = interaction.customId.replace('mail-preview-back-', '');
        const draft = getDraftForUser(interaction.user.id, draftId);
        if (!draft) {
          await DiscordEvent.safeReply(interaction, { content: 'Draft not found.', ephemeral: true });
          return;
        }
        await DiscordEvent.showDraftPanel(interaction, draft);
        return;
      }

      if (interaction.customId.startsWith('mail-preview-confirm-')) {
        const draftId = interaction.customId.replace('mail-preview-confirm-', '');
        await DiscordEvent.sendMailFromDraft(interaction, draftId);
        return;
      }
    } catch (error) {
      console.error('Error in handleButtonInteraction:', error);
      await DiscordEvent.safeReply(interaction, { 
        content: 'An error occurred while processing your request. Please try again.', 
        ephemeral: true 
      });
    }
  },

  handleSelectMenuInteraction: async (interaction: StringSelectMenuInteraction): Promise<void> => {
    try {
      if (!interaction.customId.startsWith('mail-item-select-')) return;
      const draftId = interaction.customId.replace('mail-item-select-', '');
      const draft = getDraftForUser(interaction.user.id, draftId);
      if (!draft) {
        await DiscordEvent.safeReply(interaction, { content: 'Draft not found', ephemeral: true });
        return;
      }
      const [itemId, itemName] = interaction.values[0].split('|');
      await DiscordEvent.showQuantityPicker(interaction, draftId, itemId, itemName);
    } catch (error) {
      console.error('Error in handleSelectMenuInteraction:', error);
      await DiscordEvent.safeReply(interaction, { 
        content: 'An error occurred while processing your request. Please try again.', 
        ephemeral: true 
      });
    }
  },

  // Safe reply method that handles expired interactions
  safeReply: async (interaction: any, options: any): Promise<void> => {
    try {
      if (!interaction.isRepliable()) {
        console.warn('Interaction is not repliable');
        return;
      }
      
      if (interaction.replied) {
        console.warn('Interaction already replied to');
        return;
      }
      
      if (interaction.deferred) {
        await interaction.editReply(options);
      } else {
        await interaction.reply(options);
      }
    } catch (error: any) {
      console.error('Failed to send safe reply:', error);
      if (error.code === 10008) {
        console.warn('Interaction has expired');
      }
    }
  },

  // Safe update method that handles expired interactions
  safeUpdate: async (interaction: any, options: any): Promise<void> => {
    try {
      if (!interaction.isRepliable()) {
        console.warn('Interaction is not repliable');
        return;
      }
      
      await interaction.update(options);
    } catch (error: any) {
      console.error('Failed to send safe update:', error);
      if (error.code === 10008) {
        console.warn('Interaction has expired');
      }
    }
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
    await DiscordEvent.showDraftPanel(interaction, draft);
  },

  showMailPreview: async (interaction: ButtonInteraction, draft: MailDraft): Promise<void> => {
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
      await interaction.reply({ content: 'Draft not found', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferUpdate();

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

      await DiscordEvent.recordMailLog(interaction, {
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

  recordEventLog: async (interaction: CommandInteraction, event: string) => {
    let channel = interaction.guild?.channels.cache.find((c) => c.name === 'event-log') as TextChannel;
    if (!channel) {
      channel = (await interaction.guild?.channels.create({
        name: 'event-log',
        type: ChannelType.GuildText,
      })) as TextChannel;
    }
    await channel?.send(`${interaction.user.username} - ${event}`);
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

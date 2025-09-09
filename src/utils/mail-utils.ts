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
  EmbedBuilder,
} from 'discord.js';
import { GMUtils } from './gm-utils';
import { Item, type ItemProps } from '@/data/item';
import { DiscordResponse } from './discord-utils';
import { buttonDataCache, deleteDraft, getDraft, setDraft } from './helper-utils';
import { UserPrisma } from './prisma-utils';
import { type MailDraft, ui, em } from './helper-utils';
const ITEM_LIMITATIONS: Record<string, number> = { '201': 900 };
const SENDER = 'P・A・I・M・O・N';

const sep = '│';
const brief = (t: string, n = 500) => (t.length > n ? t.slice(0, n) + '…' : t);

const draftEmbed = (i: any, d: MailDraft) =>
  DiscordResponse.createEmbed({
    title: `${em(i, 'Cas_working', '📝')} Mail Draft`,
    type: EmbedType.INFO,
    description: [
      `${em(i, 'Cas_person')} Recipient: ${d.uid.toLowerCase() === 'all' ? 'All Players' : `UID: ${d.uid}`}`,
      `${em(i, 'Cas_text')} Title: ${d.title}`,
      `${em(i, 'handwriting')} Content: ${brief(d.content, 200)}`,
      `${em(i, 'Cas_pointer')} Expiry: ${d.expiry} days`,
      '',
      // Decorative strip at the bottom
      `${em(i, 'VisionDendro')} ${em(i, 'AcquaintFate')} ${em(i, 'IntertwinedFate')} ${em(i, 'Mora')} ${em(i, 'Primogem')}`,
    ].join('\n'),
    fields: [
      {
        name: `${em(i, 'help')} Items`,
        value: d.items.length
          ? d.items.map(it => `• ${it.name} x${it.count}`).join('\n')
          : `${em(i, 'Cas_unavailable')} No items added yet`,
      },
    ],
  });

const previewEmbed = (i: any, d: MailDraft) =>
  DiscordResponse.createEmbed({
    title: `${em(i, 'tinhtran', '📧')}  Final Check`,
    type: EmbedType.INFO,
    description: [
      `${em(i, 'Cas_person', '👤')}  **Recipient:** ${d.uid.toLowerCase() === 'all' ? 'All Players' : `UID: ${d.uid}`}`,
      `${em(i, 'Cas_text', '🗒️')}  **Title:** ${d.title}`,
      `${em(i, 'handwriting', '✍️')}  **Content:** ${brief(d.content)}`,
      `${em(i, 'Cas_pointer', '⏳')}  **Expires:** ${new Date(Date.now() + d.expiry * 86400000).toLocaleString()}`,
      '',
      `${em(i, 'alternate', '✨')}  Review everything carefully, then hit **Send**.`,
    ].join('\n'),
    fields: [
      {
        name: `${em(i, 'help', '📦')} Items`,
        value: d.items.length ? d.items.map(x => `• ${x.name} x${x.count}`).join('\n') : 'No items',
      },
      { name: 'Sender', value: `${em(i, 'Cas_person', '👤')}  P・A・I・M・O・N` },
      { name: 'Mode', value: `${em(i, 'VisionDendro', '🌿')}  Standard` },
    ],
  });

const qtyEmbed = (i: any, name: string) =>
  DiscordResponse.createEmbed({
    title: `${em(i, 'Cas_text', '🔢')}  Select Quantity`,
    type: EmbedType.INFO,
    description: `${em(i, '2_', '✖️')}  How many **${name}** to add?`,
  });

const pageControls = (draftId: string, page: number, total: number, pageSize = 25) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`mail-page-prev-${draftId}-${page}`).setLabel('◀️ Previous').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
    new ButtonBuilder().setCustomId(`mail-page-next-${draftId}-${page}`).setLabel('Next ▶️').setStyle(ButtonStyle.Secondary).setDisabled((page + 1) * pageSize >= total),
    new ButtonBuilder().setCustomId(`mail-new-search-${draftId}`).setLabel('🔍 New Search').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`mail-back-to-draft-${draftId}`).setLabel('📧 Back to Draft').setStyle(ButtonStyle.Secondary),
  );

const draftControls = (d: MailDraft) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`mail-add-item-${d.id}`).setLabel('➕ Add Item').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`mail-done-${d.id}`).setLabel('✅ Done').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`mail-clear-${d.id}`).setLabel('🗑️ Clear').setStyle(ButtonStyle.Secondary).setDisabled(d.items.length === 0),
    new ButtonBuilder().setCustomId(`mail-cancel-draft-${d.id}`).setLabel('❌ Cancel').setStyle(ButtonStyle.Danger),
  );

const qtyControls = (draftId: string, itemId: string, itemName: string) => {
  const key = `qty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  buttonDataCache.set(key, { draftId, itemId, itemName });
  return {
    key,
    row: new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`mail-qty-1-${key}`).setLabel('1').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`mail-qty-5-${key}`).setLabel('5').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`mail-qty-10-${key}`).setLabel('10').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`mail-qty-custom-${key}`).setLabel('Custom').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`mail-back-to-items-${draftId}`).setLabel('🔙 Back to Items').setStyle(ButtonStyle.Secondary),
    ),
  };
};

const addItems = (d: MailDraft, id: string, name: string, qty: number) => {
  const limit = ITEM_LIMITATIONS[id];
  if (!limit || qty <= limit) {
    const ex = d.items.find(x => x.id === id);
    ex ? (ex.count += qty) : d.items.push({ id, name, count: qty });
    return;
  }
  for (let r = qty; r > 0; ) {
    const c = Math.min(r, limit);
    d.items.push({ id, name, count: c });
    r -= c;
  }
};

export const Mail = {
  buttonDataCache,

  sendMailToPlayer: (uid: string, title: string, content: string, item: string, expiry: number): Promise<boolean> =>
    GMUtils.sendMail(uid, title, content, item, expiry),

  sendMailToAll: async (title: string, content: string, item: string, expiry: number): Promise<EmbedBuilder> => {
    const users = await UserPrisma.t_player_uid.findMany();
    let ok = 0;
    for (const u of users) {
      const r = await GMUtils.sendMail(u.uid.toString(), title, content, item, expiry);
      if (r) ok++;
    }
    return DiscordResponse.createEmbed({
      title: 'Send mail to all',
      description: ok ? `Sent ${ok}/${users.length}` : '',
      type: EmbedType.INFO,
    });
  },

  handleMailInitModal: async (i: ModalSubmitInteraction) => {
    await i.deferReply({ ephemeral: true });
    const uid = i.fields.getTextInputValue('uidInput');
    const draft: MailDraft = {
      id: `draft-${i.user.id}-${Date.now()}`,
      userId: i.user.id,
      uid,
      title: i.fields.getTextInputValue('titleInput'),
      content: i.fields.getTextInputValue('contentInput'),
      expiry: parseInt(i.fields.getTextInputValue('expiryInput') || '30'),
      items: [],
      createdAt: Date.now(),
    };
    setDraft(draft.id, draft);
    await i.editReply({ embeds: [draftEmbed(i, draft)], components: [draftControls(draft)] });
  },

  showSearchModal: async (i: ButtonInteraction, draftId: string) => {
    const modal = new ModalBuilder().setCustomId(`mail-search-${draftId}`).setTitle('Search Items');
    const search = new TextInputBuilder()
      .setCustomId('searchInput')
      .setLabel('Search Term')
      .setPlaceholder('Enter item name or ID...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(search));
    await i.showModal(modal);
  },
  

  handleMailSearchModal: async (i: ModalSubmitInteraction) => {
    await i.reply({
      ephemeral: true,
      embeds: [
        DiscordResponse.createEmbed({
          title: '🔍 Select Item',
          description: 'Searching…',
          type: EmbedType.INFO,
        }),
      ],
      components: [],
    });
  
    const draftId = i.customId.replace('mail-search-', '');
    const draft = getDraft(i.user.id, draftId)!;
  
    const term = i.fields.getTextInputValue('searchInput').trim().toLowerCase();
    const results = Item.filter(x => x.name.toLowerCase().includes(term) || x.value.includes(term)).slice(0, 100);
  
    draft.lastSearchTerm = term;
    draft.lastSearchResults = results;
    draft.lastSearchPage = 0;
  
    const msg = await i.fetchReply();
    draft.pickerMsgId = (msg as any).id;
    setDraft(draft.id, draft);
    const payload = await Mail.itemPicker(draft, results, 0);
    await i.editReply(payload); 
  },
  
  

  itemPicker: async (draft: MailDraft, items: ItemProps[], page: number) => {
    draft.lastSearchPage = page;
    setDraft(draft.id, draft);
    const size = 25;
    const start = page * size;
    const pageItems = items.slice(start, start + size);
    const select = new StringSelectMenuBuilder()
      .setCustomId(`mail-item-select-${draft.id}`)
      .setPlaceholder('Choose an item...')
      .addOptions(
        pageItems.map((it, idx) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(it.name.length > 100 ? it.name.slice(0, 97) + '...' : it.name)
            .setDescription(`ID: ${it.value}`)
            .setValue(`${it.value}|${it.name}|${start + idx}`)
        )
      );
    const controls =
      items.length > size
        ? [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select), pageControls(draft.id, page, items.length, size)]
        : [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
           new ActionRowBuilder<ButtonBuilder>().addComponents(
             new ButtonBuilder().setCustomId(`mail-new-search-${draft.id}`).setLabel('🔍 New Search').setStyle(ButtonStyle.Primary),
             new ButtonBuilder().setCustomId(`mail-back-to-draft-${draft.id}`).setLabel('📧 Back to Draft').setStyle(ButtonStyle.Secondary),
           )];

    return {
      embeds: [
        DiscordResponse.createEmbed({
          title: 'Select Item',
          description: `Found ${items.length} items. Page ${page + 1}/${Math.ceil(items.length / size)}`,
          type: EmbedType.INFO,
        }),
      ],
      components: controls as any,
    };
  },

  handleMailSelectMenuInteraction: async (i: StringSelectMenuInteraction) => {
    if (!i.customId.startsWith('mail-item-select-')) return;
    const draftId = i.customId.replace('mail-item-select-', '');
    const [itemId, itemName] = i.values[0].split('|');
    const { row } = qtyControls(draftId, itemId, itemName);
    await ui(i, { embeds: [qtyEmbed(i, itemName)], components: [row] });
  },

  showQuantityModal: async (i: ButtonInteraction, draftId: string, itemId: string, itemName: string) => {
    const key = `modal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    buttonDataCache.set(key, { draftId, itemId, itemName });
    const modal = new ModalBuilder().setCustomId(`mail-quantity-${key}`).setTitle('Enter Quantity');
    const input = new TextInputBuilder()
      .setCustomId('quantityInput')
      .setLabel(`Quantity for ${itemName.length > 40 ? itemName.slice(0, 40) + '...' : itemName}`)
      .setPlaceholder('Enter a number...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(10)
      .setRequired(true);
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    await i.showModal(modal);
  },

  handleMailQuantityModal: async (i: ModalSubmitInteraction) => {
    await i.deferReply({ ephemeral: true });
    const key = i.customId.replace('mail-quantity-', '');
    const { draftId, itemId, itemName } = buttonDataCache.get(key)!;
    buttonDataCache.delete(key);
    const draft = getDraft(i.user.id, draftId)!;
    const qty = parseInt(i.fields.getTextInputValue('quantityInput'));
    addItems(draft, itemId, itemName, qty);
    setDraft(draft.id, draft);
    await i.editReply({ embeds: [draftEmbed(i, draft)], components: [draftControls(draft)] });
  },

  handleMailButtonInteraction: async (i: ButtonInteraction) => {
    if (!i.customId.startsWith('mail-')) return;
    const id = i.customId;

    if (id.startsWith('mail-add-item-')) return Mail.showSearchModal(i, id.replace('mail-add-item-', ''));
    if (id.startsWith('mail-new-search-')) return Mail.showSearchModal(i, id.replace('mail-new-search-', ''));
    if (id.startsWith('mail-qty-custom-')) {
      const key = id.replace('mail-qty-custom-', '');
      const { draftId, itemId, itemName } = buttonDataCache.get(key)!;
      return Mail.showQuantityModal(i, draftId, itemId, itemName);
    }

    if (id.startsWith('mail-qty-') && !id.includes('-custom-')) {
      const [, , qtyStr, ...rest] = id.split('-');
      const key = rest.join('-');
      const { draftId, itemId, itemName } = buttonDataCache.get(key)!;
      buttonDataCache.delete(key);
      const draft = getDraft(i.user.id, draftId)!;
      addItems(draft, itemId, itemName, parseInt(qtyStr));
      setDraft(draft.id, draft);
      return ui(i, { embeds: [draftEmbed(i, draft)], components: [draftControls(draft)] });
    }

    if (id.startsWith('mail-clear-')) {
      const draft = getDraft(i.user.id, id.replace('mail-clear-', ''))!;
      draft.items = [];
      setDraft(draft.id, draft);
      return ui(i, { embeds: [draftEmbed(i, draft)], components: [draftControls(draft)] });
    }

    if (id.startsWith('mail-cancel-draft-')) {
      deleteDraft(id.replace('mail-cancel-draft-', ''));
      return ui(i, { embeds: [DiscordResponse.createEmbed({ title: 'Draft canceled', type: EmbedType.INFO })], components: [] });
    }

    if (id.startsWith('mail-done-')) {
      const draft = getDraft(i.user.id, id.replace('mail-done-', ''))!;
      return ui(i, {
        embeds: [previewEmbed(i, draft)],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`mail-preview-confirm-${draft.id}`).setLabel('✅ Send Mail').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`mail-preview-back-${draft.id}`).setLabel('🔙 Back to Draft').setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    if (id.startsWith('mail-back-to-draft-')) {
      const draft = getDraft(i.user.id, id.replace('mail-back-to-draft-', ''))!;
      return ui(i, { embeds: [draftEmbed(i, draft)], components: [draftControls(draft)] });
    }

    if (id.startsWith('mail-back-to-items-')) {
      const draft = getDraft(i.user.id, id.replace('mail-back-to-items-', ''))!;
      return ui(i, await Mail.itemPicker(draft, draft.lastSearchResults!, draft.lastSearchPage || 0));
    }

    if (id.startsWith('mail-preview-back-')) {
      const draft = getDraft(i.user.id, id.replace('mail-preview-back-', ''))!;
      return ui(i, { embeds: [draftEmbed(i, draft)], components: [draftControls(draft)] });
    }

    if (id.startsWith('mail-preview-confirm-')) {
      const draft = getDraft(i.user.id, id.replace('mail-preview-confirm-', ''))!;
      const itemList = draft.items.map(x => `${x.id}:${x.count}`).join(',');
      draft.uid.toLowerCase() === 'all'
          ? await Mail.sendMailToAll(draft.title, draft.content, itemList, draft.expiry)
          : await Mail.sendMailToPlayer(draft.uid, draft.title, draft.content, itemList, draft.expiry);
      const embed = DiscordResponse.createEmbed({
        title: 'Mail Sent',
        description: 'Mail sent successfully',
        type: EmbedType.SUCCESS,
        fields: [
          { name: 'Sender (Discord)', value: `${i.user.username} (${i.user.id})` },
          { name: 'Sender (Game)', value: SENDER },
          { name: 'Title', value: draft.title },
          { name: 'Content', value: brief(draft.content) },
          { name: 'Recipient', value: draft.uid },
          { name: 'Items', value: itemList },
          { name: 'Expiry', value: `${draft.expiry} days` },
          { name: 'Timestamp', value: new Date().toISOString() },
        ],
      });
      return ui(i, { embeds: [embed], components: [] });
    }
  },

  recordMailLog: async (
    interaction: any,
    mail: { title: string; content: string; recipient: string; items: string; expiry: number; success: boolean }
  ) => {
    if (!interaction.guild) return;
    let channel = interaction.guild.channels.cache.find((c: any) => c.name === 'gm-mail-log') as TextChannel;
    if (!channel) channel = (await interaction.guild.channels.create({ name: 'gm-mail-log', type: ChannelType.GuildText })) as TextChannel;

    const embed = DiscordResponse.createEmbed({
      title: `📧 Mail ${mail.success ? 'Sent' : 'Failed'}`,
      type: mail.success ? EmbedType.SUCCESS : EmbedType.ERROR,
      fields: [
        { name: 'Sender (Discord)', value: `${interaction.user.username} (${interaction.user.id})` },
        { name: 'Sender (Game)', value: SENDER },
        { name: 'Title', value: mail.title },
        { name: 'Content', value: brief(mail.content) },
        { name: 'Recipient', value: mail.recipient },
        { name: 'Items', value: mail.items || 'No items' },
        { name: 'Expiry', value: `${mail.expiry} days` },
        { name: 'Timestamp', value: new Date().toISOString() },
      ],
    });

    await channel.send({ embeds: [embed] });
  },
};

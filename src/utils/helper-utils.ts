import type { ItemProps } from "@/data/item";
import type { ButtonInteraction } from "discord.js";

export interface MailDraft {
  id: string;
  userId: string;
  uid: string;
  title: string;
  content: string;
  expiry: number;
  items: { id: string; name: string; count: number }[];
  createdAt: number;
  lastSearchTerm?: string;
  lastSearchResults?: ItemProps[];
  lastSearchPage?: number;
  pickerMsgId?: string;
}

export const draftMap = new Map<string, MailDraft>();
export const buttonDataCache = new Map<string, { draftId: string; itemId: string; itemName: string }>();
export const processedInteractions = new Set<string>();

export const getDraft = (userId: string, draftId: string) => {
  const d = draftMap.get(draftId);
  return d && d.userId === userId ? d : undefined;
};

export const setDraft = (draftId: string, draft: MailDraft) => {
  draftMap.set(draftId, draft);
};

export const deleteDraft = (draftId: string) => {
  draftMap.delete(draftId);
};

export const ui = async (
  i: any,
  payload: Parameters<ButtonInteraction['update']>[0]
) => (i.isModalSubmit() ? i.editReply(payload) : (i as any).update(payload));
let EMJ: Record<string, string> = {};
export const em = (i: any, name: string, fallback = '') => {
  if (!i?.guild) return fallback;
  if (!EMJ[name]) {
    const found = i.guild.emojis.cache.find((e: any) => e.name === name);
    EMJ[name] = found ? found.toString() : fallback;
  }
  return EMJ[name];
};
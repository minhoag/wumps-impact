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

export const mailDrafts = new Map<string, MailDraft>();
export const buttonDataCache = new Map<string, { draftId: string; itemId: string; itemName: string }>();
export const processedInteractions = new Set<string>();

export const getDraft = (userId: string, draftId: string) => {
  const d = mailDrafts.get(draftId);
  return d && d.userId === userId ? d : undefined;
};
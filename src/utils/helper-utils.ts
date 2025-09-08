import { MessageFlags } from 'discord.js';

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

// Mail-related constants and maps
export const mailDrafts = new Map<string, MailDraft>();
export const buttonDataCache = new Map<string, { draftId: string; itemId: string; itemName: string }>();
export const processedInteractions = new Set<string>();

// Clean up processed interactions periodically (TTL ~30s)
setInterval(() => {
  processedInteractions.clear();
}, 30000);

// Helper functions
export const getDraftForUser = (userId: string, draftId: string) => {
  const d = mailDrafts.get(draftId);
  return d && d.userId === userId ? d : undefined;
};

// Check if interaction was already processed (PM2 race condition prevention)
export const isInteractionProcessed = (interactionId: string): boolean => {
  if (processedInteractions.has(interactionId)) {
    console.warn(`Interaction ${interactionId} already processed, skipping`);
    return true;
  }
  processedInteractions.add(interactionId);
  return false;
};

// Safe interaction response helper
export const safeReply = async (
  interaction: any,
  options: any,
  fallbackMessage?: string
): Promise<boolean> => {
  try {
    if (interaction.deferred) {
      await interaction.editReply(options);
    } else {
      await interaction.reply(options);
    }
    return true;
  } catch (error: any) {
    if (error.code === 10008 && fallbackMessage && !interaction.replied) {
      try {
        await interaction.followUp({ content: fallbackMessage, flags: MessageFlags.Ephemeral });
        return true;
      } catch (fallbackError) {
        console.error('Fallback response also failed:', fallbackError);
      }
    }
    throw error;
  }
};

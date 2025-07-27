import { CommandInteraction, Locale } from 'discord.js';
import { ENDPOINT, CONFIG, BASE_URL } from '@/constant/config';
import type { ItemOperation } from '@/interface';
import { CustomResponse } from '@/type';

interface ArtifactOperation {
  uid: string;
  itemId: string;
  level: number;
  // Accept either numeric ID or human-readable name for main stat
  mainPropId: number | string;
  // Optional array of sub-stat identifiers or names (can be empty)
  appendPropIdList?: (number | string)[];
}

//--- Mapping tables for artifact stats ----
const MAIN_STAT_IDS: Record<string, number> = {
  'crit rate': 30960,
  'crit damage': 30950,
  'healing bonus': 30940,
  'atk%': 50990,
  'hp%': 50980,
  'def%': 50970,
  'elemental mastery': 50880,
  'pyro dmg bonus': 50960,
  'electro dmg bonus': 50950,
  'cryo dmg bonus': 50940,
  'hydro dmg bonus': 50930,
  'anemo dmg bonus': 50920,
  'geo dmg bonus': 50910,
  'dendro dmg bonus': 50900,
  'physical dmg bonus': 50890,
};

const SUB_STAT_IDS: Record<string, number> = {
  'crit rate': 501204,
  'crit damage': 501224,
  'elemental mastery': 501244,
  'atk%': 501064,
  'hp%': 501034,
  'def%': 501094,
  atk: 501054,
  hp: 501024,
  def: 501084,
  'energy recharge': 501234,
};

//--- Helper functions ----
const normalize = (s: string) => s.trim().toLowerCase();

function resolveMainStatId(stat: number | string): number {
  if (typeof stat === 'number') return stat;
  if (/^\d+$/.test(stat)) return Number(stat);
  const id = MAIN_STAT_IDS[normalize(stat)];
  if (!id) throw new Error(`Unknown main stat: ${stat}`);
  return id;
}

function resolveSubStatId(stat: number | string): number {
  if (typeof stat === 'number') return stat;
  if (/^\d+$/.test(stat)) return Number(stat);
  const id = SUB_STAT_IDS[normalize(stat)];
  if (!id) throw new Error(`Unknown sub-stat: ${stat}`);
  return id;
}

//--- Substat value ranges (4 tiers) ----
const SUBSTAT_VALUES: Record<number, number[]> = {
  501204: [2.7, 3.1, 3.5, 3.9], // Crit Rate %
  501224: [5.4, 6.2, 7.0, 7.8], // Crit Damage %
  501244: [16, 19, 21, 23], // Elemental Mastery
  501064: [4.1, 4.7, 5.3, 5.8], // ATK %
  501034: [4.1, 4.7, 5.3, 5.8], // HP %
  501094: [5.1, 5.8, 6.6, 7.3], // DEF %
  501054: [14, 16, 18, 19], // ATK (flat)
  501024: [209, 239, 269, 299], // HP (flat)
  501084: [16, 19, 21, 23], // DEF (flat)
  501234: [4.5, 5.2, 5.8, 6.5], // Energy Recharge %
};

export const SUBSTAT_NAMES: Record<number, string> = {
  501204: 'Crit Rate',
  501224: 'Crit Damage',
  501244: 'Elemental Mastery',
  501064: 'ATK',
  501034: 'HP',
  501094: 'DEF',
  501054: 'ATK',
  501024: 'HP',
  501084: 'DEF',
  501234: 'Energy Recharge',
};

function generateRandomSubstatValue(statId: number): {
  value: number;
  displayValue: string;
} {
  const values = SUBSTAT_VALUES[statId];
  if (!values) {
    throw new Error(`Unknown substat ID: ${statId}`);
  }

  // Randomly select one of the 4 tiers
  const randomValue = values[Math.floor(Math.random() * values.length)];
  const statName = SUBSTAT_NAMES[statId];

  // Format display value based on stat type
  let displayValue: string;
  if ([501204, 501224, 501064, 501034, 501094, 501234].includes(statId)) {
    // Percentage stats
    displayValue = `${statName} +${randomValue}%`;
  } else {
    // Flat stats
    displayValue = `${statName} +${randomValue}`;
  }

  return { value: randomValue, displayValue };
}
import { DiscordEvent } from './discord-utils';
import { UserPrisma } from './prisma-utils';

export class GMUtils {
  private static readonly URL = `${BASE_URL}:${ENDPOINT.GM}/api?region=${CONFIG.REGION.DEV_GIO}`;

  private static generateTicket(): string {
    return `GM@${new Date().getTime().toString()}`;
  }

  private static async sendGMRequest(uid: string, command: string): Promise<CustomResponse> {
    try {
      const url = `${this.URL}&ticket=${this.generateTicket()}&cmd=${CONFIG.CMD.GM_TALK}&uid=${uid}&msg=${encodeURIComponent(command)}`;
      const response = await fetch(url);
      return new CustomResponse(response.ok, response.statusText ?? 'Unknown error');
    } catch (error) {
      console.error('GM request failed:', error);
      return new CustomResponse(
        false,
        `Failed to send GM request: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private static async sendMail(
    uid: string,
    title: string,
    content: string,
    item: string,
    expiry: number,
    interaction: CommandInteraction,
  ): Promise<CustomResponse> {
    try {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + expiry * 24 * 60 * 60 * 1000);
      const seconds = Math.floor(expiryDate.getTime() / 1000);
      const uuid = new Date().getTime();
      const url = `${BASE_URL}:${ENDPOINT.GM}/api?sender=${encodeURIComponent('P・A・I・M・O・N')}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}&item_list=${encodeURIComponent(item)}&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=${CONFIG.CMD.SEND_MAIL}&region=${CONFIG.REGION.DEV_GIO}&ticket=GM%40${seconds}&sign=${uuid}`;
      const response = await fetch(url);

      if (response.ok) {
        DiscordEvent.recordEventLog(interaction, `Successfully sent mail to UID ${uid}`);
        return new CustomResponse(true, `Mail sent successfully to UID ${uid}`);
      } else {
        return new CustomResponse(
          false,
          `Failed to send mail: ${response.statusText ?? 'Unknown error'}`,
        );
      }
    } catch (error) {
      console.error('Send mail failed:', error);
      return new CustomResponse(
        false,
        `Failed to send mail: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public static async sendMailToPlayer(
    uid: string,
    title: string,
    content: string,
    item: string,
    expiry: number,
    interaction: CommandInteraction,
  ): Promise<CustomResponse> {
    return await this.sendMail(uid, title, content, item, expiry, interaction);
  }

  public static async sendMailToAll(
    title: string,
    content: string,
    item: string,
    expiry: number,
    interaction: CommandInteraction,
  ): Promise<CustomResponse> {
    try {
      const users = await UserPrisma.t_player_uid.findMany();
      if (!users.length) {
        return new CustomResponse(false, 'No users found in database');
      }

      const failedUIDs: string[] = [];
      let successCount = 0;

      for (const user of users) {
        const response = await this.sendMail(
          user.uid.toString(),
          title,
          content,
          item,
          expiry,
          interaction,
        );
        if (response.success) {
          successCount++;
        } else {
          failedUIDs.push(user.uid.toString());
        }

        DiscordEvent.recordEventLog(
          interaction,
          `Successfully sent all mails to ${successCount} users`,
        );
      }
      return new CustomResponse(
        successCount > 0,
        failedUIDs.length > 0 ? `Some mails failed to send` : '',
      );
    } catch (error) {
      console.error('Send mail to all failed:', error);
      return new CustomResponse(
        false,
        `Failed to send mail to all: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public static async createArtifact(
    interaction: CommandInteraction,
    operation: ArtifactOperation,
  ): Promise<CustomResponse> {
    const { uid, itemId, level, mainPropId, appendPropIdList = [] } = operation;

    // Resolve main & sub stats to numeric IDs
    let mainPropNumeric: number;
    let appendPropNumeric: number[] = [];
    let generatedSubstats: { value: number; displayValue: string }[] = [];

    mainPropNumeric = resolveMainStatId(mainPropId);
    appendPropNumeric = appendPropIdList.map(resolveSubStatId);
    generatedSubstats = appendPropNumeric.map((statId) => generateRandomSubstatValue(statId));

    try {
      const ticket = this.generateTicket();
      const extraParams = {
        level,
        main_prop_id: mainPropNumeric,
        append_prop_id_list: appendPropNumeric,
      };

      const url = `${BASE_URL}:${ENDPOINT.GM}/api?region=${CONFIG.REGION.DEV_GIO}&ticket=${encodeURIComponent(ticket)}&cmd=${CONFIG.CMD.ADD_ITEM}&uid=${uid}&item_id=${itemId}&item_count=1&extra_params=${encodeURIComponent(JSON.stringify(extraParams))}`;
      const response = await fetch(url);
      if (response.ok) {
        // Get main stat name for display
        const mainStatName =
          Object.keys(MAIN_STAT_IDS).find((key) => MAIN_STAT_IDS[key] === mainPropNumeric) ||
          `ID:${mainPropNumeric}`;

        let message = `Successfully created Level ${level} Artifact ${itemId} for player ${uid}\n`;
        message += `Main Stat: ${mainStatName.charAt(0).toUpperCase() + mainStatName.slice(1)}`;

        if (generatedSubstats.length > 0) {
          message += `\nSubstats:`;
          generatedSubstats.forEach((substat) => {
            message += `\n  • ${substat.displayValue}`;
          });
        }
        DiscordEvent.recordEventLog(
          interaction,
          `Successfully created Level ${level} Artifact ${itemId} for player ${uid}. Stats: ${mainStatName} ${generatedSubstats.map((substat) => substat.displayValue).join(', ')}`,
        );
        return new CustomResponse(true, message);
      } else if (response.status === 1 && response.statusText === 'fail') {
        return new CustomResponse(
          false,
          `Failed to create artifact ${itemId} for player ${uid}: Operation failed`,
        );
      } else if (response.status === 1002 && response.statusText === 'para error') {
        return new CustomResponse(
          false,
          `Failed to create artifact ${itemId} for player ${uid}: Parameter error - check item ID, level, or property IDs`,
        );
      } else {
        return new CustomResponse(
          false,
          `Failed to create artifact ${itemId} for player ${uid}: ${response.statusText} (retcode: ${response.status})`,
        );
      }
    } catch (error) {
      console.error('Create artifact failed:', error);
      return new CustomResponse(
        false,
        `Failed to create artifact: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  public static async giveItem(
    interaction: CommandInteraction,
    operation: ItemOperation,
  ): Promise<CustomResponse> {
    const { uid, id, amount } = operation;
    const command = `item add ${id} ${amount}`;
    const response = await this.sendGMRequest(uid, command);
    const message = response.success
      ? `Successfully gave ${amount}x item ${id} to player ${uid}`
      : `Failed to give item to player ${uid}. Reason: ${response.message}`;
    DiscordEvent.recordEventLog(
      interaction,
      `Successfully gave ${amount}x item ${id} to player ${uid}`,
    );
    return new CustomResponse(response.success, message);
  }

  public static async deleteItem(
    interaction: CommandInteraction,
    operation: ItemOperation,
  ): Promise<CustomResponse> {
    const { uid, id, amount } = operation;
    const command = `item clear ${id} ${amount}`;
    const response = await this.sendGMRequest(uid, command);
    const message = response.success
      ? `Successfully removed ${amount}x item ${id} from player ${uid}`
      : `Failed to remove item from player ${uid}. Reason: ${response.message}`;
    DiscordEvent.recordEventLog(
      interaction,
      `Successfully removed ${amount}x item ${id} from player ${uid}`,
    );
    return new CustomResponse(response.success, message);
  }
}

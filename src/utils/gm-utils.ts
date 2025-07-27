import { CommandInteraction } from 'discord.js';
import { ENDPOINT, CONFIG, BASE_URL, RETCODE } from '@/constant/config';
import type { GMResponse, ItemOperation } from '@/interface';
import { CustomResponse } from '@/type';
import { DiscordEvent } from './discord-utils';
import { UserPrisma } from './prisma-utils';
import type { ArtifactOperation } from '@/interface';
import { normalize } from './utils';
import { MAIN_STAT_IDS, SUB_STAT_IDS, SUBSTAT_VALUES, SUBSTAT_NAMES, SUBSTAT_IS_PERCENTAGE } from '@/constant';

export class GMUtils {
  private static readonly REGION = CONFIG.REGION.DEV_GIO;
  private static readonly ENDPOINT = ENDPOINT.GM;
  private static readonly SENDER = 'P・A・I・M・O・N';

  //--- Give item ---
  public static async giveItem(
    interaction: CommandInteraction,
    operation: ItemOperation,
  ): Promise<GMResponse> {
    const { uid, id, amount } = operation;
    const ticket = this.generateTicket();
    const url = this.computeUrl({
      region: this.REGION,
      ticket: encodeURIComponent(ticket),
      cmd: CONFIG.CMD.ADD_ITEM,
      uid,
      item_id: id,
      item_count: amount,
    });
    const response: CustomResponse = await fetch(url).then(res => res.json());
    if (response.msg === "succ" && response.retcode === RETCODE.SUCCESS) {
      DiscordEvent.recordEventLog(
        interaction,
        `Successfully gave ${amount}x item ${id} to player ${uid}`,
      );
    }
    return {
      success: response.msg === 'succ',
      retcode: response.retcode || 0,
      msg: response.msg || 'Unknown Error'
    }
  }

  public static async deleteItem(
    interaction: CommandInteraction,
    operation: ItemOperation,
  ): Promise<GMResponse> {
    const { uid, id, amount } = operation;
    const ticket = this.generateTicket();
    const url = this.computeUrl({
      region: this.REGION,
      ticket: encodeURIComponent(ticket),
      cmd: CONFIG.CMD.DEL_ITEM,
      uid,
      item_id: id,
      item_num: amount,
    });
    console.log(url);
    const response: CustomResponse = await fetch(url).then(res => res.json());
    if (response.msg === 'succ' && response.retcode === RETCODE.SUCCESS) {
      DiscordEvent.recordEventLog(
        interaction,
        `Successfully removed ${amount}x item ${id} from player ${uid}`,
      );
    }
    return {
      success: response.msg === 'succ',
      retcode: response.retcode || 0,
      msg: response.msg || 'Unknown Error'
    }
  }

  public static async sendMailToPlayer(
    uid: string,
    title: string,
    content: string,
    item: string,
    expiry: number
  ): Promise<CustomResponse> {
    return await this.sendMail(uid, title, content, item, expiry);
  }

  public static async sendMailToAll(
    title: string,
    content: string,
    item: string,
    expiry: number,
  ): Promise<CustomResponse> {
    try {
      const users = await UserPrisma.t_player_uid.findMany();
      if (!users.length) {
        return new CustomResponse('No users found in database');
      }

      const failedUIDs: string[] = [];
      let successCount = 0;

      for (const user of users) {
        const response: CustomResponse = await this.sendMail(
          user.uid.toString(),
          title,
          content,
          item,
          expiry
        );
        if (response.data) {
          successCount++;
        } else {
          failedUIDs.push(user.uid.toString());
        }
      }
      return new CustomResponse(successCount > 0 ? `Some mails failed to send` : '');
    } catch (error) {
      console.error('Send mail to all failed:', error);
      return new CustomResponse(`Failed to send mail to all: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static async createArtifact(
    interaction: CommandInteraction,
    operation: ArtifactOperation,
  ): Promise<GMResponse> {
    const { uid, itemId, level, mainPropId, appendPropIdList = [] } = operation;

    // Resolve main & sub stats to numeric IDs
    let mainPropNumeric: number;
    let appendPropNumeric: number[] = [];
    let generatedSubstats: { value: number; displayValue: string }[] = [];

    mainPropNumeric = this.mainStatId(mainPropId);
    appendPropNumeric = appendPropIdList.map(this.subStatId);
    generatedSubstats = appendPropNumeric.map((statId) => this.randomSubstat(statId));

    try {
      const ticket = this.generateTicket();
      const extraParams = {
        level,
        main_prop_id: mainPropNumeric,
        append_prop_id_list: appendPropNumeric,
      };

      const url = this.computeUrl({
        region: this.REGION,
        ticket: encodeURIComponent(ticket),
        cmd: CONFIG.CMD.ADD_ITEM,
        uid,
        item_id: itemId,
        item_count: 1,
        extra_params: JSON.stringify(extraParams),
      });
      const response: CustomResponse = await fetch(url).then(res => res.json());
      if (response.msg === 'succ' && response.retcode === RETCODE.SUCCESS) {
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
        return {
          success: true,
          retcode: 0,
          msg: message,
        }
      }
      return {
        success: false,
        retcode: response.retcode || 500,
        msg: response.msg || 'Unknown Error',
      }
    } catch (error) {
      console.error('Create artifact failed:', error);
      return {
        success: false,
        retcode: 500,
        msg: `Failed to create artifact: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  private static generateTicket(): string {
    return `GM@${new Date().getTime().toString()}`;
  }
  private static mainStatId(stat: number | string): number {
    if (typeof stat === 'number') return stat;
    if (/^\d+$/.test(stat)) return Number(stat);
    const id = MAIN_STAT_IDS[normalize(stat)];
    if (!id) throw new Error(`Unknown main stat: ${stat}`);
    return id;
  };
  
  private static subStatId(stat: number | string): number {
    if (typeof stat === 'number') return stat;
    if (/^\d+$/.test(stat)) return Number(stat);
    const id = SUB_STAT_IDS[normalize(stat)];
    if (!id) throw new Error(`Unknown sub-stat: ${stat}`);
    return id;
  }
  
    private static randomSubstat(statId: number): {
    value: number;
    displayValue: string;
  } {
    const values = SUBSTAT_VALUES[statId];
    const statName = SUBSTAT_NAMES[statId];
    const isPercentage = SUBSTAT_IS_PERCENTAGE[statId];

    if (!values || !statName || isPercentage === undefined) {
      throw new Error(`Unknown substat ID: ${statId}`);
    }

    const randomValue = values[Math.floor(Math.random() * values.length)];
    const displayValue = `${statName} +${randomValue}${isPercentage ? '%' : ''}`;
    return { value: randomValue, displayValue };
  }
  
  private static computeUrl(params: Record<string, string | number>): string {
    const url = new URL(`${BASE_URL}:${this.ENDPOINT}/api?region=${this.REGION}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value.toString());
    });
    return url.toString();
  }

  private static async sendMail(
    uid: string,
    title: string,
    content: string,
    item: string,
    expiry: number
  ): Promise<CustomResponse> {
    try {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + expiry * 24 * 60 * 60 * 1000);
      const seconds = Math.floor(expiryDate.getTime() / 1000);
      const uuid = new Date().getTime();
      const url = this.computeUrl({
        sender: encodeURIComponent(this.SENDER),
        title: encodeURIComponent(title),
        content: encodeURIComponent(content),
        item_list: encodeURIComponent(item),
        expire_time: seconds,
        is_collectible: 'False',
        uid,
        cmd: CONFIG.CMD.SEND_MAIL,
        region: this.REGION,
        ticket: `GM%40${seconds}`,
        sign: uuid,
      });
      const response: CustomResponse = await fetch(url).then(res => res.json());

      if (response.data) {
        return new CustomResponse(response.data, `Mail sent successfully to UID ${uid}`, response.retcode, response.ticket);
      } else {
        return new CustomResponse(
          response.data,
          `Failed to send mail: ${response.msg ?? 'Unknown error'}`,
          response.retcode,
          response.ticket,
        );
      }
    } catch (error) {
      console.error('Send mail failed:', error);
      return new CustomResponse(`Failed to send mail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
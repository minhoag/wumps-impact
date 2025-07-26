import { CommandInteraction, Locale } from 'discord.js';
import { ENDPOINT, CONFIG, BASE_URL } from '@/constant/config';
import type {
  GMOperationResult,
  ItemOperation,
  CurrencyOperation,
} from '@/interface';
import { DiscordEvent } from './discord-utils';
import { UserPrisma } from './prisma-utils';

export class GMUtils {
  private static readonly URL = `${BASE_URL}:${ENDPOINT.GM}/api?region=${CONFIG.REGION.DEV_GIO}`;

  private static generateTicket(): string {
    return `GM@${new Date().getTime().toString()}`;
  }

  private static async sendGMRequest(
    uid: string,
    command: string,
  ): Promise<boolean> {
    try {
      const url = `${this.URL}&ticket=${this.generateTicket()}&cmd=${CONFIG.CMD.GM_TALK}&uid=${uid}&msg=${encodeURIComponent(command)}`;
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error('GM request failed:', error);
      return false;
    }
  }

  private static async sendMail(
    uid: string,
    title: string,
    content: string,
    item: string,
    expiry: number,
  ): Promise<GMOperationResult> {
    try {
      const seconds =
        Math.floor(Date.now() / 1000) + expiry * 24 * 60 * 60; // Convert days to seconds from now
      const uuid = new Date().getTime();
      const ticket = `GM%40${seconds}`;

      const url = `${BASE_URL}:${ENDPOINT.GM}/api?sender=${encodeURIComponent('P・A・I・M・O・N')}&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}&item_list=${encodeURIComponent(item)}&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=${CONFIG.CMD.SEND_MAIL}&region=${CONFIG.REGION.DEV_GIO}&ticket=${ticket}&sign=${uuid}`;

      const response = await fetch(url);
      const json = await response.json();

      if (json.msg === 'succ') {
        return {
          success: true,
          message: `Mail sent successfully to UID ${uid}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to send mail: ${json.msg}`,
        };
      }
    } catch (error) {
      console.error('Send mail failed:', error);
      return {
        success: false,
        message: `Failed to send mail: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  public static async sendMailToPlayer(
    uid: string,
    title: string,
    content: string,
    item: string,
    expiry: number,
  ): Promise<GMOperationResult> {
    return await this.sendMail(uid, title, content, item, expiry);
  }

  public static async sendMailToAll(
    title: string,
    content: string,
    item: string,
    expiry: number,
  ): Promise<{
    success: boolean;
    message?: string;
    successCount: number;
    failedUIDs: string[];
  }> {
    try {
      const users = await UserPrisma.t_player_uid.findMany();

      if (!users.length) {
        return {
          success: false,
          message: 'No users found in database',
          successCount: 0,
          failedUIDs: [],
        };
      }

      const failedUIDs: string[] = [];
      let successCount = 0;

      for (const user of users) {
        const result = await this.sendMail(
          user.uid.toString(),
          title,
          content,
          item,
          expiry,
        );
        if (result.success) {
          successCount++;
        } else {
          failedUIDs.push(user.uid.toString());
        }
      }

      return {
        success: successCount > 0,
        successCount,
        failedUIDs,
        message:
          failedUIDs.length > 0
            ? `Some mails failed to send`
            : undefined,
      };
    } catch (error) {
      console.error('Send mail to all failed:', error);
      return {
        success: false,
        message: `Failed to send mail to all: ${error instanceof Error ? error.message : 'Unknown error'}`,
        successCount: 0,
        failedUIDs: [],
      };
    }
  }

  public static async giveItem(
    interaction: CommandInteraction,
    operation: ItemOperation,
  ): Promise<GMOperationResult> {
    const { uid, id, amount } = operation;
    const command = `item add ${id} ${amount}`;
    const success = await this.sendGMRequest(uid, command);
    DiscordEvent.recordEventLog(
      interaction,
      `Successfully gave ${amount}x item ${id} to player ${uid}`,
    );
    return {
      success,
      message: success
        ? `Successfully gave ${amount}x item ${id} to player ${uid}`
        : `Failed to give item to player ${uid}`,
    };
  }

  public static async deleteItem(
    operation: ItemOperation,
  ): Promise<GMOperationResult> {
    const { uid, id, amount } = operation;
    const command = `item clear ${id} ${amount}`;
    const success = await this.sendGMRequest(uid, command);

    return {
      success,
      message: success
        ? `Successfully removed ${amount}x item ${id} from player ${uid}`
        : `Failed to remove item from player ${uid}`,
    };
  }
}

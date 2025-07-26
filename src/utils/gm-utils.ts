import { Locale } from 'discord.js';
import { ENDPOINT, CONFIG, BASE_URL } from '@/constant/config';
import type { GMOperationResult, ItemOperation, CurrencyOperation } from '@/interface';

export class GMUtils {
    private static readonly URL = `${BASE_URL}${ENDPOINT.GM}/api?region=${CONFIG.REGION.DEV_GIO}`

  private static generateTicket(): string {
    return `GM@${new Date().getTime().toString()}`;
  }

  private static async sendGMRequest(
    uid: string,
    command: string
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

  public static async giveItem(operation: ItemOperation): Promise<GMOperationResult> {
    const { uid, id, amount } = operation;
    const command = `item add ${id} ${amount}`;
    const success = await this.sendGMRequest(uid, command);
    
    return {
      success,
      message: success 
        ? `Successfully gave ${amount}x item ${id} to player ${uid}`
        : `Failed to give item to player ${uid}`
    };
  }

  public static async deleteItem(operation: ItemOperation): Promise<GMOperationResult> {
    const { uid, id, amount } = operation;
    const command = `item clear ${id} ${amount}`;
    const success = await this.sendGMRequest(uid, command);
    
    return {
      success,
      message: success 
        ? `Successfully removed ${amount}x item ${id} from player ${uid}`
        : `Failed to remove item from player ${uid}`
    };
  }

  public static async transferCurrency(operation: CurrencyOperation): Promise<GMOperationResult> {
    const { uid, type, amount } = operation;
    const command = `${type} ${amount}`;
    
    const success = await this.sendGMRequest(uid, command);
    
    return {
      success,
      message: success 
        ? `Successfully transferred ${amount} ${type} to player ${uid}`
        : `Failed to transfer currency to player ${uid}`
    };
  }

  public static async takeawayCurrency(operation: CurrencyOperation): Promise<GMOperationResult> {
    const { uid, type, amount } = operation;
    const command = `${type} ${amount}`;
    
    const success = await this.sendGMRequest(uid, command);
    
    return {
      success,
      message: success 
        ? `Successfully removed ${amount} ${type} from player ${uid}`
        : `Failed to remove currency from player ${uid}`
    };
  }

  public static getCurrencyDisplayName(type: string, locale: Locale = Locale.Vietnamese): string {
    const names: Record<string, Record<string, string>> = {
      mcoin: {
        [Locale.Vietnamese]: 'Đá sáng thế',
        [Locale.EnglishUS]: 'Primogem'
      },
      scoin: {
        [Locale.Vietnamese]: 'Mora',
        [Locale.EnglishUS]: 'Mora'
      },
      hcoin: {
        [Locale.Vietnamese]: 'Nguyên thạch',
        [Locale.EnglishUS]: 'Genesis Crystal'
      },
      home_coin: {
        [Locale.Vietnamese]: 'Tiền Động Tiên',
        [Locale.EnglishUS]: 'Realm Currency'
      },
      submcoin: {
        [Locale.Vietnamese]: 'Đá sáng thế',
        [Locale.EnglishUS]: 'Primogem'
      },
      subscoin: {
        [Locale.Vietnamese]: 'Mora',
        [Locale.EnglishUS]: 'Mora'
      },
      subhcoin: {
        [Locale.Vietnamese]: 'Nguyên thạch',
        [Locale.EnglishUS]: 'Genesis Crystal'
      },
      subhome_coin: {
        [Locale.Vietnamese]: 'Tiền Động Tiên',
        [Locale.EnglishUS]: 'Realm Currency'
      }
    };

    return names[type]?.[locale] || names[type]?.[Locale.Vietnamese] || type;
  }

  public static translate(message: string, locale: Locale = Locale.Vietnamese): string {
    const translations: Record<string, Record<string, string>> = {
      'admin:give:success': {
        [Locale.Vietnamese]: 'Đã gửi item thành công cho người chơi UID ',
        [Locale.EnglishUS]: 'Successfully gave item to player UID '
      },
      'admin:give:error': {
        [Locale.Vietnamese]: 'Lỗi khi gửi item cho người chơi UID ',
        [Locale.EnglishUS]: 'Error giving item to player UID '
      },
      'admin:delete:success': {
        [Locale.Vietnamese]: 'Đã xóa item thành công của người chơi UID ',
        [Locale.EnglishUS]: 'Successfully removed item from player UID '
      },
      'admin:delete:error': {
        [Locale.Vietnamese]: 'Lỗi khi xóa item của người chơi UID ',
        [Locale.EnglishUS]: 'Error removing item from player UID '
      },
      'error:unknown': {
        [Locale.Vietnamese]: 'Lỗi không xác định: ',
        [Locale.EnglishUS]: 'Unknown error: '
      }
    };

    return translations[message]?.[locale] || translations[message]?.[Locale.Vietnamese] || message;
  }
}

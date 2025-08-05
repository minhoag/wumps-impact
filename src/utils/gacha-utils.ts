import type { GachaScheduleData } from '@/interface';
import type { GachaResponse } from '@/type';
import { ConfigPrisma, DiscordPrisma } from '@/utils/prisma-utils';

export class GachaUtils {
  private options: GachaScheduleData;
  private scheduleData: any;

  constructor(options: GachaScheduleData, scheduleData: any) {
    this.options = options;
    this.scheduleData = scheduleData;
  }

  //--- Helper functions ----
  private SORT_ID = { 200: 1000, 301: 9000, 400: 8000, 302: 7000, 202: 1002 };
  //--- Get the probability rule for the gacha type ----
  private getProbabilityRule(gachaType: number): number {
    switch (gachaType) {
      case 301:
      case 400:
        return 1;
      case 202:
      case 302:
        return 2;
      default:
        return 3;
    }
  }

  //--- Generate the prefab path for the gacha ----
  private generatePrefabPath(gachaData: any): string {
    return gachaData.prefabPath;
  }

  //--- Generate the title textmap for the gacha ----
  private generateTitleTextmap(gachaData: any): string {
    return gachaData.titlePath;
  }

  //--- Generate the gacha up config for the gacha ----
  private getGachaUpConfig(gachaData: any): string {
    const rateUpItems4 = gachaData.rateUpItems4;
    const rateUpItems5 = gachaData.rateUpItems5;
    const items4Array = rateUpItems4
      ? rateUpItems4.split(',').map((id: string) => parseInt(id.trim(), 10))
      : [];
    const items5Array = rateUpItems5
      ? rateUpItems5.split(',').map((id: string) => parseInt(id.trim(), 10))
      : [];

    return JSON.stringify({
      gacha_up_list: [
        { item_parent_type: 2, prob: 500, item_list: items4Array },
        { item_parent_type: 1, prob: 500, item_list: items5Array },
      ],
    });
  }

  //--- Generate the sort id for the gacha ----
  private generateSortId(type: number): number {
    return this.SORT_ID[type as keyof typeof this.SORT_ID];
  }

  //--- Main function ----
  //--- Create a gacha schedule in the game server ----
  public async create(): Promise<GachaResponse> {
    const startTime = this.options.begin_time;
    const endTime = this.options.end_time;
    const gachaData = this.scheduleData;

    const costItemId = this.options.gacha_type === 200 ? 224 : 223;
    const rateUpItems4 = gachaData.rateUpItems4;
    try {
      const data = await ConfigPrisma.t_gacha_schedule_config.create({
        data: {
          gacha_type: this.options.gacha_type,
          begin_time: startTime,
          end_time: endTime,
          cost_item_id: costItemId,
          cost_item_num: 1,
          gacha_pool_id: this.options.gacha_type === 200 ? 101 : 201,
          gacha_prob_rule_id: this.getProbabilityRule(this.options.gacha_type),
          gacha_up_config: this.getGachaUpConfig(gachaData),
          gacha_rule_config: '{}',
          gacha_prefab_path: this.generatePrefabPath(gachaData),
          gacha_preview_prefab_path: 'UI_Tab_' + this.generatePrefabPath(gachaData),
          //TODO: create actual url
          gacha_prob_url: 'http://localhost/',
          gacha_record_url: 'http://localhost/',
          gacha_prob_url_oversea: 'http://localhost/',
          gacha_record_url_oversea: 'http://localhost/',
          gacha_sort_id: this.generateSortId(this.options.gacha_type),
          enabled: this.options.enabled,
          title_textmap: this.generateTitleTextmap(gachaData),
          display_up4_item_list: rateUpItems4
            ? rateUpItems4
                .split(',')
                .map((id: string) => parseInt(id.trim(), 10))
                .join(',')
            : '',
        },
      });
      return {
        schedule_id: data.schedule_id,
        gacha_type: data.gacha_type,
      };
    } catch (error) {
      return {
        schedule_id: 0,
        gacha_type: 0,
      };
    }
  }

  public async update(): Promise<GachaResponse> {
    try {
      await ConfigPrisma.t_gacha_schedule_config.update({
        where: { schedule_id: this.options.schedule_id },
        //--- Only allow update basic information ----
        data: {
          begin_time: this.options.begin_time,
          end_time: this.options.end_time,
          enabled: this.options.enabled,
        },
      });
      await DiscordPrisma.t_discord_gacha_schedule.update({
        where: { id: this.options.schedule_id },
        data: {
          beginTime: this.options.begin_time,
          endTime: this.options.end_time
        },
      });
      return {
        schedule_id: this.options.schedule_id ?? 0,
        gacha_type: this.options.gacha_type ?? 0,
      };
    } catch (error) {
      return {
        schedule_id: 0,
        gacha_type: 0,
      };
    }
  }

  public async delete(): Promise<GachaResponse> {
    try {
      await ConfigPrisma.t_gacha_schedule_config.delete({
        where: { schedule_id: this.options.schedule_id },
      });
      await DiscordPrisma.t_discord_gacha_schedule.delete({
        where: { id: this.options.schedule_id },
      });
      return {
        schedule_id: this.options.schedule_id ?? 0,
        gacha_type: this.options.gacha_type ?? 0,
      };
    } catch (error) {
      return {
        schedule_id: 0,
        gacha_type: 0,
      };
    }
  }
}

import type { GachaOptions } from '@/interface';
import { ConfigPrisma } from '@/utils/prisma-utils';
import { parseDuration } from '@/utils/utils';

export const ServerUtils = {
  async createGachaSchedule(
    options: GachaOptions,
    scheduleData?: any,
  ) {
    const startTime = options.start
      ? new Date(options.start)
      : new Date();
    const durationMs = parseDuration(options.duration || '2 weeks');
    const endTime = new Date(startTime.getTime() + durationMs);
    const selectedSchedule = scheduleData || {};
    const costItemId = [301, 400].includes(options.type) ? 223 : 223;

    const getProbabilityRule = (gachaType: number): number => {
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
    };

    const generatePrefabPath = (eventName: string): string => {
      const sanitizedName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      return (
        selectedSchedule.prefabPath ||
        `GachaShowPanel_${sanitizedName}`
      );
    };

    const generateTitleTextmap = (eventName: string): string => {
      const sanitizedName = eventName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toUpperCase();
      return (
        selectedSchedule.titlePath ||
        `UI_GACHA_SHOW_PANEL_${sanitizedName}_TITLE`
      );
    };

    const getGachaUpConfig = (): string => {
      if (
        selectedSchedule.rateUpItems4 ||
        selectedSchedule.rateUpItems5
      ) {
        return JSON.stringify({
          gacha_up_list: [
            ...(selectedSchedule.rateUpItems5
              ? [
                  {
                    item_parent_type: 1,
                    prob: 500,
                    item_list: selectedSchedule.rateUpItems5,
                  },
                ]
              : []),
            ...(selectedSchedule.rateUpItems4
              ? [
                  {
                    item_parent_type: 2,
                    prob: 500,
                    item_list: selectedSchedule.rateUpItems4,
                  },
                ]
              : []),
          ],
        });
      }
      return '{}';
    };

    const generateSortId = (gachaType: number): number => {
      const baseSort = {
        301: 1000,
        400: 2000,
        202: 3000,
        302: 4000,
      };
      return (
        (baseSort[gachaType as keyof typeof baseSort] || 5000) +
        (Math.floor(Date.now() / 1000) % 1000)
      );
    };

    await ConfigPrisma.t_gacha_schedule_config.create({
      data: {
        gacha_type: options.type,
        begin_time: startTime,
        end_time: endTime,
        cost_item_id: costItemId,
        cost_item_num: 1,
        gacha_pool_id: 201,
        gacha_prob_rule_id: getProbabilityRule(options.type),
        gacha_up_config: getGachaUpConfig(),
        gacha_rule_config: '{}',
        gacha_prefab_path: generatePrefabPath(options.name),
        gacha_preview_prefab_path:
          generatePrefabPath(options.name) + '_Preview',
        gacha_prob_url: 'http://localhost/',
        gacha_record_url: 'http://localhost/',
        gacha_prob_url_oversea: 'http://localhost/',
        gacha_record_url_oversea: 'http://localhost/',
        gacha_sort_id: generateSortId(options.type),
        enabled: options.enable,
        title_textmap: generateTitleTextmap(options.name),
        display_up4_item_list: selectedSchedule.rateUpItems4
          ? selectedSchedule.rateUpItems4.join(',')
          : '',
      },
    });
  },
};

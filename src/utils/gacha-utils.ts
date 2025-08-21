import type { GachaCollection } from '@/interface';
import { ConfigPrisma } from '@/utils/prisma-utils';

export enum GachaType {
  CHARACTER_1 = 301,
  CHARACTER_2 = 300,
  WEAPON_1 = 302,
  WEAPON_2 = 200,
}

export class Gacha {
  private options;
  private SORT_ID = { 202: 1002, 302: 1003, 201: 1004, 301: 1005, 400: 1006 };
  private GachaPoolId = {
    [GachaType.CHARACTER_1]: 201,
    [GachaType.CHARACTER_2]: 201,
    [GachaType.WEAPON_1]: 201,
    [GachaType.WEAPON_2]: 201,
  };
  private CostItemId = {
    [GachaType.CHARACTER_1]: 223,
    [GachaType.CHARACTER_2]: 223,
    [GachaType.WEAPON_1]: 223,
    [GachaType.WEAPON_2]: 223,
  };
  constructor(options: {
    id: number;
    gacha_type?: GachaType;
    begin_time?: Date;
    end_time?: Date;
    enabled?: number;
    data?: any;
  }) {
    this.options = options;
  }
  //--- Create a gacha schedule in the game server ----
  public async create() {
    const id = this.options.id;
    const startTime = this.options.begin_time ?? new Date();
    const endTime = this.options.end_time ?? new Date(startTime.getTime() + 14 * 24 * 60 * 60 * 1000);
    const enabled = this.options.enabled ?? 1;
    //--- Extract data ---
    const gachaCollection = this.options.data;
    const data = gachaCollection.find((item: GachaCollection) => item.value == id.toString());
    if (!data) {
      return this.error('Gacha collection not found');
    }

    //--- Check for conflicts with existing gacha schedules ----
    const overlaps = await this.overlaps(startTime, endTime, this.options.gacha_type!, data);
    if (overlaps.length > 0) {
      return this.error('Gacha conflicts detected: ' + overlaps.join(', '));
    }
    //--- Validate required params ---
    if (!this.options.gacha_type) {
      return this.error('Gacha type is required');
    }
    if (!this.options.data) {
      return this.error('Character database is required');
    }
    if (!this.options.begin_time) {
      return this.error('Begin time is required');
    }
    if (!this.options.end_time) {
      return this.error('End time is required');
    }
    // Note: enabled can be 0 (disabled), so check for undefined instead
    if (this.options.enabled === undefined) {
      return this.error('Enabled status is required');
    }
    //--- Create gacha schedule ----
    await ConfigPrisma.t_gacha_schedule_config.create({
      data: {
        gacha_type: this.options.gacha_type,
        begin_time: startTime,
        end_time: endTime,
        cost_item_id: this.CostItemId[this.options.gacha_type],
        cost_item_num: 1, // always 1
        gacha_pool_id: this.GachaPoolId[this.options.gacha_type],
        gacha_prob_rule_id: this.getProbabilityRule(this.options.gacha_type),
        gacha_up_config: this.getGachaUpConfig(data),
        gacha_rule_config: '{}',
        gacha_prefab_path: this.generatePrefabPath(data),
        gacha_preview_prefab_path: 'UI_Tab_' + this.generatePrefabPath(data),
        //TODO: create actual url
        gacha_prob_url: 'http://localhost/',
        gacha_record_url: 'http://localhost/',
        gacha_prob_url_oversea: 'http://localhost/',
        gacha_record_url_oversea: 'http://localhost/',
        gacha_sort_id: this.generateSortId(this.options.gacha_type),
        enabled: enabled,
        title_textmap: this.generateTitleTextmap(data),
        display_up4_item_list: data.rateUpItems4
          ? data.rateUpItems4
              .split(',')
              .map((id: string) => parseInt(id.trim(), 10))
              .join(',')
          : '',
      },
    });
    return this.success(data.name, data);
  }
  //--- Update a gacha schedule in the game server ----
  public async update(schedule_id: number) {
    try {
      // Get the existing schedule to check its gacha type and config
      const existingSchedule = await ConfigPrisma.t_gacha_schedule_config.findUnique({
        where: { schedule_id: schedule_id },
      });

      if (!existingSchedule) {
        return this.error('Schedule not found');
      }

      // If updating time, check for conflicts (excluding the current schedule)
      if (this.options.begin_time && this.options.end_time) {
        const conflicts = await this.overlapsForUpdate(
          schedule_id,
          this.options.begin_time,
          this.options.end_time,
          existingSchedule.gacha_type,
          existingSchedule.gacha_up_config
        );
        
        if (conflicts.length > 0) {
          return this.error('Update conflicts detected: ' + conflicts.join(', '));
        }
      }

      await ConfigPrisma.t_gacha_schedule_config.update({
        where: { schedule_id: schedule_id },
        //--- Only allow update basic information ----
        data: {
          begin_time: this.options.begin_time,
          end_time: this.options.end_time,
          enabled: this.options.enabled,
        },
      });
      return this.success('Update success', null);
    } catch (error) {
      return this.error('Failed. ' + error);
    }
  }
  //--- Delete a gacha schedule in the game server ----
  public async delete(schedule_id: number) {
    try {
      await ConfigPrisma.t_gacha_schedule_config.delete({
        where: { schedule_id: schedule_id },
      });
      return this.success('Delete success', null);
    } catch (error) {
      return this.error('Failed. ' + error);
    }
  }
  //--- Check for gacha conflicts based on business rules ----
  public async overlaps(startTime: Date, endTime: Date, gachaType: GachaType, gachaData: any): Promise<string[]> {
    const conflicts: string[] = [];
    
    // Get all active gacha schedules that overlap with the requested time period
    const overlappingSchedules = await ConfigPrisma.t_gacha_schedule_config.findMany({
      where: {
        begin_time: { lte: endTime },
        end_time: { gte: startTime },
        enabled: 1, // Only check enabled schedules
      },
    });

    if (overlappingSchedules.length === 0) {
      return conflicts; // No conflicts if no overlapping schedules
    }

    // Rule 1: Same gacha type cannot overlap in time
    const sameTypeSchedules = overlappingSchedules.filter(schedule => schedule.gacha_type === gachaType);
    if (sameTypeSchedules.length > 0) {
      conflicts.push(`Same gacha type ${gachaType} already active (Schedule IDs: ${sameTypeSchedules.map(s => s.schedule_id).join(', ')})`);
    }

    // Rule 2: Same 5* rate-up items cannot be active simultaneously
    const newRateUp5Items = this.parseItemList(gachaData.rateUpItems5);
    if (newRateUp5Items.length > 0) {
      for (const schedule of overlappingSchedules) {
        const existingRateUp5Items = this.extractRateUpItems(schedule.gacha_up_config, 1); // item_parent_type: 1 for 5*
        const duplicateItems = newRateUp5Items.filter(item => existingRateUp5Items.includes(item));
        
        if (duplicateItems.length > 0) {
          conflicts.push(`5* rate-up items [${duplicateItems.join(', ')}] already active in Schedule ID ${schedule.schedule_id}`);
        }
      }
    }

    // Rule 3: Validate weapon banner has only 1 weapon (for weapon gacha types)
    if (this.isWeaponGachaType(gachaType)) {
      if (newRateUp5Items.length !== 1) {
        conflicts.push(`Weapon banner must have exactly 1 rate-up weapon, found ${newRateUp5Items.length}`);
      }
    }

    return conflicts;
  }

  //--- Helper: Parse comma-separated item list (matches existing getGachaUpConfig pattern) ----
  private parseItemList(itemString?: string): number[] {
    return itemString
      ? itemString.split(',').map((id: string) => parseInt(id.trim(), 10))
      : [];
  }

  //--- Helper: Extract rate-up items from gacha_up_config JSON ----
  private extractRateUpItems(gachaUpConfig: string, itemParentType: number): number[] {
    try {
      if (!gachaUpConfig || gachaUpConfig === '{}') return [];
      
      const config = JSON.parse(gachaUpConfig);
      const targetGroup = config.gacha_up_list?.find((group: any) => group.item_parent_type === itemParentType);
      
      return targetGroup?.item_list || [];
    } catch (error) {
      console.warn('Failed to parse gacha_up_config:', gachaUpConfig, error);
      return [];
    }
  }

  //--- Helper: Check if gacha type is weapon type ----
  private isWeaponGachaType(gachaType: GachaType): boolean {
    return gachaType === GachaType.WEAPON_1 || gachaType === GachaType.WEAPON_2;
  }

  //--- Check for overlaps when updating a gacha schedule ----
  private async overlapsForUpdate(
    excludeScheduleId: number,
    startTime: Date,
    endTime: Date,
    gachaType: number,
    existingGachaUpConfig: string
  ): Promise<string[]> {
    const conflicts: string[] = [];
    
    // Get all active gacha schedules that overlap with the requested time period (excluding current one)
    const overlappingSchedules = await ConfigPrisma.t_gacha_schedule_config.findMany({
      where: {
        schedule_id: { not: excludeScheduleId },
        begin_time: { lte: endTime },
        end_time: { gte: startTime },
        enabled: 1,
      },
    });

    if (overlappingSchedules.length === 0) {
      return conflicts;
    }

    // Rule 1: Same gacha type cannot overlap in time
    const sameTypeSchedules = overlappingSchedules.filter(schedule => schedule.gacha_type === gachaType);
    if (sameTypeSchedules.length > 0) {
      conflicts.push(`Same gacha type ${gachaType} already active (Schedule IDs: ${sameTypeSchedules.map(s => s.schedule_id).join(', ')})`);
    }

    // Rule 2: Same 5* rate-up items cannot be active simultaneously
    const currentRateUp5Items = this.extractRateUpItems(existingGachaUpConfig, 1);
    if (currentRateUp5Items.length > 0) {
      for (const schedule of overlappingSchedules) {
        const existingRateUp5Items = this.extractRateUpItems(schedule.gacha_up_config, 1);
        const duplicateItems = currentRateUp5Items.filter(item => existingRateUp5Items.includes(item));
        
        if (duplicateItems.length > 0) {
          conflicts.push(`5* rate-up items [${duplicateItems.join(', ')}] already active in Schedule ID ${schedule.schedule_id}`);
        }
      }
    }

    return conflicts;
  }

  public error(message: string) {
    return {
      success: false,
      message,
      data: null,
    };
  }

  public success(message: string, data: any) {
    return {
      success: true,
      message,
      data: data,
    };
  }

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
  private getGachaUpConfig(rateUpData: any): string {
    const rateUpItems4 = rateUpData.rateUpItems4;
    const rateUpItems5 = rateUpData.rateUpItems5;
    // map data
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
}

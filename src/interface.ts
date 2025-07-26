export interface GachaScheduleData {
  schedule_id?: number;
  gacha_type: number;
  begin_time: Date;
  end_time: Date;
  cost_item_id?: number;
  cost_item_num?: number;
  gacha_pool_id?: number;
  gacha_prob_rule_id?: number;
  gacha_up_config?: string;
  gacha_rule_config?: string;
  gacha_prefab_path?: string;
  gacha_preview_prefab_path?: string;
  gacha_prob_url?: string;
  gacha_record_url?: string;
  gacha_prob_url_oversea?: string;
  gacha_record_url_oversea?: string;
  gacha_sort_id?: number;
  enabled: number;
  title_textmap?: string;
  display_up4_item_list?: string;
}
export interface GMOperationResult {
  success: boolean;
  message: string;
}

export interface ItemOperation {
  uid: string;
  id: string;
  amount: number;
}

export interface CurrencyOperation {
  uid: string;
  type: string;
  amount: number;
}

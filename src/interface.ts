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

export interface GachaCollection {
  id: number;
  value: string;
  name: string;
  gachaType: number;
  bannerType: string;
  rateUpItems4?: string;
  rateUpItems5?: string;
  prefabPath?: string;
  previewprefabPath?: string;
  titlePath?: string;
  globalName?: string;
  vietnameseName?: string;
  image?: string;
}

export interface ArtifactOperation {
  uid: string;
  itemId: string;
  level: number;
  mainPropId: number | string;
  appendPropIdList?: (number | string)[];
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

export interface GMResponse {
  success: boolean;
  retcode: number;
  msg: string;
}

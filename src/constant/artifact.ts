//--- Mapping tables for artifact stats ----
export const MAIN_STAT_IDS: Record<string, number> = {
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

//--- Single source of truth for substats ----
const SUBSTAT_DATA = {
  501204: { name: 'Crit Rate', searchKeys: ['crit rate'], values: [2.7, 3.1, 3.5, 3.9], isPercentage: true },
  501224: { name: 'Crit Damage', searchKeys: ['crit damage'], values: [5.4, 6.2, 7.0, 7.8], isPercentage: true },
  501244: { name: 'Elemental Mastery', searchKeys: ['elemental mastery'], values: [16, 19, 21, 23], isPercentage: false },
  501064: { name: 'ATK', searchKeys: ['atk%'], values: [4.1, 4.7, 5.3, 5.8], isPercentage: true },
  501034: { name: 'HP', searchKeys: ['hp%'], values: [4.1, 4.7, 5.3, 5.8], isPercentage: true },
  501094: { name: 'DEF', searchKeys: ['def%'], values: [5.1, 5.8, 6.6, 7.3], isPercentage: true },
  501054: { name: 'ATK', searchKeys: ['atk'], values: [14, 16, 18, 19], isPercentage: false },
  501024: { name: 'HP', searchKeys: ['hp'], values: [209, 239, 269, 299], isPercentage: false },
  501084: { name: 'DEF', searchKeys: ['def'], values: [16, 19, 21, 23], isPercentage: false },
  501234: { name: 'Energy Recharge', searchKeys: ['energy recharge'], values: [4.5, 5.2, 5.8, 6.5], isPercentage: true },
};

//--- Derived mappings ----
export const SUB_STAT_IDS: Record<string, number> = Object.fromEntries(
  Object.entries(SUBSTAT_DATA).flatMap(([id, data]) =>
    data.searchKeys.map(key => [key, Number(id)])
  )
);

export const SUBSTAT_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(SUBSTAT_DATA).map(([id, data]) => [Number(id), data.name])
);

export const SUBSTAT_VALUES: Record<number, number[]> = Object.fromEntries(
  Object.entries(SUBSTAT_DATA).map(([id, data]) => [Number(id), data.values])
);

export const SUBSTAT_IS_PERCENTAGE: Record<number, boolean> = Object.fromEntries(
  Object.entries(SUBSTAT_DATA).map(([id, data]) => [Number(id), data.isPercentage])
);

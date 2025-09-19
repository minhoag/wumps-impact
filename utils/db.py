import pymysql
import json
from utils.constants import MYSQL_CONFIG, DB_HK4E_CONFIG_GIO, DB_HK4E_USER_GIO, GACHA_CONFIG, BANNERS, SERVER_URL, GACHA_RECORD, GACHA_INFO

def get_db_hk4e_config_gio():
    db = pymysql.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=DB_HK4E_CONFIG_GIO,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
    return db

def get_db_hk4e_user_gio():
    db = pymysql.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=DB_HK4E_USER_GIO,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
    return db

def create_gacha_record(
    item_1: str, 
    item_2: str, 
    gacha_type: int, 
    display_up4_item_list: list, 
    start: str, 
    end: str, 
    enabled: int
) -> bool:

    POOL_ID = {201: 201, 301: 201, 302: 201};
    PROBABILITY_RULE_ID = { 201: 1, 301: 1, 302: 2 };
    SORT_ID = { 202: 1002, 302: 1003, 201: 1004, 301: 1005, 400: 1006 };
    
    def get_gacha_up_config(display_up4_item_list, item_1, item_2):
        items4Array = [int(x) for x in display_up4_item_list if x and x.strip()] 
        items5Array = [int(x) for x in [item_1, item_2] if x is not None and str(x).strip()] 
        gacha_up_list = [
            { "item_parent_type": 2, "prob": 500, "item_list": items4Array },
            { "item_parent_type": 1, "prob": 500, "item_list": items5Array },
        ]
        return {"gacha_up_list": gacha_up_list}

    def generate_prefab_path(item_1):
        for banner in BANNERS:
            if str(banner.get('value')) == str(item_1):
                return banner.get('prefabPath')
        return None

    def generate_title_textmap(item_1):
        for banner in BANNERS:
            if str(banner.get('value')) == str(item_1):
                return banner.get('titlePath')
        return None

    data = {
        "gacha_type": gacha_type,
        "begin_time": start,
        "end_time": end,
        "cost_item_id": 223,
        "cost_item_num": 1, # always 1
        "gacha_pool_id": POOL_ID[gacha_type],
        "gacha_prob_rule_id": PROBABILITY_RULE_ID[gacha_type],
        "gacha_up_config": json.dumps(get_gacha_up_config(display_up4_item_list, item_1, item_2)),
        "gacha_rule_config": '{}',
        "gacha_prefab_path": generate_prefab_path(item_1),
        "gacha_preview_prefab_path": 'UI_Tab_' + str(generate_prefab_path(item_1) or ''),
        "gacha_prob_url": SERVER_URL + GACHA_INFO + f"/{gacha_type}",
        "gacha_record_url": SERVER_URL + GACHA_RECORD,
        "gacha_prob_url_oversea": SERVER_URL + GACHA_INFO + f"/{gacha_type}",
        "gacha_record_url_oversea": SERVER_URL + GACHA_RECORD,
        "gacha_sort_id": SORT_ID[gacha_type],
        "enabled": enabled,
        "title_textmap": generate_title_textmap(item_1),
        "display_up4_item_list": ",".join(display_up4_item_list)
      }

    try:
        db = get_db_hk4e_config_gio()
        cursor = db.cursor()
        # Use string formatting for table name since %s treats it as a string literal
        query = f"""
        INSERT INTO {GACHA_CONFIG} (gacha_type, begin_time, end_time, cost_item_id, cost_item_num, gacha_pool_id, gacha_prob_rule_id, gacha_up_config, gacha_rule_config, gacha_prefab_path, gacha_preview_prefab_path, gacha_prob_url, gacha_record_url, gacha_prob_url_oversea, gacha_record_url_oversea, gacha_sort_id, enabled, title_textmap, display_up4_item_list) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (data['gacha_type'], data['begin_time'], data['end_time'], data['cost_item_id'], data['cost_item_num'], data['gacha_pool_id'], data['gacha_prob_rule_id'], data['gacha_up_config'], data['gacha_rule_config'], data['gacha_prefab_path'], data['gacha_preview_prefab_path'], data['gacha_prob_url'], data['gacha_record_url'], data['gacha_prob_url_oversea'], data['gacha_record_url_oversea'], data['gacha_sort_id'], data['enabled'], data['title_textmap'], data['display_up4_item_list']))
        db.commit()
        db.close()
    except Exception as e:
        print(f"Error creating gacha record: {e}")
        return False
    return True
from typing import Literal, Optional, Dict
from datetime import datetime
import pymysql
import json
from utils.logger import logger
from utils.constants import *

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

def get_db_hk4e_discord_gio():
    db = pymysql.connect(
        host=MYSQL_CONFIG['host'],
        user=MYSQL_CONFIG['user'],
        password=MYSQL_CONFIG['password'],
        database=DB_HK4E_DISCORD_GIO,
    )
    return db

def get_whitelist_server():
    db = get_db_hk4e_discord_gio()
    cursor = db.cursor()
    cursor.execute(f"SELECT id FROM {T_WHITELIST} WHERE type = 'GUILD'")
    results = cursor.fetchall()
    db.close()
    return [row[0] for row in results]

def get_whitelist_user():
    db = get_db_hk4e_discord_gio()
    cursor = db.cursor()
    cursor.execute(f"SELECT id FROM {T_WHITELIST} WHERE type = 'USER'")
    results = cursor.fetchall()
    db.close()
    return [row[0] for row in results]

def validate_gacha_record(gacha_type: int, item1: Optional[Dict], item2: Optional[Dict]) -> tuple[bool, str]:
    """Check if a gacha prompt is valid"""
    items5Array = []
    if item1 is not None:
        if isinstance(item1, dict) and 'id' in item1:
            items5Array.append(int(item1['id']))
        elif isinstance(item1, (str, int)):
            items5Array.append(int(item1))
    if item2 is not None:
        if isinstance(item2, dict) and 'id' in item2:
            items5Array.append(int(item2['id']))
        elif isinstance(item2, (str, int)):
            items5Array.append(int(item2))
    items5Array.sort()
    db = get_db_hk4e_config_gio()
    cursor = db.cursor()
    cursor.execute(f"""
        SELECT gacha_type, gacha_up_config, end_time
        FROM {GACHA_CONFIG}
        WHERE end_time > NOW()
    """)

    results = cursor.fetchall()
    db.close()

    for row in results:
        # First check for item conflict
        try:
            gacha_up_config = json.loads(row['gacha_up_config'])
            for item_config in gacha_up_config.get('gacha_up_list', []):
                if item_config.get('item_parent_type') == 1:
                    db_item_list = item_config.get('item_list', [])
                    if any(item in db_item_list for item in items5Array) and row['end_time'] > datetime.now():
                        return False, "Vật phẩm đã tồn tại trong sự kiện này. Thời gian kết thúc: " + str(row['end_time'])
        except (json.JSONDecodeError, KeyError, TypeError):
            pass

        # Then check for gacha type conflicts
        if row['gacha_type'] == gacha_type and row['end_time'] > datetime.now(): # gacha of this type is still running
            return False, "Loại sự kiện này vẫn đang hoạt động. Thời gian kết thúc: " + str(row['end_time'])

    return True, ""

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
        query = f"""
        INSERT INTO {GACHA_CONFIG} (gacha_type, begin_time, end_time, cost_item_id, cost_item_num, gacha_pool_id, gacha_prob_rule_id, gacha_up_config, gacha_rule_config, gacha_prefab_path, gacha_preview_prefab_path, gacha_prob_url, gacha_record_url, gacha_prob_url_oversea, gacha_record_url_oversea, gacha_sort_id, enabled, title_textmap, display_up4_item_list) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (data['gacha_type'], data['begin_time'], data['end_time'], data['cost_item_id'], data['cost_item_num'], data['gacha_pool_id'], data['gacha_prob_rule_id'], data['gacha_up_config'], data['gacha_rule_config'], data['gacha_prefab_path'], data['gacha_preview_prefab_path'], data['gacha_prob_url'], data['gacha_record_url'], data['gacha_prob_url_oversea'], data['gacha_record_url_oversea'], data['gacha_sort_id'], data['enabled'], data['title_textmap'], data['display_up4_item_list']))
        db.commit()
        db.close()
    except Exception as e:
        logger.info(f"Error creating gacha record: {e}")
        return False
    return True

def create_mail_record(
    sender_discord_id: str,
    recipients: list,
    title: str,
    content: str,
    attachments: list = None
) -> bool:
    data = {
        "sender_discord_id": sender_discord_id,
        "recipients": recipients,
        "title": title,
        "content": content,
        "attachments": attachments
    }
    try:
        db = get_db_hk4e_discord_gio()
        cursor = db.cursor()
        query = f"""
        INSERT INTO {T_EMAIL_LOG} (sender_discord_id, recipients, title, content, attachments) VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (data['sender_discord_id'], data['recipients'], data['title'], data['content'], data['attachments']))
        db.commit()
        db.close()
    except Exception as e:
        logger.info(f"Error creating mail record: {e}")
        return False
    return True

def create_log_record(
    type: str,
    message: str
) -> int:
    """Create a log record and return the generated ID"""
    data = {
        "type": type,
        "message": message
    }
    try:
        db = get_db_hk4e_discord_gio()
        cursor = db.cursor()
        query = f"""
        INSERT INTO {T_LOG} (type, message) VALUES (%s, %s)
        """
        cursor.execute(query, (data['type'], data['message']))
        log_id = cursor.lastrowid
        db.commit()
        db.close()
        return log_id
    except Exception as e:
        logger.info(f"Error creating log record: {e}")
        return -1

def create_email_log_record(
    log_id: int,
    subject: str,
    body: str,
    sender: str,
    recipient: str,
    delivery_status: Literal["SENT", "WARN", "FAILED"],
    message: str = ""
) -> bool:
    """Create an email log record linked to a log entry"""
    try:
        db = get_db_hk4e_discord_gio()
        cursor = db.cursor()
        query = f"""
        INSERT INTO {T_EMAIL_LOG} (log_id, subject, body, sender, recipient, delivery_status, message)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (log_id, subject, body, sender, recipient, delivery_status, message))
        db.commit()
        db.close()
        return True
    except Exception as e:
        logger.info(f"Error creating email log record: {e}")
        return False

def get_all_uid() -> list:
    """Get all user IDs from the database"""
    try:
        db = get_db_hk4e_user_gio()
        cursor = db.cursor()
        cursor.execute(f"SELECT uid FROM {T_PLAYER_UID}")
        results = cursor.fetchall()
        db.close()
        return [str(row['uid']) for row in results]
    except Exception as e:
        logger.info(f"Error getting all UIDs: {e}")
        return []
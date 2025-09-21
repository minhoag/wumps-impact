# utils/utils.py

import json
import os

with open(os.path.join(os.path.dirname(__file__), '../data/event.json'), 'r', encoding='utf-8') as f:
    BANNERS = json.load(f)
ITEMS = json.load(open(os.path.join(os.path.dirname(__file__), '../data/item.json'), 'r', encoding='utf-8'))

URL="103.195.188.90"
PORT="2888"
MUIP="14861"
SERVER_URL = f"http://{URL}:{PORT}"
# endpoints
GACHA_INFO = "/gacha/info"
GACHA_RECORD = "/gacha/record"

# schemas
DB_HK4E_CONFIG_GIO = "db_hk4e_config_gio"
DB_HK4E_USER_GIO = "db_hk4e_user_gio"
DB_HK4E_DISCORD_GIO = "db_hk4e_discord_gio"

# tables
GACHA_CONFIG = "t_gacha_schedule_config"
T_LOG = "t_log"
T_EMAIL_LOG = "t_email_log"
T_WHITELIST = "t_whitelist"

# Parse host and port from MYSQL_HOST environment variable
mysql_host = os.getenv('MYSQL_HOST')
mysql_port = os.getenv('MYSQL_PORT')
# region
REGION="dev_gio"
# Command constants
CMD_SEND_MAIL = "1005"
CMD_ADD_ITEM = "give"

# Return codes
RETCODE_SUCCESS = 0

MYSQL_CONFIG = {
    'host': mysql_host,
    'port': int(mysql_port),
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD')
}

# Mail item quantity limits
# Items that have maximum quantity limits per mail attachment
MAIL_ITEM_LIMITS = {
    201: 900,  # Primogem - max 900 per attachment
}
# utils/utils.py

import json
import os
from typing import List, Dict, Any

BANNERS = []
with open(os.path.join(os.path.dirname(__file__), '../data/event.json'), 'r', encoding='utf-8') as f:
    BANNERS = json.load(f)

SERVER_URL = "http://103.195.188.90:2888"
# endpoints
GACHA_INFO = "/gacha/info"
GACHA_RECORD = "/gacha/record"

# schemas
DB_HK4E_CONFIG_GIO = "db_hk4e_config_gio"
DB_HK4E_USER_GIO = "db_hk4e_user_gio"
GACHA_CONFIG = "t_gacha_schedule_config"
# Parse host and port from MYSQL_HOST environment variable
mysql_host = os.getenv('MYSQL_HOST')
mysql_port = os.getenv('MYSQL_PORT')

# image
INTERTWINED_FATE = "https://raw.githubusercontent.com/jaihysc/Genshin-Impact-Wish-Simulator/refs/heads/master/static/images/utility/intertwined-fate.webp"

MYSQL_CONFIG = {
    'host': mysql_host,
    'port': int(mysql_port),
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD')
}
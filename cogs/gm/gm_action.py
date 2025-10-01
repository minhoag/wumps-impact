import re
import asyncio
from typing import List, Dict, Tuple, Union
from utils.db import create_log_record, create_email_log_record, get_all_uid
from utils.utils import Utils
from utils.constants import ITEMS, MAIL_ITEM_LIMITS
from utils.muip import MUIP

class GMActions:
    """Core business logic for GM operation system"""
    @staticmethod
    def search_items(query: str) -> List[Dict]:
        return Utils.search_items(query, ITEMS, ['vietnameseName', 'globalName'], max_results=25)
    
    @staticmethod
    def validate(gm_data: Dict) -> Tuple[bool, str]:
        if not gm_data['content'] or not gm_data['content'].strip():
            return False, "Vui lòng nhập nội dung GM"
        return True, ""
    
    @staticmethod
    async def validate_recipients(send_to: str) -> Tuple[bool, List[str], int, str]:
        if not send_to or not send_to.strip():

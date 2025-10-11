import httpx
import time
from typing import Dict, Any
from urllib.parse import urlencode
from utils.constants import REGION, CMD_SEND_MAIL, RETCODE_SUCCESS, SENDER, SERVER_URL
from utils.logger import logger
import random

class GMResponse:
    """Response structure for GM operations"""
    def __init__(self, success: bool, retcode: int, msg: str):
        self.success = success
        self.retcode = retcode
        self.msg = msg


class MUIP:
    """Mail Utility Interface for Python - handles server communication for mail operations"""
    REGION = REGION
    SERVER_URL = SERVER_URL
    SENDER = SENDER
    CMD_SEND_MAIL = CMD_SEND_MAIL
    RETCODE_SUCCESS = RETCODE_SUCCESS

    @classmethod
    def _generate_ticket(cls) -> str:
        """Generate a unique ticket for GM operations"""
        return f"GM@{int(time.time() * 1000)}{random.randint(100, 999)}"

    @classmethod
    def _compute_url(cls, params: Dict[str, str]) -> str:
        """Compute the full URL with parameters"""
        base_url = f"{cls.SERVER_URL}/api"
        query_params = {
            "region": cls.REGION,
            "ticket": cls._generate_ticket(),
            **params
        }
        return f"{base_url}?{urlencode(query_params)}"
    
    @classmethod
    async def _send_request(cls, url: str) -> Any:
        """Send a request to the server"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
    
    @classmethod
    async def send_mail(
        cls,
        uid: str,
        title: str,
        content: str,
        item_list: str,
        expiry_days: int = 30
    ) -> GMResponse:
        """Send mail to a single user via server API"""
        try:
            expiry_timestamp = int((time.time() * 1000 + expiry_days * 86400000) / 1000)
            params = {
                "cmd": cls.CMD_SEND_MAIL,
                "uid": uid,
                "sender": cls.SENDER,
                "title": title,
                "content": content,
                "item_list": item_list,
                "expire_time": str(expiry_timestamp),
                "is_collectible": "False"
            }

            url = cls._compute_url(params)

            # Make HTTP request
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response_data = response.json()
                logger.info(f"UID {uid}: {response_data}")

            success = (
                response_data.get("msg") == "succ" and
                response_data.get("retcode") == cls.RETCODE_SUCCESS
            )

            return GMResponse(
                success=success,
                retcode=response_data.get("retcode", -1),
                msg=response_data.get("msg", "Unknown error")
            )

        except Exception as e:
            logger.error(f"send_mail failed for UID {uid}: {e}")
            logger.error(f"DEBUG: {url}")
            return GMResponse(
                success=False,
                retcode=-1,
                msg=f"Request failed: {str(e)}"
            )
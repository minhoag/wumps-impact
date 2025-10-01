# cogs/gm/gm_action.py
from typing import Dict, Any
from utils.muip import MUIP

class GMActions:
    """Core business logic for GM operation system"""

    @staticmethod
    async def send_gm_command(cmd: str, uid: str, extra_params: Dict[str, Any] = None):
        """
        Send a GM command to the server via MUIP API.
        """
        ticket = MUIP._generate_ticket()
        params = {
            "region": MUIP.REGION,
            "ticket": ticket,
            "cmd": cmd,
            "uid": uid,
        }
        if extra_params:
            params.update({k: str(v) for k, v in extra_params.items() if v is not None})
        response = await MUIP._send_request(MUIP._compute_url(params))
        return {
            "success": response.get("msg") == "succ",
            "retcode": response.get("retcode", -1),
            "msg": response.get("msg", "Unknown error")
        }
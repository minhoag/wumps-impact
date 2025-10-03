# cogs/gm/gm_action.py
from typing import Dict, Any
from utils.muip import MUIP
from utils.db import create_log_record
import discord
import httpx

class GMActions:
    """Core business logic for GM operation system"""

    @staticmethod
    async def send_gm_command(cmd: str, uid: str, extra_params: Dict[str, Any] = None):
        """
        Send a GM command to the server via MUIP API.
        """
        try:
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
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            return {
                "success": False,
                "retcode": -1,
                "msg": f"Lỗi kết nối đến server: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "retcode": -1,
                "msg": f"Lỗi không xác định: {str(e)}"
            }

    @staticmethod
    async def execute_gm_command(interaction: discord.Interaction, uid: str, command: str):
        """
        Common method to execute a GM command and handle the response.
        Defer interaction, send command, handle response, and log.
        """
        await interaction.response.defer(ephemeral=True)
        gm_response = await GMActions.send_gm_command("1116", uid, {"msg": command})

        if gm_response["success"]:
            msg = f"Lệnh đã được gửi thành công đến UID {uid}."
        else:
            msg = f"Gửi lệnh thất bại: {gm_response['msg']}"

        await interaction.followup.send(msg, ephemeral=True)
        create_log_record("GM", f"{interaction.user.id}|{uid}|{command}")
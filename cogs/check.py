# checks.py
from discord import app_commands, Interaction
from utils.db import get_whitelist_server, get_whitelist_user

ALLOW_GUILDS = get_whitelist_server()
ALLOW_USERS = get_whitelist_user()

async def permission_check(interaction: Interaction) -> bool:
    if await interaction.client.is_owner(interaction.user):
        return True
    if not str(interaction.guild_id) in ALLOW_GUILDS:
        msg = "Server của bạn không được phép sử dụng bot."
    elif not str(interaction.user.id) in ALLOW_USERS:
        msg = "Bạn không được cấp quyền sử dụng bot."
    else:
        return True
    raise app_commands.CheckFailure(msg)

is_whitelist = app_commands.check(permission_check)
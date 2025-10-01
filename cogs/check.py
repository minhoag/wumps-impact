# checks.py
from discord import app_commands, Interaction
from utils.db import get_whitelist_server, get_whitelist_user

ALLOW_GUILDS = get_whitelist_server()
ALLOW_USERS = get_whitelist_user()

async def permission_check(interaction: Interaction) -> bool:
    if await interaction.client.is_owner(interaction.user):
        return True
    if str(interaction.guild_id) not in ALLOW_GUILDS and str(interaction.user.id) not in ALLOW_USERS:
        return False
    return True

is_whitelist = app_commands.check(permission_check)
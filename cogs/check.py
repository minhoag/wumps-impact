# checks.py
from discord import app_commands, Interaction
from utils.db import get_whitelist_server, get_whitelist_user

async def permission_check(interaction: Interaction) -> bool:
    if str(interaction.user.id) in ["291345472327516170"]:
        return True

    try:
        ALLOW_GUILDS = await interaction.client.loop.run_in_executor(None, get_whitelist_server)
        ALLOW_USERS = await interaction.client.loop.run_in_executor(None, get_whitelist_user)
    except Exception as e:
        return False
    if str(interaction.user.id) in ALLOW_USERS or (interaction.guild_id and str(interaction.guild_id) in ALLOW_GUILDS):
        return True
    return False
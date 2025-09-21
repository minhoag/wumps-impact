# checks.py
from discord import app_commands, Interaction

ALLOW_GUILDS = {1039818882069839893}

async def _allowed_guild_pred(inter: Interaction) -> bool:
    if inter.guild_id in ALLOW_GUILDS:
        return True
    raise app_commands.CheckFailure("This command is not available in this server.")
check_allow_guild = app_commands.check(_allowed_guild_pred)

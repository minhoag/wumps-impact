# permission.py
from discord import Interaction
from discord.ext import commands
from utils.db import create_log_record

def permission(interaction: Interaction, bot: commands.Bot) -> bool:
    """
    Check if the user has permission to use GM commands.
    """
    whitelisted_guilds = bot.whitelisted_guilds
    whitelisted_users = bot.whitelisted_users
    # developer id
    developer_id = "291345472327516170"
    if str(interaction.user.id) == developer_id:
        # log info
        create_log_record("PERMISSION", f"SUCCESS|DEVELOPER|{interaction.user.id}|{interaction.guild_id}")
        return True
    if str(interaction.guild_id) and str(interaction.guild_id) in whitelisted_guilds and str(interaction.user.id) in whitelisted_users:
        create_log_record("PERMISSION", f"SUCCESS|WHITELISTED_GUILD|{interaction.user.id}|{interaction.guild_id}")
        return True
    create_log_record("PERMISSION", f"FAILED|{interaction.user.id}|{interaction.guild_id}")
    return False
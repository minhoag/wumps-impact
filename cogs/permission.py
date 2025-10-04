# permission.py
from discord import Interaction
from discord.ext import commands

def permission(interaction: Interaction, bot: commands.Bot) -> bool:
    """
    Check if the user has permission to use GM commands.
    """
    whitelisted_guilds = bot.whitelisted_guilds
    whitelisted_users = bot.whitelisted_users
    # developer id
    developer_id = "291345472327516170"
    if str(interaction.user.id) == developer_id:
        return True
    
    if str(interaction.guild_id) and str(interaction.guild_id) in whitelisted_guilds:
        return True

    if str(interaction.user.id) in whitelisted_users:
        return True
    return False
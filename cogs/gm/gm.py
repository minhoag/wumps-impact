# cogs/mail.py
import discord
from discord import app_commands, Interaction
from discord.ext import commands
from typing import Dict, Optional
from cogs.mail.mail_modal import MailModal
from cogs.mail.mail_embed import MailEmbed
from cogs.mail.mail_view import MailView
import time
from utils.logger import logger
from cogs.check import is_whitelist

class Mail(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.gm_sessions = {}
        self.session_timeout = 30
    
    @app_commands.command(name="gm", description="Create and send gm to users")
    @is_whitelist
    async def send(self, interaction: Interaction):
        """Send a GM command to users"""
        has_permission, error_message = self._check_administrator_permissions(interaction)
        if not has_permission:
            return
        

    async def handle_gm_submit(self, interaction: discord.Interaction, gm_data: Dict):
        """Handle GM modal submission and send GM command to users."""
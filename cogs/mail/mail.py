# cogs/mail.py
import discord
from discord import app_commands, Interaction
from discord.ext import commands
from typing import Dict
from cogs.mail.mail_modal import MailModal
from cogs.mail.mail_embed import MailEmbed
from cogs.mail.mail_view import MailView

class Mail(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.mail_sessions = {}
        self.session_timeout = 30
    
    @app_commands.command(name="mail", description="Create and send mail to users")
    async def create(self, interaction: Interaction):
        """Create a mail with attachments"""
        modal = MailModal(self.handle_mail_submit)
        await interaction.response.send_modal(modal)

    async def handle_mail_submit(self, interaction: discord.Interaction, mail_data: Dict):
        """Handle mail modal submission and create MailView."""
        mail_view = MailView(
            mail_data=mail_data,
            on_mail_sent=None
        )
        mail_embed_instance = MailEmbed(mail_data=mail_data)
        mail_embed = mail_embed_instance.build_embed()
        files = []
        if mail_embed_instance.thumbnail_file:
            files.append(mail_embed_instance.thumbnail_file)
        if mail_embed_instance.footer_icon_file:
            files.append(mail_embed_instance.footer_icon_file)
        await interaction.response.send_message(
            embed=mail_embed,
            view=mail_view,
            ephemeral=True,
            files=files
        )

async def setup(bot):
    await bot.add_cog(Mail(bot))
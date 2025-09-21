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
from cogs.check import check_allow_guild

class Mail(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.mail_sessions = {}
        self.session_timeout = 30
    
    @app_commands.command(name="mail", description="Create and send mail to users")
    @app_commands.checks.has_permissions(administrator=True)
    @check_allow_guild
    async def create(self, interaction: Interaction):
        """Create a mail with attachments"""
        has_permission, error_message = self._check_administrator_permissions(interaction)
        if not has_permission:
            return
        self._cleanup_expired_sessions()
        user_id = interaction.user.id
        if user_id in self.mail_sessions:
            await interaction.response.send_message(
                "Mỗi lệnh gửi mail cách nhau 30 giây. Vui lòng đợi.",
                ephemeral=True
            )
            return
        
        modal = MailModal(self.handle_mail_submit)
        await interaction.response.send_modal(modal)

    async def handle_mail_submit(self, interaction: discord.Interaction, mail_data: Dict):
        """Handle mail modal submission and create MailView."""
        user_id = interaction.user.id
        self._update_session_activity(user_id)
        self._create_mail_session(user_id, mail_data)
        mail_view = MailView(
            mail_data=mail_data,
            on_mail_sent=self._handle_mail_sent_callback
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
    
    def _check_administrator_permissions(self, interaction: Interaction) -> tuple[bool, str]:
        """Check if user has administrator permissions."""
        return True, ""
    
    def _create_mail_session(self, user_id: int, mail_data: Dict) -> None:
        """Create a new mail session for the user."""
        self.mail_sessions[user_id] = {
            'mail_data': mail_data,
            'created_at': time.time(),
            'last_activity': time.time()
        }
    
    def _update_session_activity(self, user_id: int) -> None:
        """Update the last activity time for a user's session."""
        if user_id in self.mail_sessions:
            self.mail_sessions[user_id]['last_activity'] = time.time()
    
    def _cleanup_expired_sessions(self) -> None:
        """Clean up expired mail sessions."""
        current_time = time.time()
        expired_sessions = []
        
        for user_id, session in self.mail_sessions.items():
            if current_time - session['last_activity'] > self.session_timeout:
                expired_sessions.append(user_id)
        
        for user_id in expired_sessions:
            del self.mail_sessions[user_id]
    
    async def _handle_mail_sent_callback(self, success: bool, message: str) -> None:
        """Handle callback when mail is sent (success or failure)."""
        self._cleanup_expired_sessions()


    def get_user_session(self, user_id: int) -> Optional[Dict]:
        """Get user's mail session data."""
        self._cleanup_expired_sessions()
        return self.mail_sessions.get(user_id)
    
    def clear_user_session(self, user_id: int) -> None:
        """Clear user's mail session."""
        if user_id in self.mail_sessions:
            del self.mail_sessions[user_id]
    
    async def cog_unload(self):
        """Clean up when cog is unloaded."""
        # Clear all active sessions
        self.mail_sessions.clear()

async def setup(bot):
    await bot.add_cog(Mail(bot))
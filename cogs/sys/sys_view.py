# cogs/sys/sys_view.py
import discord
from discord import Interaction
from discord.ui import View, Button

class ConfirmationView(View):
    """Confirmation view for dangerous operations."""
    def __init__(self):
        super().__init__(timeout=30)
        self.confirmed = False

    @discord.ui.button(label="Xác nhận", style=discord.ButtonStyle.success)
    async def confirm(self, interaction: Interaction, button: Button):
        """Handle confirmation."""
        print(f"[DEBUG] ConfirmationView.confirm called - setting confirmed=True")
        self.confirmed = True
        try:
            await interaction.response.edit_message(
                embed=discord.Embed(
                    title="ĐÃ XÁC NHẬN",
                    description="Đã bắt đầu dừng server!\nĐang dừng tất cả server...",
                    color=discord.Color.orange()
                ),
                view=None
            )
        except discord.NotFound:
            print(f"[DEBUG] Failed to edit message in confirm - interaction expired")
        self.stop()

    @discord.ui.button(label="Hủy", style=discord.ButtonStyle.danger)
    async def cancel(self, interaction: Interaction, button: Button):
        """Handle cancellation."""
        print(f"[DEBUG] ConfirmationView.cancel called - setting confirmed=False")
        self.confirmed = False
        try:
            await interaction.response.edit_message(
                embed=discord.Embed(
                    title="ĐÃ HỦY",
                    description="Đã hủy dừng khẩn cấp.\nTất cả server vẫn đang chạy bình thường.",
                    color=discord.Color.blue()
                ),
                view=None
            )
        except discord.NotFound:
            print(f"[DEBUG] Failed to edit message in cancel - interaction expired")
        self.stop()

class ServerPanelView(View):
    """View for the server status panel buttons."""
    def __init__(self):
        super().__init__(timeout=None)
    
    EVENT_NAME = {
        "blossom": "Hoa Địa Mạch",
    }
        
    @discord.ui.button(label="Start", style=discord.ButtonStyle.success, custom_id="sys_start_all")
    async def start_all(self, interaction: Interaction, button: Button):
        cog = interaction.client.get_cog('SYS')

        await interaction.response.defer(ephemeral=True)
        await cog.do_start_servers(interaction)

    @discord.ui.button(label="Stop", style=discord.ButtonStyle.danger, custom_id="sys_stop_all")
    async def stop_all(self, interaction: Interaction, button: Button):
        cog = interaction.client.get_cog('SYS')

        await interaction.response.defer(ephemeral=True)
        await cog.do_stop_servers(interaction)

    @discord.ui.button(label="Restart", style=discord.ButtonStyle.secondary, custom_id="sys_restart_all")
    async def restart_all(self, interaction: Interaction, button: Button):
        cog = interaction.client.get_cog('SYS')

        await interaction.response.defer(ephemeral=True)
        await cog.do_restart_servers(interaction)

    @discord.ui.button(label="Laylines", style=discord.ButtonStyle.secondary, custom_id="sys_start_laylines")
    async def start_laylines(self, interaction: Interaction, button: Button):
        cog = interaction.client.get_cog('SYS')

        await interaction.response.defer(ephemeral=True)
        await cog.do_start_laylines(interaction)

    @discord.ui.button(label="Gameserver", style=discord.ButtonStyle.secondary, custom_id="sys_stop_laylines")
    async def restart_gameserver(self, interaction: Interaction, button: Button):
        cog = interaction.client.get_cog('SYS')

        await interaction.response.defer(ephemeral=True)
        await cog.do_restart_gameserver(interaction)

    @discord.ui.button(label="Dọn Logs", style=discord.ButtonStyle.secondary, custom_id="sys_clear_logs")
    async def clear_logs(self, interaction: Interaction, button: Button):
        cog = interaction.client.get_cog('SYS')

        await interaction.response.defer(ephemeral=True)
        await cog.do_clear_logs(interaction)
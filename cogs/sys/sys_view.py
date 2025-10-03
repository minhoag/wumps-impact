# cogs/sys/sys_view.py
import discord
from discord import Interaction
from discord.ui import View, Button
class ServerPanelView(View):
    """View for the server status panel buttons."""
    def __init__(self):
        super().__init__(timeout=None)
    @discord.ui.button(label="Start All", style=discord.ButtonStyle.success, custom_id="sys_start_all")
    async def start_all(self, interaction: Interaction, button: Button):
        await interaction.response.send_message("Not implemented yet.", ephemeral=True)
    @discord.ui.button(label="Force Stop All", style=discord.ButtonStyle.danger, custom_id="sys_stop_all")
    async def stop_all(self, interaction: Interaction, button: Button):
        await interaction.response.send_message("Not implemented yet.", ephemeral=True)
    @discord.ui.button(label="Start Gameserver", style=discord.ButtonStyle.primary, custom_id="sys_start_gameserver")
    async def start_gameserver(self, interaction: Interaction, button: Button):
        await interaction.response.send_message("Not implemented yet.", ephemeral=True)
    @discord.ui.button(label="Clear Logs", style=discord.ButtonStyle.secondary, custom_id="sys_clear_logs")
    async def clear_logs(self, interaction: Interaction, button: Button):
        await interaction.response.send_message("Not implemented yet.", ephemeral=True)
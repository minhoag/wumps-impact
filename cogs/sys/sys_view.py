# cogs/sys/sys_view.py
import discord
from discord import Interaction
from discord.ui import View, Button
from cogs.sys.sys_action import SystemActions
from cogs.check import permission_check

class ConfirmationView(View):
    """Confirmation view for dangerous operations."""
    def __init__(self):
        super().__init__(timeout=30)
        self.confirmed = False
    @discord.ui.button(label="Confirm", style=discord.ButtonStyle.success)
    async def confirm(self, interaction: Interaction, button: Button):
        """Handle confirmation."""
        self.confirmed = True
        await interaction.response.edit_message(
            embed=discord.Embed(
                title="CONFIRMED",
                description="Force stop operation initiated.\nStopping all servers...",
                color=discord.Color.orange()
            ),
            view=None
        )
        self.stop()
    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.danger)
    async def cancel(self, interaction: Interaction, button: Button):
        """Handle cancellation."""
        self.confirmed = False
        await interaction.response.edit_message(
            embed=discord.Embed(
                title="CANCELLED",
                description="Force stop operation cancelled.\nAll servers remain running.",
                color=discord.Color.blue()
            ),
            view=None
        )
        self.stop()

class ServerPanelView(View):
    """View for the server status panel buttons."""
    def __init__(self):
        super().__init__(timeout=None)
        
    @discord.ui.button(label="Start All", style=discord.ButtonStyle.success, custom_id="sys_start_all")
    async def start_all(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        if not cog:
            await interaction.response.send_message("Error: System cog not found.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        await cog.do_start_servers(interaction, SystemActions.START_SERVER_ORDER, start_sdk=True)

    @discord.ui.button(label="Stop All", style=discord.ButtonStyle.danger, custom_id="sys_stop_all")
    async def stop_all(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        if not cog:
            await interaction.response.send_message("Error: System cog not found.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        confirm_embed = discord.Embed(
            title="EMERGENCY: Stop All Servers",
            description="**CRITICAL WARNING**\n\n"
                        "This action will immediately terminate ALL servers:\n\n"
                        "**IMPACT:**\n"
                        "• Stop all server processes\n"
                        "• Stop SDK server forcefully\n"
                        "• Risk of data corruption or loss\n\n",
            color=discord.Color.red()
        )
        confirm_embed.set_footer(text="You have 30 seconds to confirm or cancel. This action cannot be undone!")
        confirm_view = ConfirmationView()
        await interaction.followup.send(embed=confirm_embed, view=confirm_view, ephemeral=True)
        await confirm_view.wait()
        if confirm_view.confirmed:
            await cog.do_force_stop_all(interaction)
        else:
            await interaction.followup.send("Operation cancelled.", ephemeral=True)

    @discord.ui.button(label="Start Gameserver", style=discord.ButtonStyle.primary, custom_id="sys_start_gameserver")
    async def start_gameserver(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        if not cog:
            await interaction.response.send_message("Error: System cog not found.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        await cog.do_start_servers(interaction, ["gameserver"], start_sdk=False)

    @discord.ui.button(label="Clear Logs", style=discord.ButtonStyle.secondary, custom_id="sys_clear_logs")
    async def clear_logs(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        if not cog:
            await interaction.response.send_message("Error: System cog not found.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        await cog.do_clear_logs(interaction)
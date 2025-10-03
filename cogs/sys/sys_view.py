# cogs/sys/sys_view.py

import discord
from discord.ui import View, Button

class SysView(View):
    """Confirmation view for dangerous operations like server restart/stop."""

    def __init__(self, timeout: int = 30):
        super().__init__(timeout=timeout)
        self.confirmed = False
        self.cancelled = False

    @discord.ui.button(label="Confirm", style=discord.ButtonStyle.success)
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle confirmation."""
        self.confirmed = True
        self.cancelled = False
        await interaction.response.edit_message(
            embed=discord.Embed(
                title="Confirmed",
                description="Operation will proceed...",
                color=discord.Color.green()
            ),
            view=None
        )
        self.stop()

    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.danger)
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle cancellation."""
        self.confirmed = False
        self.cancelled = True
        await interaction.response.edit_message(
            embed=discord.Embed(
                title="Cancelled",
                description="Operation has been cancelled.",
                color=discord.Color.red()
            ),
            view=None
        )
        self.stop()

    async def wait_for_confirmation(self, interaction: discord.Interaction, action_type: str) -> bool:
        """Wait for user confirmation with timeout handling."""
        await self.wait()

        if self.confirmed:
            return True
        elif self.cancelled:
            return False

        # Timeout occurred
        await interaction.edit_original_response(
            embed=discord.Embed(
                title="Timeout",
                description=f"{action_type} confirmation timed out. Operation cancelled.",
                color=discord.Color.orange()
            ),
            view=None
        )
        return False

    @staticmethod
    def create_restart_confirmation_embed() -> discord.Embed:
        """Create restart confirmation embed."""
        embed = discord.Embed(
            title="Server Restart Confirmation",
            description="**Are you sure you want to restart all servers?**\n\n"
                       "This will:\n"
                       "• Stop all running servers\n"
                       "• Start servers in the correct order\n"
                       "• Restart the SDK server\n\n"
                       "This operation may take several minutes.",
            color=discord.Color.orange()
        )
        embed.set_footer(text="You have 30 seconds to confirm or cancel.")
        return embed

    @staticmethod
    def create_stop_confirmation_embed() -> discord.Embed:
        """Create stop confirmation embed."""
        embed = discord.Embed(
            title="Server Stop Confirmation",
            description="**Are you sure you want to stop all servers?**\n\n"
                       "This will:\n"
                       "• Send SIGTERM to all running servers\n"
                       "• Wait for graceful shutdown\n"
                       "• Force kill any unresponsive servers\n\n"
                       "Players will be disconnected from the game.",
            color=discord.Color.red()
        )
        embed.set_footer(text="You have 30 seconds to confirm or cancel.")
        return embed

    @staticmethod
    def create_stop_all_confirmation_embed() -> discord.Embed:
        """Create force stop confirmation embed."""
        embed = discord.Embed(
            title="EMERGENCY: Force Stop All Servers",
            description="**WARNING: This will FORCE STOP all servers immediately!**\n\n"
                       "This will:\n"
                       "• Send SIGKILL (-9) to ALL servers\n"
                       "• Immediately terminate all processes\n"
                       "• Stop SDK server forcefully\n"
                       "• **POTENTIAL DATA LOSS**\n\n"
                       "**Use only in emergency situations!**",
            color=discord.Color.red()
        )
        embed.set_footer(text="You have 30 seconds to confirm or cancel. This action cannot be undone!")
        return embed

    @staticmethod
    def create_system_reboot_confirmation_embed() -> discord.Embed:
        """Create system reboot confirmation embed."""
        embed = discord.Embed(
            title="SYSTEM REBOOT CONFIRMATION",
            description="**CRITICAL: This will restart the ENTIRE SYSTEM!**\n\n"
                       "This will:\n"
                       "• Shut down the operating system\n"
                       "• Restart all hardware and software\n"
                       "• Disconnect ALL users\n"
                       "• **Service interruption for several minutes**\n\n"
                       "**Only use during maintenance windows!**",
            color=discord.Color.dark_red()
        )
        embed.set_footer(text="You have 30 seconds to confirm or cancel. System will reboot immediately after confirmation!")
        return embed

    @staticmethod
    def create_status_embed(interaction: discord.Interaction, server_statuses: dict) -> discord.Embed:
        """Create server status embed."""
        embed = discord.Embed(
            title="Server Status",
            color=discord.Color.blue(),
            timestamp=interaction.created_at
        )

        for server_name, status in server_statuses.items():
            embed.add_field(
                name=status["name"],
                value=status["value"],
                inline=True
            )

        return embed

# cogs/sys/sys.py
import discord
from discord import app_commands, Interaction
from discord.ext import commands
from cogs.sys.sys_view import ServerPanelView
from cogs.sys.sys_action import SystemActions
from utils.utils import Utils
import asyncio
import json
import datetime
from cogs.permission import permission
from utils.logger import logger

# Event branches - easy to maintain and change
EVENTS = {
    "blossom": "event/blossom",
    "off": "develop"  # develop branch = all events off
}
class SYS(commands.Cog):
    """Cog for handling System commands."""
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.status_message = None
        self.update_task = None
        self.log_channel = None
        self.manually_stopped = False  # Flag to track manual stops
        self.sys_actions = SystemActions()
        self.sys_actions.init()
        try:
            with open('status_panel.json', 'r') as f:
                data = json.load(f)
                self.status_message = (data['channel'], data['message'])
        except FileNotFoundError:
            pass
        if self.status_message:
            self.update_task = self.bot.loop.create_task(self.update_loop())
        self.bot.add_view(ServerPanelView())

    async def update_loop(self):
        while True:
            await asyncio.sleep(10)
            if not self.status_message:
                break
            channel = self.bot.get_channel(self.status_message[0])
            if not channel:
                break

            # gameserver tracking auto restart
            gameserver_running = self.sys_actions.is_service_running("gameserver")
            # gameserver is dead then make it up again (only if not manually stopped)
            if not gameserver_running and not self.manually_stopped:
                logger.warning("Gameserver is down, restarting...")
                self.sys_actions.restart_server("gameserver")
                # log it
                await Utils.log_system_event(
                    self.bot, self.log_channel,
                    "Gameserver Crashed",
                    f"Gameserver đã bị crash lúc {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}, đã khởi động lại",
                    discord.Color.red()
                )

            try:
                message = await channel.fetch_message(self.status_message[1])
                statuses = self.get_server_statuses()
                embed = self.create_status_embed(statuses)
                await message.edit(embed=embed)
            except discord.NotFound:
                self.status_message = None
                break
            except Exception as e:
                logger.error(f"Error updating status: {e}")

    def get_server_statuses(self):
        return self.sys_actions.status()

    def create_status_embed(self, statuses):
        embed = discord.Embed(
            title="Bảng Giám Sát Server",
            color=discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )

        # Separate running and stopped servers
        running_servers = []
        stopped_servers = []

        for status in statuses:
            server_name = status["name"]
            if status["value"] == "ONLINE":
                running_servers.append(server_name)
            elif status["value"] == "OFFLINE":
                stopped_servers.append(server_name)

        # Left column: Running and stopped servers
        left_column = "**ĐANG HOẠT ĐỘNG**\n```\n"
        if running_servers:
            for server_name in running_servers:
                left_column += f"[ONLINE] {server_name.upper()}\n"
        else:
            left_column += "Không có server nào đang chạy\n"
        left_column += "```\n"

        left_column += "**KHÔNG HOẠT ĐỘNG**\n```\n"
        if stopped_servers:
            for server_name in stopped_servers:
                left_column += f"[OFFLINE] {server_name.upper()}\n"
        else:
            left_column += "Tất cả server đang hoạt động\n"
        left_column += "```"

        embed.add_field(name="SERVERS", value=left_column, inline=True)

        # Right column: System usage
        system_usage = self.sys_actions.get_system_usage()
        right_column = "```\n"
        right_column += f"CPU: {system_usage['cpu']}\n"
        right_column += f"RAM: {system_usage['ram']}\n"
        right_column += f"STORAGE: {system_usage['storage']}\n"
        right_column += "```"

        embed.add_field(name="SYSTEM INFO", value=right_column, inline=True)
        # Footer with last update time
        embed.set_footer(text="Cập nhật lần cuối")
        return embed

    sys = app_commands.Group(name="sys", description="Lệnh hệ thống để quản lý server Genshin Impact 3.4")
    @sys.command(name="panel", description="Thiết lập bảng trạng thái server trong kênh")
    @app_commands.describe(
        channel="Kênh để gửi bảng trạng thái (mặc định: kênh hiện tại)",
        log_channel="Kênh để gửi log hệ thống (tùy chọn)"
    )
    async def setup_panel(self, interaction: Interaction, channel: discord.TextChannel = None, log_channel: discord.TextChannel = None):
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)

        if channel is None:
            channel = interaction.channel

        # Set up status panel
        statuses = self.get_server_statuses()
        embed = self.create_status_embed(statuses)
        view = ServerPanelView()
        message = await channel.send(embed=embed, view=view)
        self.status_message = (channel.id, message.id)
        with open('status_panel.json', 'w') as f:
            json.dump({'channel': self.status_message[0], 'message': self.status_message[1]}, f)

        # Set up log channel if provided
        response_parts = [f"Đã thiết lập bảng trạng thái trong {channel.mention}!"]

        if log_channel is not None:
            self.log_channel = log_channel.id
            await Utils.log_system_event(
                self.bot, self.log_channel,
                "Log Channel Configured",
                f"Kênh log hệ thống đã được thiết lập thành {log_channel.mention}",
                discord.Color.green()
            )
            response_parts.append(f"Đã thiết lập kênh log thành {log_channel.mention}!")

        if self.update_task is None or self.update_task.done():
            self.update_task = self.bot.loop.create_task(self.update_loop())

        await interaction.followup.send(" ".join(response_parts), ephemeral=True)

    async def do_start_servers(self, interaction: Interaction, server_name: str = None, force_restart: bool = False):
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        # Clear the manually stopped flag when starting servers
        self.manually_stopped = False
        status = self.sys_actions.start_server(server_name)
        msg = ""
        if status:
            for s in status:
                msg += f"{s['name']}: {s['reason']}\n"
        else:
            msg = f"Đã khởi động tất cả servers: {status['reason']}"
        await interaction.followup.send(msg, ephemeral=True)
        # Log action
        await Utils.log_system_event(
            self.bot, self.log_channel,
            f"{interaction.user.name}",
            f"{msg}",
            discord.Color.green()
        )

    async def do_stop_servers(self, interaction: Interaction):
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        # Set the manually stopped flag to prevent auto-restart
        self.manually_stopped = True
        status = self.sys_actions.stop_server()
        msg = ""
        if status:
            for s in status:
                msg += f"{s['name']}: {s['reason']}\n"
        else:
            msg = f"Đã dừng tất cả servers: {status['reason']}"
        await interaction.followup.send(msg, ephemeral=True)
        await Utils.log_system_event(
            self.bot,
            self.log_channel,
            f"{interaction.user.name}",
            f"{msg}",
            discord.Color.green()
        )

    async def do_restart_servers(self, interaction: Interaction):
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        # Clear the manually stopped flag when restarting servers
        self.manually_stopped = False
        status = self.sys_actions.restart_server()
        msg = ""
        if status:
            for s in status:
                msg += f"{s['name']}: {s['reason']}\n"
        else:
            msg = "Đã khởi động lại tất cả servers"
        await interaction.followup.send(msg, ephemeral=True)
        await Utils.log_system_event(
            self.bot,
            self.log_channel,
            f"{interaction.user.name}",
            f"{msg}",
            discord.Color.green()
        )

    async def do_restart_gameserver(self, interaction: Interaction):
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        # Clear the manually stopped flag when restarting gameserver
        self.manually_stopped = False
        status = self.sys_actions.restart_server("gameserver")
        msg = ""
        if status:
            for s in status:
                msg += f"{s['name']}: {s['reason']}\n"
        else:
            msg = "Đã khởi động lại gameserver"
        await interaction.followup.send(msg, ephemeral=True)
        await Utils.log_system_event(
            self.bot,
            self.log_channel,
            f"{interaction.user.name}",
            f"{msg}",
            discord.Color.green()
        )

    async def do_start_laylines(self, interaction: Interaction):
        # Laylines button triggers blossom event
        await self.do_toggle_event(interaction, "blossom")

    async def do_clear_logs(self, interaction: Interaction):
        """Clear all log files in the log directory."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        status = self.sys_actions.clear_logs()
        await Utils.log_system_event(
            self.bot, self.log_channel,
            f"{interaction.user.name}",
            f"{status['reason']}",
            discord.Color.green()
        )

    async def do_toggle_event(self, interaction: Interaction, event: str):
        """Handle starting/stopping events via git branch switching."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return

        # Get the branch name from the EVENTS constant
        if event not in EVENTS:
            await interaction.followup.send(
                f"Event '{event}' không tồn tại. Events có sẵn: {', '.join(EVENTS.keys())}",
                ephemeral=True
            )
            return

        branch = EVENTS[event]
        status = self.sys_actions.toggle_event(branch)
        msg = f"{status['reason']}"
        await interaction.followup.send(msg, ephemeral=True)
        await Utils.log_system_event(
            self.bot,
            self.log_channel,
            f"{interaction.user.name}",
            f"{msg}",
            discord.Color.green()
        )

async def setup(bot: commands.Bot):
    await bot.add_cog(SYS(bot))
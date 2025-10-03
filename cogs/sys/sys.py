# cogs/sys/sys.py
import discord
from discord import app_commands, Interaction
from discord.ext import commands
from cogs.check import is_whitelist
from cogs.sys.sys_view import ServerPanelView, ConfirmationView
from cogs.sys.sys_action import SystemActions
from utils.utils import Utils
import asyncio
import json
from typing import List

class SYS(commands.Cog):
    """Cog for handling System commands."""
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.status_message = None
        self.update_task = None
        self.log_channel = None
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
            try:
                message = await channel.fetch_message(self.status_message[1])
                statuses = self.get_server_statuses()
                embed = self.create_status_embed(statuses)
                await message.edit(embed=embed)
            except discord.NotFound:
                self.status_message = None
                break
            except Exception as e:
                print(f"Error updating status: {e}")

    def get_server_statuses(self):
        return SystemActions.get_server_statuses()

    def create_status_embed(self, statuses):
        embed = discord.Embed(
            title="Bảng Giám Sát Server",
            color=discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )

        # Separate running and stopped servers and logs
        running_servers = []
        stopped_servers = []
        log_info = []

        for server_name, status in statuses.items():
            if "RUNNING" in status["name"]:
                running_servers.append((server_name, status))
            elif "STOPPED" in status["name"]:
                stopped_servers.append((server_name, status))
            elif "LOG" in status["name"]:
                log_info.append((server_name, status))

        # Running servers section
        if running_servers:
            running_text = "```\n"
            for server_name, status in running_servers:
                server_display = server_name.upper()
                if server_name == "sdk":
                    server_display = "SDK SERVER"
                lines = status["value"].split('\n')
                pid_line = lines[0] if lines else "Unknown"
                cpu_line = lines[1] if len(lines) > 1 else ""
                mem_line = lines[2] if len(lines) > 2 else ""

                running_text += f"[ONLINE] {server_display}\n"
                running_text += f"  {pid_line}\n"
                if cpu_line and mem_line:
                    running_text += f"  {cpu_line} | {mem_line}\n"
                running_text += "\n"
            running_text += "```"
            embed.add_field(name="SERVERS ĐANG CHẠY", value=running_text, inline=False)

        # Stopped servers section
        if stopped_servers:
            stopped_text = "```\n"
            for server_name, status in stopped_servers:
                server_display = server_name.upper()
                if server_name == "sdk":
                    server_display = "SDK SERVER"
                stopped_text += f"[OFFLINE] {server_display}\n"
            stopped_text += "```"
            embed.add_field(name="SERVERS ĐÃ DỪNG", value=stopped_text, inline=False)

        # Log monitoring section
        if log_info:
            log_text = "```\n"
            for server_name, status in log_info:
                if "gameserver" in server_name:
                    log_text += f"GAMESERVER.LOG\n"
                    log_text += f"  {status['value']}\n"
                    log_text += f"  Tự động xóa: >2GB\n"
            log_text += "```"
            embed.add_field(name="GIÁM SÁT LOG", value=log_text, inline=False)

        # Footer with last update time
        embed.set_footer(text="Cập nhật lần cuối")

        return embed

    sys = app_commands.Group(name="sys", description="Lệnh hệ thống để quản lý server Genshin Impact 3.4")
    @sys.command(name="panel", description="Thiết lập bảng trạng thái server trong kênh")
    @app_commands.describe(
        channel="Kênh để gửi bảng trạng thái (mặc định: kênh hiện tại)",
        log_channel="Kênh để gửi log hệ thống (tùy chọn)"
    )
    @is_whitelist
    async def setup_panel(self, interaction: Interaction, channel: discord.TextChannel = None, log_channel: str = None):
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

        if log_channel and log_channel.strip():
            resolved_channel, error_msg = Utils.resolve_channel(self.bot, interaction, log_channel)
            if resolved_channel:
                self.log_channel = resolved_channel.id
                await Utils.log_system_event(
                    self.bot, self.log_channel,
                    "Log Channel Configured",
                    f"Kênh log hệ thống đã được thiết lập thành {resolved_channel.mention}",
                    discord.Color.green()
                )
                response_parts.append(f"Đã thiết lập kênh log thành {resolved_channel.mention}!")
            else:
                response_parts.append(f"⚠️ {error_msg}")

        if self.update_task is None or self.update_task.done():
            self.update_task = self.bot.loop.create_task(self.update_loop())

        await interaction.followup.send(" ".join(response_parts), ephemeral=True)

    async def do_start_servers(self, interaction: Interaction, servers: List[str], start_sdk: bool = False, force_restart: bool = False):
        results, has_running = SystemActions.do_start_servers(servers, start_sdk, force_restart)

        if has_running and not force_restart:
            # Show confirmation dialog
            confirm_embed = discord.Embed(
                title="Phát hiện server đang chạy",
                description="\n".join(results),
                color=discord.Color.orange()
            )
            confirm_embed.set_footer(text="Chọn 'Xác nhận' để khởi động lại server hoặc 'Hủy' để dừng.")

            confirm_view = ConfirmationView()
            await interaction.followup.send(embed=confirm_embed, view=confirm_view, ephemeral=True)
            await confirm_view.wait()

            if confirm_view.confirmed:
                # Force restart
                await self.do_start_servers(interaction, servers, start_sdk, force_restart=True)
            else:
                await interaction.followup.send("Đã hủy thao tác khởi động.", ephemeral=True)
                # Log cancelled action
                await Utils.log_system_event(
                    self.bot, self.log_channel,
                    "Server Start Cancelled",
                    f"Người dùng {interaction.user.mention} đã hủy khởi động server",
                    discord.Color.orange()
                )
        else:
            # Normal start or force restart
            for result in results:
                await interaction.followup.send(result, ephemeral=True)

            # Log successful server start
            action_type = "Force Restart" if force_restart else "Start"
            server_list = ", ".join(servers)
            sdk_info = " + SDK" if start_sdk else ""
            await Utils.log_system_event(
                self.bot, self.log_channel,
                f"Servers {action_type}",
                f"Người dùng {interaction.user.mention} đã {action_type.lower()} servers: {server_list}{sdk_info}",
                discord.Color.green()
            )

    async def do_force_stop_all(self, interaction: Interaction):
        results = SystemActions.do_force_stop_all()
        for result in results:
            await interaction.followup.send(result, ephemeral=True)

        # Log server stop action
        await Utils.log_system_event(
            self.bot, self.log_channel,
            "Servers Force Stopped",
            f"Người dùng {interaction.user.mention} đã dừng tất cả servers",
            discord.Color.red()
        )

    async def do_clear_logs(self, interaction: Interaction):
        """Clear all log files in the log directory."""
        messages, files_deleted, errors = SystemActions.do_clear_logs()
        for message in messages:
            await interaction.followup.send(message, ephemeral=True)

        # Log log clearing action
        status = "SUCCESS" if files_deleted > 0 else "NO_FILES"
        color = discord.Color.blue() if files_deleted > 0 else discord.Color.yellow()
        desc = f"Người dùng {interaction.user.mention} đã xóa {files_deleted} file log" if files_deleted > 0 else f"Người dùng {interaction.user.mention} đã thử xóa logs nhưng không có file nào để xóa"
        await Utils.log_system_event(self.bot, self.log_channel, f"Logs Cleared ({status})", desc, color)

async def setup(bot: commands.Bot):
    await bot.add_cog(SYS(bot))
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
import subprocess
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

        # Separate running and stopped servers
        running_servers = []
        stopped_servers = []

        for server_name, status in statuses.items():
            if status["value"] == "Online":
                running_servers.append((server_name, status))
            elif status["value"] == "Offline":
                stopped_servers.append((server_name, status))

        # Running servers section
        if running_servers:
            running_text = "```\n"
            for server_name, status in running_servers:
                server_display = server_name.upper()
                if server_name == "sdk":
                    server_display = "SDK SERVER"

                running_text += f"[ONLINE] {server_display}\n"
                running_text += "\n"
            running_text += "```"
            embed.add_field(name="SERVERS ĐANG CHẠY", value=running_text, inline=True)

        # Stopped servers section
        if stopped_servers:
            stopped_text = "```\n"
            for server_name, status in stopped_servers:
                server_display = server_name.upper()
                if server_name == "sdk":
                    server_display = "SDK SERVER"
                stopped_text += f"[OFFLINE] {server_display}\n"
            stopped_text += "```\n\n"
            embed.add_field(name="SERVERS ĐÃ DỪNG", value=stopped_text, inline=True)

        # Event status section
        for server_name, status in statuses.items():
            if "event_status" in server_name:
                event_text = f"```\n{status['value']}\n```"
                embed.add_field(name="TRẠNG THÁI SỰ KIỆN", value=event_text, inline=False)
                break

        # System resource monitoring
        cpu_usage = self.get_cpu_usage()
        ram_usage = self.get_ram_usage()
        resource_text = f"```\n{cpu_usage}\n{ram_usage}\n```"
        embed.add_field(name="TÀI NGUYÊN HỆ THỐNG", value=resource_text, inline=False)

        # Footer with last update time
        embed.set_footer(text="Cập nhật lần cuối")

        return embed

    def get_cpu_usage(self) -> str:
        """Get CPU usage using top command."""
        try:
            # Run top command and parse CPU usage
            result = subprocess.run(
                ["top", "-bn1"],
                capture_output=True, text=True, check=True
            )
            # Find the Cpu(s) line and extract usage
            for line in result.stdout.split('\n'):
                if 'Cpu(s)' in line:
                    # Parse the CPU percentage from the line
                    parts = line.split()
                    if len(parts) >= 2:
                        cpu_percent = parts[1]
                        return f"CPU: sử dụng {cpu_percent}%"
            return "CPU: unavailable"
        except subprocess.CalledProcessError:
            return "CPU: unavailable"

    def get_ram_usage(self) -> str:
        """Get RAM usage using free command."""
        try:
            # Run free command with --giga flag and parse memory usage
            result = subprocess.run(
                ["free", "--giga"],
                capture_output=True, text=True, check=True
            )
            # Find the Mem: line and extract used memory
            for line in result.stdout.split('\n'):
                if line.startswith('Mem:'):
                    parts = line.split()
                    if len(parts) >= 3:
                        used_ram = parts[2]  # Used memory in GB
                        return f"RAM: sử dụng {used_ram} GB"
            return "RAM: unavailable"
        except subprocess.CalledProcessError:
            return "RAM: unavailable"

    sys = app_commands.Group(name="sys", description="Lệnh hệ thống để quản lý server Genshin Impact 3.4")

    @sys.command(name="panel", description="Thiết lập bảng trạng thái server trong kênh")
    @app_commands.describe(
        channel="Kênh để gửi bảng trạng thái (mặc định: kênh hiện tại)",
        log_channel="Kênh để gửi log hệ thống (tùy chọn)"
    )
    @is_whitelist
    async def setup_panel(self, interaction: Interaction, channel: discord.TextChannel = None, log_channel: discord.TextChannel = None):
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
    
    async def do_start_laylines(self, interaction: Interaction, event: str):
        """Handle starting/stopping laylines events with confirmation for starts."""
        if event != "develop":
            # Show confirmation for starting events
            confirm_embed = discord.Embed(
                title="XÁC NHẬN BẮT ĐẦU SỰ KIỆN",
                description=f"Bạn có muốn bắt đầu sự kiện **{event}** không?\n\n",
                color=discord.Color.orange()
            )
            confirm_embed.set_footer(text="Chọn 'Xác nhận' để bắt đầu sự kiện hoặc 'Hủy' để dừng.")
            confirm_view = ConfirmationView()
            await interaction.followup.send(embed=confirm_embed, view=confirm_view, ephemeral=True)
            await confirm_view.wait()

            if not confirm_view.confirmed:
                await interaction.followup.send("Đã hủy bắt đầu sự kiện.", ephemeral=True)
                return

        # Start/stop the event
        success = SystemActions.do_toggle_event(event)
        if success:
            action = "bắt đầu" if event != "develop" else "dừng"
            status_msg = f"Đã {action} sự kiện {event} thành công!"
            color = discord.Color.green() if event != "develop" else discord.Color.red()
            await interaction.followup.send(status_msg, ephemeral=True)

            # Log to designated channel
            event_action = "Started" if event != "develop" else "Stopped"
            await Utils.log_system_event(
                self.bot, self.log_channel,
                f"Event {event_action}",
                f"Người dùng {interaction.user.mention} đã {action} sự kiện {event}",
                color
            )
        else:
            action = "bắt đầu" if event != "develop" else "dừng"
            await interaction.followup.send(f"Lỗi khi {action} sự kiện {event}!", ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(SYS(bot))
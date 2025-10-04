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
    @discord.ui.button(label="Xác nhận", style=discord.ButtonStyle.success)
    async def confirm(self, interaction: Interaction, button: Button):
        """Handle confirmation."""
        self.confirmed = True
        await interaction.response.edit_message(
            embed=discord.Embed(
                title="ĐÃ XÁC NHẬN",
                description="Đã bắt đầu dừng server!\nĐang dừng tất cả server...",
                color=discord.Color.orange()
            ),
            view=None
        )
        self.stop()
    @discord.ui.button(label="Hủy", style=discord.ButtonStyle.danger)
    async def cancel(self, interaction: Interaction, button: Button):
        """Handle cancellation."""
        self.confirmed = False
        await interaction.response.edit_message(
            embed=discord.Embed(
                title="ĐÃ HỦY",
                description="Đã hủy dừng khẩn cấp.\nTất cả server vẫn đang chạy bình thường.",
                color=discord.Color.blue()
            ),
            view=None
        )
        self.stop()

class ServerPanelView(View):
    """View for the server status panel buttons."""
    def __init__(self):
        super().__init__(timeout=None)
        
    @discord.ui.button(label="Khởi động tất cả", style=discord.ButtonStyle.success, custom_id="sys_start_all")
    async def start_all(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("Bạn không có quyền sử dụng lệnh này.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        
        await interaction.response.defer(ephemeral=True)
        await cog.do_start_servers(interaction, SystemActions.START_SERVER_ORDER, start_sdk=True)

    @discord.ui.button(label="Dừng tất cả", style=discord.ButtonStyle.danger, custom_id="sys_stop_all")
    async def stop_all(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("Bạn không có quyền sử dụng lệnh này.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        
        await interaction.response.defer(ephemeral=True)

        # Create a more user-friendly confirmation dialog
        confirm_embed = discord.Embed(
            title="KHẨN CẤP: Dừng tất cả Server",
            description="**CẢNH BÁO QUAN TRỌNG**\n\n"
                        "Hành động này sẽ **dừng ngay lập tức** tất cả server:\n\n"
                        "**TÁC ĐỘNG:**\n"
                        "• Dừng tất cả tiến trình server\n"
                        "• Dừng server SDK một cách mạnh mẽ\n"
                        "• Nguy cơ mất dữ liệu hoặc hỏng dữ liệu\n\n"
                        "**LỜI KHUYÊN:**\n"
                        "Hãy thử tắt server một cách bình thường trước. Chỉ dùng dừng khẩn cấp trong trường hợp khẩn cấp!",
            color=discord.Color.red()
        )
        confirm_embed.set_footer(text="Bạn có 30 giây để xác nhận hoặc hủy. Hành động này không thể hoàn tác!")

        confirm_view = ConfirmationView()
        await interaction.followup.send(embed=confirm_embed, view=confirm_view, ephemeral=True)
        await confirm_view.wait()
        if confirm_view.confirmed:
            await cog.do_force_stop_all(interaction)
        else:
            await interaction.followup.send("Đã hủy thao tác.", ephemeral=True)

    @discord.ui.button(label="Khởi động Gameserver", style=discord.ButtonStyle.primary, custom_id="sys_start_gameserver")
    async def start_gameserver(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("Bạn không có quyền sử dụng lệnh này.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        
        await interaction.response.defer(ephemeral=True)
        await cog.do_start_servers(interaction, ["gameserver"], start_sdk=False)

    @discord.ui.button(label="Xóa Logs", style=discord.ButtonStyle.secondary, custom_id="sys_clear_logs")
    async def clear_logs(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("Bạn không có quyền sử dụng lệnh này.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')

        await interaction.response.defer(ephemeral=True)
        await cog.do_clear_logs(interaction)
    
    @discord.ui.select(placeholder="Quản lý sự kiện", custom_id="sys_event_toggle", row=0, options=[
        discord.SelectOption(label="Sự kiện địa mạch", value="toggle_blossom", description="Bật/tắt sự kiện Hoa Địa Mạch"),
    ])
    async def manage_event(self, interaction: Interaction, select: discord.ui.Select):
        if not await permission_check(interaction):
            await interaction.response.send_message("Bạn không có quyền sử dụng lệnh này.", ephemeral=True)
            return

        value = select.values[0]
        if value == "toggle_blossom":
            await self._handle_event_toggle(interaction, "blossom")

    async def _handle_event_toggle(self, interaction: Interaction, event_name: str):
        """Handle toggling an event on/off. Start requires confirmation, stop does not."""
        cog = interaction.client.get_cog('SYS')

        # Check current event status - if on event branch, event is active
        try:
            import subprocess
            result = subprocess.run(["git", "branch", "--show-current"], cwd="/gio/data/",
                                  capture_output=True, text=True, check=True)
            current_branch = result.stdout.strip()
            is_event_active = current_branch == "event/blossom"
        except subprocess.CalledProcessError:
            is_event_active = False

        if is_event_active:
            # Event is active, stop it and switch to develop branch
            await interaction.response.defer(ephemeral=True)
            await cog.do_start_laylines(interaction, "develop")
        else:
            # Event is not active, start it (requires confirmation)
            confirm_embed = discord.Embed(
                title="XÁC NHẬN BẮT ĐẦU SỰ KIỆN",
                description=f"Bạn có muốn bắt đầu sự kiện **{event_name}** không?\n\n"
                           f"**Lưu ý:** Việc này sẽ checkout branch sự kiện và pull dữ liệu mới.",
                color=discord.Color.orange()
            )
            confirm_embed.set_footer(text="Chọn 'Xác nhận' để bắt đầu sự kiện hoặc 'Hủy' để dừng.")

            confirm_view = ConfirmationView()
            await interaction.response.send_message(embed=confirm_embed, view=confirm_view, ephemeral=True)
            await confirm_view.wait()

            if confirm_view.confirmed:
                await cog.do_start_laylines(interaction, event_name)
            else:
                await interaction.followup.send("Đã hủy bắt đầu sự kiện.", ephemeral=True)

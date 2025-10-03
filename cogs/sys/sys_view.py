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
        if not cog:
            await interaction.response.send_message("Lỗi: Không tìm thấy System cog.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        await cog.do_start_servers(interaction, SystemActions.START_SERVER_ORDER, start_sdk=True)

    @discord.ui.button(label="Dừng tất cả", style=discord.ButtonStyle.danger, custom_id="sys_stop_all")
    async def stop_all(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("Bạn không có quyền sử dụng lệnh này.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        if not cog:
            await interaction.response.send_message("Lỗi: Không tìm thấy System cog.", ephemeral=True)
            return
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
        if not cog:
            await interaction.response.send_message("Lỗi: Không tìm thấy System cog.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        await cog.do_start_servers(interaction, ["gameserver"], start_sdk=False)

    @discord.ui.button(label="Xóa Logs", style=discord.ButtonStyle.secondary, custom_id="sys_clear_logs")
    async def clear_logs(self, interaction: Interaction, button: Button):
        # Check whitelist permissions
        if not await permission_check(interaction):
            await interaction.response.send_message("Bạn không có quyền sử dụng lệnh này.", ephemeral=True)
            return

        cog = interaction.client.get_cog('SYS')
        if not cog:
            await interaction.response.send_message("Lỗi: Không tìm thấy System cog.", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
        await cog.do_clear_logs(interaction)
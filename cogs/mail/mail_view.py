import discord
from typing import Dict, Callable, Any, Optional
from cogs.ui import SearchModal, ItemSelectionView
from cogs.mail.mail_action import MailActions
from cogs.mail.mail_embed import MailEmbed
from cogs.embed import COLORS
from utils.constants import ITEMS
from utils.utils import Utils


class MailView(discord.ui.View):
    """Mail management view with buttons for item management and mail confirmation."""
    
    def __init__(self, mail_data: Dict, on_mail_sent: Optional[Callable[[bool, str], Any]] = None):
        super().__init__(timeout=300)
        self.mail_data = mail_data.copy()
        self.on_mail_sent = on_mail_sent
        if 'attachments' not in self.mail_data:
            self.mail_data['attachments'] = []
    
    def _render_embed(self) -> MailEmbed:
        """Render mail display embed with current mail data."""
        return MailEmbed(mail_data=self.mail_data)
    
    @discord.ui.button(label="Thêm vật phẩm", style=discord.ButtonStyle.success)
    async def add_item(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle adding items to mail attachments."""
        # Create search modal for item search
        search_modal = SearchModal(
            name=True,
            quantity=True,
            on_submit_cb=self._handle_item_search
        )
        await interaction.response.send_modal(search_modal)
    
    @discord.ui.button(label="Xóa Vật Phẩm", style=discord.ButtonStyle.danger)
    async def remove_item(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle removing items from mail attachments."""
        attachments = self.mail_data.get('attachments', [])
        if not attachments:
            await interaction.response.send_message(
                "Không có item nào để xóa.",
                ephemeral=True
            )
            return
        items_for_removal = []
        for i, attachment in enumerate(attachments):
            item = attachment.get('item', {})
            quantity = attachment.get('quantity', 1)
            removal_item = {
                'name': f"{item.get('name', 'Unknown Item')} x{quantity}",
                'value': str(i),
                'attachment_index': i,
                'original_item': item
            }
            items_for_removal.append(removal_item)
        selection_view = ItemSelectionView(
            items=items_for_removal,
            callback=self._handle_item_removal
        )
        embed = discord.Embed(
            title="Xóa vật phẩm",
            description="Chọn item để xóa khỏi mail:",
            color=COLORS["danger"]
        )
        await interaction.response.send_message(
            embed=embed,
            view=selection_view,
            ephemeral=True
        )
    
    @discord.ui.button(label="Xác nhận gửi", style=discord.ButtonStyle.primary)
    async def confirm_send(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle mail validation and sending with comprehensive validation and detailed feedback."""
        is_valid, error_message = MailActions.validate(self.mail_data)    
        if not is_valid:
            await interaction.response.send_message(
                f"Lỗi: ** {error_message}",
                ephemeral=True
            )
            return
        await interaction.response.defer()
        
        embed = self._render_embed()
        embed.set_mail_status('sending', "Đang xử lý và gửi mail...")
        
        await interaction.followup.edit_message(
            interaction.message.id,
            embed=embed.build_embed(),
            view=self
        )
        
        sender_discord_id = str(interaction.user.id)
        success, message = await MailActions.send(self.mail_data, sender_discord_id)
        
        if success:
            for item in self.children:
                if isinstance(item, discord.ui.Button):
                    item.disabled = True
            embed = self._render_embed()
            embed.set_mail_status('sent', message)
            await interaction.followup.edit_message(
                interaction.message.id,
                embed=embed.build_embed(),
                view=self
            )
            success_embed = discord.Embed(
                title="Gửi thư thành công",
                description=f"**{message}**",
                color=COLORS["success"]
            )
            
            recipient_info = self._get_recipient_summary()
            success_embed.add_field(
                name="Danh sách người nhận:",
                value=recipient_info,
                inline=False
            )
            
            attachments = self.mail_data.get('attachments', [])
            if attachments:
                attachment_summary = f"Tổng cộng {len(attachments)} vật phẩm được gửi đi"
                total_items = sum(att.get('quantity', 1) for att in attachments)
                attachment_summary += f" ({total_items} total items)"
                success_embed.add_field(
                    name="Vật phẩm đã gửi",
                    value=attachment_summary,
                    inline=False
                )
            
            success_embed.set_footer(text="Thành công!")
            
            await interaction.edit_original_response(embed=success_embed, view=self)
            
            if self.on_mail_sent:
                await self.on_mail_sent(True, message)
                
        else:
            embed = self._render_embed()
            embed.set_mail_status('failed', message)
            await interaction.followup.edit_message(
                interaction.message.id,
                embed=embed.build_embed(),
                view=self
            )
            failure_embed = discord.Embed(
                title="Gửi thư thất bại",
                description=f"**Lỗi:** {message}",
                color=COLORS["danger"]
            )
            failure_embed.set_footer(text="Gửi thư thất bại. Hãy thử lại sau")
            await interaction.edit_original_response(embed=failure_embed,view=self)
            if self.on_mail_sent:
                await self.on_mail_sent(False, message)
    
    # functions
    async def _handle_item_search(self, query: str, interaction: discord.Interaction, quantity: Optional[str]):
        """Handle item search results and show selection view."""
        if not query.strip():
            await interaction.response.send_message(
                "Vui lòng nhập tên item để tìm kiếm.",
                ephemeral=True
            )
            return

        item_quantity = int(quantity) if quantity and quantity.strip() else 1
        search_results = Utils.search_items(query, ITEMS, ['name'], 25)
        
        if not search_results:
            await interaction.response.send_message(
                f"Không tìm thấy item nào với từ khóa '{query}'.",
                ephemeral=True
            )
            return
        selection_view = ItemSelectionView(
            items=search_results,
            callback=lambda item, inter: self._handle_item_selection(item, inter, item_quantity)
        )
        
        # Create embed for search results
        embed = discord.Embed(
            title="Kết quả tìm kiếm",
            description=f"Tìm thấy {len(search_results)} item cho '{query}'. Chọn item để thêm vào mail:",
            color=COLORS["primary"]
        )
        await interaction.response.send_message(
            embed=embed,
            view=selection_view,
            ephemeral=True
        )
    
    async def _handle_item_selection(self, item: Dict, interaction: discord.Interaction, quantity: int):
        """Handle item selection and add to mail attachments with quantity limit checking."""
        split_attachments = MailActions.split_item_by_limit(item, quantity)
        self.mail_data['attachments'].extend(split_attachments)
        await interaction.response.edit_message(
            embed=self._render_embed().build_embed(),
            view=self
        )

    async def _handle_item_removal(self, removal_item: Dict, interaction: discord.Interaction):
        """Handle item removal from mail attachments."""
        attachment_index = removal_item.get('attachment_index')
        
        if attachment_index is not None and 0 <= attachment_index < len(self.mail_data['attachments']):
            removed_attachment = self.mail_data['attachments'].pop(attachment_index)
            removed_item = removed_attachment.get('item', {})
            removed_quantity = removed_attachment.get('quantity', 1)
            await interaction.response.edit_message(
                embed=self._render_embed().build_embed(),
                view=self
            )
        else:
            await interaction.response.send_message(
                "Có lỗi xảy ra khi xóa item. Vui lòng thử lại.",
                ephemeral=True
            )
    
    def _get_recipient_summary(self) -> str:
        """Get a summary of recipients for success confirmation."""
        send_to = self.mail_data.get('send_to', '').strip().lower()
        if send_to == 'all':
            return "Tất cả người chơi"
        recipients = [r.strip() for r in self.mail_data.get('send_to', '').split(',') if r.strip()]
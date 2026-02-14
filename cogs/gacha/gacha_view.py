# ui/gacha_views.py
import discord
import time
from typing import Optional, List, Dict, Callable, Any
from cogs.gacha.gacha_embed import GachaEmbed, DraftGachaEmbed
from cogs.gacha.gacha_action import GachaActions
from cogs.ui import SearchModal, TimeModal, ItemSelectionView
from utils.constants import BANNERS
from utils.utils import Utils


class GachaView(discord.ui.View):
    def __init__(self, *, base_id: Optional[int] = None, gacha_type: Optional[int] = None,
                 id1: Optional[int] = None, id2: Optional[int] = None,
                 start: Optional[str] = None, end: Optional[str] = None, enabled: int = 1):
        super().__init__(timeout=300)
        self.base_id = base_id or int(time.time())
        self.gacha_type = gacha_type or 301
        self.item1 = None
        self.item2 = None
        if id1:
            self.item1 = GachaActions.get_banner_from_id(id1)
        if id2:
            self.item2 = GachaActions.get_banner_from_id(id2)
        self.start, self.end = GachaActions.set_default_time(start, end)
        self.enabled = enabled
        self._create_gacha_type_select()

    @property
    def id1(self):
        return int(self.item1['value']) if self.item1 else None

    @property
    def id2(self):
        return int(self.item2['value']) if self.item2 else None

    def _render_embed(self) -> discord.Embed:
        item1_id = int(self.item1['value']) if self.item1 else None
        item2_id = int(self.item2['value']) if self.item2 else None
        e = GachaEmbed(
            id=self.base_id,
            gacha_type=self.gacha_type,
            id1=item1_id,
            id2=item2_id,
            start=self.start,
            end=self.end,
            enabled=self.enabled,
            banner1=self.item1,
            banner2=self.item2
        ).build_embed()
        return e

    def _update_button_labels(self):
        """Update button labels to reflect current state."""
        GachaActions.update_button_labels(self)

    def _create_gacha_type_select(self):
        """Add gacha type selection dropdown to the view."""
        self.children[:] = [child for child in self.children if not isinstance(child, GachaTypeSelect)]

        gacha_types = GachaActions.create_gacha_type_options(self.gacha_type)
        select = GachaTypeSelect(gacha_types, self._on_gacha_type_selected)
        self.add_item(select)

    async def _on_gacha_type_selected(self, selected_value: str, interaction: discord.Interaction):
        """Handle gacha type selection and update the embed."""
        old_gacha_type = self.gacha_type
        self.gacha_type = int(selected_value)
        if GachaActions.handle_gacha_type_change(old_gacha_type, self.gacha_type):
            self.item1 = None
            self.item2 = None
        GachaActions.update_button_labels(self)

        GachaActions.update_gacha_type_select_options(self, self.gacha_type)

        await interaction.response.edit_message(embed=self._render_embed(), view=self)

    async def refresh_message(self, interaction: discord.Interaction):
        await interaction.response.edit_message(embed=self._render_embed(), view=self)

    @discord.ui.button(label="Thêm Vật Phẩm", style=discord.ButtonStyle.success, custom_id="add")
    async def add(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle open modal to search for items."""
        current_item_count = sum([1 for item in [self.item1, self.item2] if item is not None])

        can_add, error_message = GachaActions.can_add_item(current_item_count, self.gacha_type)
        if not can_add:
            await interaction.response.send_message(error_message, ephemeral=True)
            return

        async def on_submit_cb(search_query: str, inter: discord.Interaction):
            matching_items = Utils.search_items(search_query, BANNERS)
            if not matching_items:
                await inter.response.send_message(
                    f"Không tìm thấy item nào với từ khóa: `{search_query}`.",
                    ephemeral=True
                )
                return
            selection_view = ItemSelectionView(matching_items, lambda item, inter: self._on_item_selected(item, inter))
            selection_embed = discord.Embed(
                title="Chọn item",
                description=f"Tìm thấy {len(matching_items)} kết quả cho: `{search_query}`\n\nChọn item từ danh sách bên dưới:",
                color=0x3498db
            )
            await inter.response.send_message(embed=selection_embed, view=selection_view, ephemeral=True)

        await interaction.response.send_modal(SearchModal(name=True, quantity=False, on_submit_cb=on_submit_cb))
    
    @discord.ui.button(label="Xóa Vật phẩm", style=discord.ButtonStyle.danger, custom_id="delete")
    async def delete(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle create selection view to delete item."""
        selected_items = [item for item in [self.item1, self.item2] if item is not None]
        if not selected_items:
            await interaction.response.send_message("Không có item nào để xóa.", ephemeral=True)
            return

        selection_view = ItemSelectionView(selected_items, lambda item, inter: self._on_item_deleted(item, inter))
        selection_embed = discord.Embed(
            title="Chọn item cần xóa",
            description=f"Chọn item từ {len(selected_items)} item đã thêm:",
            color=0x3498db
        )
        await interaction.response.send_message(embed=selection_embed, view=selection_view, ephemeral=True)

    # Thời gian
    @discord.ui.button(label="Thời gian", style=discord.ButtonStyle.secondary, custom_id="time")
    async def set_time(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle open modal to set time."""
        async def on_submit_cb(start: Optional[str], end: Optional[str], inter: discord.Interaction):
            self.start = start
            self.end = end
            await inter.response.edit_message(embed=self._render_embed(), view=self)
        await interaction.response.send_modal(TimeModal(on_submit_cb))

    @discord.ui.button(label="Xác nhận", style=discord.ButtonStyle.primary, custom_id="confirm")
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle confirm button -> go to final confirmation view."""
        is_valid, error_message = GachaActions.validate_data(
            self.item1, self.item2, self.gacha_type
        )
        if not is_valid:
            await interaction.response.send_message(error_message, ephemeral=True)
            return

        item1_id = int(self.item1['value']) if self.item1 else None
        item2_id = int(self.item2['value']) if self.item2 else None

        draft_view = DraftGachaView(
            base_id=self.base_id,
            gacha_type=self.gacha_type,
            id1=item1_id,
            id2=item2_id,
            start=self.start,
            end=self.end,
            enabled=self.enabled
        )
        # Copy item objects to draft view
        draft_view.item1 = self.item1
        draft_view.item2 = self.item2
        draft_embed = DraftGachaEmbed(
            id=self.base_id,
            gacha_type=self.gacha_type,
            id1=item1_id,
            id2=item2_id,
            start=self.start,
            end=self.end,
            enabled=self.enabled,
            banner1=self.item1,
            banner2=self.item2
        ).build_embed()

        await interaction.response.edit_message(embed=draft_embed, view=draft_view)
    

    async def _on_item_selected(self, selected_item: Dict, interaction: discord.Interaction):
        """Handle item selection from the dropdown."""
        current_item_count = sum([1 for item in [self.item1, self.item2] if item is not None])
        can_add, error_message = GachaActions.can_add_item(current_item_count, self.gacha_type)
        if not can_add:
            await interaction.response.send_message(error_message, ephemeral=True)
            return

        # Create temporary state to check validation
        temp_item1 = self.item1
        temp_item2 = self.item2

        if not temp_item1:
            temp_item1 = selected_item
        elif not temp_item2:
            temp_item2 = selected_item
        else:
            temp_item1 = selected_item

        # Validate the temporary state
        from utils.db import validate_gacha_record
        is_valid, error_message = validate_gacha_record(self.gacha_type, temp_item1, temp_item2)
        if not is_valid:
            await interaction.response.send_message(error_message, ephemeral=True)
            return

        # If validation passes, apply the changes
        self.item1 = temp_item1
        self.item2 = temp_item2
        GachaActions.update_button_labels(self)
        await interaction.response.edit_message(embed=self._render_embed(), view=self)
    
    async def _on_item_deleted(self, deleted_item: Dict, interaction: discord.Interaction):
        if self.item1 and self.item1['value'] == deleted_item['value']:
            self.item1 = None
        elif self.item2 and self.item2['value'] == deleted_item['value']:
            self.item2 = None
        GachaActions.update_button_labels(self)
        await interaction.response.edit_message(embed=self._render_embed(), view=self)


class DraftGachaView(discord.ui.View):
    def __init__(self, *, base_id: Optional[int] = None, gacha_type: Optional[int] = None,
                 id1: Optional[int] = None, id2: Optional[int] = None,
                 start: Optional[str] = None, end: Optional[str] = None, enabled: int = 1):
        super().__init__(timeout=300)
        self.base_id = base_id or int(time.time())
        self.gacha_type = gacha_type or 301
        self.item1 = None
        self.item2 = None
        if id1:
            self.item1 = GachaActions.get_banner_from_id(id1)
        if id2:
            self.item2 = GachaActions.get_banner_from_id(id2)

        self.start, self.end = GachaActions.set_default_time(start, end)

        self.enabled = enabled
        GachaActions.update_button_labels(self)
        self._create_gacha_type_select()

    @property
    def id1(self):
        return int(self.item1['value']) if self.item1 else None

    @property
    def id2(self):
        return int(self.item2['value']) if self.item2 else None
    

    def _update_button_labels(self):
        """Update button labels to reflect current state."""
        GachaActions.update_button_labels(self)

    def _create_gacha_type_select(self):
        """Add gacha type selection dropdown to the view."""
        self.children[:] = [child for child in self.children if not isinstance(child, GachaTypeSelect)]

        gacha_types = GachaActions.create_gacha_type_options(self.gacha_type)
        select = GachaTypeSelect(gacha_types, self._on_gacha_type_selected)
        self.add_item(select)

    def _render_embed(self) -> discord.Embed:
        """Render the draft embed with current state."""
        item1_id = int(self.item1['value']) if self.item1 else None
        item2_id = int(self.item2['value']) if self.item2 else None
        e = DraftGachaEmbed(
            id=self.base_id,
            gacha_type=self.gacha_type,
            id1=item1_id,
            id2=item2_id,
            start=self.start,
            end=self.end,
            enabled=self.enabled,
            banner1=self.item1,
            banner2=self.item2
        ).build_embed()
        return e

    async def _on_gacha_type_selected(self, selected_value: str, interaction: discord.Interaction):
        """Handle gacha type selection and update the embed."""
        old_gacha_type = self.gacha_type
        self.gacha_type = int(selected_value)
        if GachaActions.handle_gacha_type_change(old_gacha_type, self.gacha_type):
            self.item1 = None
            self.item2 = None
        GachaActions.update_button_labels(self)

        GachaActions.update_gacha_type_select_options(self, self.gacha_type)

        await interaction.response.edit_message(embed=self._render_embed(), view=self)

    @discord.ui.button(label="Quay lại chỉnh sửa", style=discord.ButtonStyle.secondary, custom_id="back")
    async def back_to_edit(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle back button -> go to edit view."""
        item1_id = int(self.item1['value']) if self.item1 else None
        item2_id = int(self.item2['value']) if self.item2 else None
        view = GachaView(
            base_id=self.base_id,
            gacha_type=self.gacha_type,
            id1=item1_id,
            id2=item2_id,
            start=self.start,
            end=self.end,
            enabled=self.enabled
        )
        view.item1 = self.item1
        view.item2 = self.item2
        embed = GachaEmbed(
            id=self.base_id,
            gacha_type=self.gacha_type,
            id1=item1_id,
            id2=item2_id,
            start=self.start,
            end=self.end,
            enabled=self.enabled,
            banner1=self.item1,
            banner2=self.item2
        ).build_embed()

        await interaction.response.edit_message(embed=embed, view=view)

    @discord.ui.button(label="Xác nhận", style=discord.ButtonStyle.success, custom_id="final_confirm")
    async def final_confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle final confirm button -> submit to server."""
        is_valid, error_message = GachaActions.validate_data(
            self.item1, self.item2, self.gacha_type
        )
        if not is_valid:
            await interaction.response.send_message(error_message, ephemeral=True)
            return

        item1_id = int(self.item1['value']) if self.item1 else None
        item2_id = int(self.item2['value']) if self.item2 else None
        loading_embed = discord.Embed(
            title="Đang xử lý...",
            description="Đang gửi yêu cầu tạo sự kiện đến server...",
            color=0xffa500
        )
        await interaction.response.edit_message(embed=loading_embed, view=None)
        # pass in user id and name to create log
        success = await GachaActions.submit_to_server(
            interaction.user.id,
            interaction.user.name,
            self.item1, 
            self.item2, 
            self.gacha_type, 
            self.start, 
            self.end, 
            self.enabled
        )

        if success:
            item1_name = Utils.get_item_name(self.item1) if self.item1 else 'N/A'
            item2_name = Utils.get_item_name(self.item2) if self.item2 else 'N/A'

            success_embed = discord.Embed(
                title="Sự kiện đã được tạo thành công!",
                description=f"Sự kiện với ID `{self.base_id}` đã khởi động thành công.\n\n"
                           f"**Chi tiết sự kiện:**\n"
                           f"• Loại: {self.gacha_type}\n"
                           f"• Item 1: {item1_name}\n"
                           f"• Item 2: {item2_name}\n"
                           f"• Thời gian: {self.start or 'N/A'} - {self.end or 'N/A'}",
                color=0x00ff00
            )
        else:
            success_embed = discord.Embed(
                title="Lỗi tạo sự kiện",
                description="Có lỗi xảy ra khi tạo sự kiện. Vui lòng thử lại sau.",
                color=0xff0000
            )
        await interaction.edit_original_response(embed=success_embed, view=self)

class GachaTypeSelect(discord.ui.Select):
    """Select menu for choosing gacha type"""

    def __init__(self, options: List[discord.SelectOption], callback: Callable[[str, discord.Interaction], Any]):
        super().__init__(
            placeholder="Chọn loại banner...",
            min_values=1,
            max_values=1,
            options=options
        )
        self._callback = callback

    async def callback(self, interaction: discord.Interaction):
        selected_value = self.values[0]
        await self._callback(selected_value, interaction)

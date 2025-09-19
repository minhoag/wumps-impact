# ui/gacha_views.py
from utils.db import create_gacha_record, get_db_hk4e_config_gio
import discord
import time
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Callable, Any
from .gacha_embed import GachaEmbed, DraftGachaEmbed, get_display_up4_item_list, get_item_name
from utils.constants import BANNERS

def create_gacha_type_options(current_gacha_type: int) -> List[discord.SelectOption]:
    """Create gacha type select options with correct defaults."""
    return [
        discord.SelectOption(
            label="Banner nhân vật 1",
            value="301",
            description="Tạo banner nhân vật 1",
            default=(current_gacha_type == 301)
        ),
        discord.SelectOption(
            label="Banner nhân vật 2",
            value="201",
            description="Tạo banner nhân vật 2",
            default=(current_gacha_type == 201)
        ),
        discord.SelectOption(
            label="Banner vũ khí",
            value="302",
            description="Tạo banner vũ khí",
            default=(current_gacha_type == 302)
        )
    ]

def set_default_time(start: Optional[str], end: Optional[str]):
    """
    Set default start and end times for gacha events.
    Returns a tuple of (start_time_str, end_time_str).
    Always ensures valid datetime strings are returned.
    """
    now = datetime.now()

    if start is None and end is None:
        # Both None: Set start to now, end to 2 weeks later
        start = now.strftime("%Y-%m-%d %H:%M:%S")
        end = (now + timedelta(weeks=2)).strftime("%Y-%m-%d %H:%M:%S")
        return start, end

    elif start is not None and end is None:
        # Only start provided: Set end to 2 weeks after start
        try:
            start_dt = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
            end = (start_dt + timedelta(weeks=2)).strftime("%Y-%m-%d %H:%M:%S")
            return start, end
        except ValueError:
            # Invalid start format, fall back to defaults
            start = now.strftime("%Y-%m-%d %H:%M:%S")
            end = (now + timedelta(weeks=2)).strftime("%Y-%m-%d %H:%M:%S")
            return start, end

    elif start is None and end is not None:
        print("Warning: Only end time provided. Using default start time to prevent potential data overlap.")
        start = now.strftime("%Y-%m-%d %H:%M:%S")
        end = (now + timedelta(weeks=2)).strftime("%Y-%m-%d %H:%M:%S")
        return start, end

    else:
        return start, end


def update_gacha_type_select_options(view: discord.ui.View, current_gacha_type: int):
    """Update existing GachaTypeSelect options with correct defaults."""
    for child in view.children:
        if isinstance(child, GachaTypeSelect):
            child.options = create_gacha_type_options(current_gacha_type)
            break


def update_button_labels(view: discord.ui.View):
    """Update button labels to reflect current state."""
    gacha_type = getattr(view, 'gacha_type', 301)
    item1 = getattr(view, 'item1', None)
    item2 = getattr(view, 'item2', None)

    for child in view.children:
        if isinstance(child, discord.ui.Button):
            if child.custom_id == "add":
                if gacha_type == 302:
                    item_count = sum([1 for item in [item1, item2] if item is not None])
                    if item_count == 0:
                        child.label = "Thêm vũ khí (0/2)"
                    elif item_count == 1:
                        child.label = "Thêm vũ khí (1/2)"
                    else:
                        child.label = "Thêm vũ khí (2/2)"
                else:
                    child.label = "Thêm nhân vật"


class SearchModal(discord.ui.Modal, title="Trình tìm kiếm"):
    name = discord.ui.TextInput(
        label="Tên",
        placeholder="Nhập tên",
        required=True,
        max_length=100
    )

    def __init__(self, on_submit_cb):
        super().__init__()
        self._on_submit_cb = on_submit_cb

    async def on_submit(self, interaction: discord.Interaction):
        await self._on_submit_cb(str(self.name.value).strip(), interaction)

class TimeModal(discord.ui.Modal, title="Thời gian"):
    start_time = discord.ui.TextInput(
        label="Thời gian bắt đầu",
        placeholder="YYYY-MM-DD HH:MM",
        required=False,
        max_length=64
    )
    end_time = discord.ui.TextInput(
        label="Thời gian kết thúc",
        placeholder="YYYY-MM-DD HH:MM",
        required=False,
        max_length=64
    )

    def __init__(self, on_submit_cb):
        super().__init__()
        self._on_submit_cb = on_submit_cb

    async def on_submit(self, interaction: discord.Interaction):
        await self._on_submit_cb(str(self.start_time.value).strip() or None,
                                 str(self.end_time.value).strip() or None,
                                 interaction)

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
            self.item1 = next((item for item in BANNERS if str(item.get('value')) == str(id1)), None)
        if id2:
            self.item2 = next((item for item in BANNERS if str(item.get('value')) == str(id2)), None)
        self.start, self.end = set_default_time(start, end)
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
        update_button_labels(self)

    def _create_gacha_type_select(self):
        """Add gacha type selection dropdown to the view."""
        self.children[:] = [child for child in self.children if not isinstance(child, GachaTypeSelect)]

        gacha_types = create_gacha_type_options(self.gacha_type)
        select = GachaTypeSelect(gacha_types, self._on_gacha_type_selected)
        self.add_item(select)

    async def _on_gacha_type_selected(self, selected_value: str, interaction: discord.Interaction):
        """Handle gacha type selection and update the embed."""
        old_gacha_type = self.gacha_type
        self.gacha_type = int(selected_value)
        if (old_gacha_type == 302 and self.gacha_type != 302) or (old_gacha_type != 302 and self.gacha_type == 302):
            self.item1 = None
            self.item2 = None
        self._update_button_labels()

        update_gacha_type_select_options(self, self.gacha_type)

        await interaction.response.edit_message(embed=self._render_embed(), view=self)

    async def refresh_message(self, interaction: discord.Interaction):
        await interaction.response.edit_message(embed=self._render_embed(), view=self)

    @discord.ui.button(label="Thêm", style=discord.ButtonStyle.primary, custom_id="add")
    async def add(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle open modal to search for items."""
        current_item_count = sum([1 for item in [self.item1, self.item2] if item is not None])

        if self.gacha_type in [301, 201] and current_item_count >= 1:
            await interaction.response.send_message(
                "Banner nhân vật chỉ được phép thêm 1 item.",
                ephemeral=True
            )
            return
        elif self.gacha_type == 302 and current_item_count >= 2:
            await interaction.response.send_message(
                "Banner vũ khí chỉ được phép thêm tối đa 2 item.",
                ephemeral=True
            )
            return

        async def on_submit_cb(search_query: str, inter: discord.Interaction):
            matching_items = self._search_items(search_query)
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

        await interaction.response.send_modal(SearchModal(on_submit_cb))
    
    @discord.ui.button(label="Xóa", style=discord.ButtonStyle.secondary, custom_id="delete")
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

    @discord.ui.button(label="Xác nhận", style=discord.ButtonStyle.success, custom_id="confirm")
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Handle confirm button -> go to final confirmation view."""
        item1_id = int(self.item1['value']) if self.item1 else None
        item2_id = int(self.item2['value']) if self.item2 else None
        if self.gacha_type == 302 and (not item1_id or not item2_id or item1_id == item2_id):
            await interaction.response.send_message("Vui lòng chọn đủ 2 vũ khí 5★ khác nhau cho banner vũ khí.", ephemeral=True)
            return
        if self.gacha_type in (201, 301) and not item1_id:
            await interaction.response.send_message("Vui lòng chọn nhân vật.", ephemeral=True)
            return
        draft_view = DraftView(
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
    
    def _search_items(self, query: str) -> List[Dict]:
        """Search for items matching the query in the BANNERS data. Return at most 25 items."""
        if not query or not query.strip():
            return []

        search_term = query.strip().lower()
        matches = []

        for item in BANNERS:
            item_name = item.get('name', '').lower()
            vietnamese_name = item.get('vietnameseName', '').lower()
            if search_term in item_name or search_term in vietnamese_name:
                matches.append(item)

        matches = matches[:25]

        def sort_key(item):
            name = item.get('name', '').lower()
            viet_name = item.get('vietnameseName', '').lower()
            if name == search_term or viet_name == search_term:
                return 0
            elif name.startswith(search_term) or viet_name.startswith(search_term):
                return 1
            else:
                return 2

        matches.sort(key=sort_key)
        return matches

    async def _on_item_selected(self, selected_item: Dict, interaction: discord.Interaction):
        """Handle item selection from the dropdown."""
        current_item_count = sum([1 for item in [self.item1, self.item2] if item is not None])
        if self.gacha_type in [301, 201]:
            if current_item_count >= 1:
                await interaction.response.send_message(
                    "Banner nhân vật chỉ được phép thêm 1 item.",
                    ephemeral=True
                )
                return
        elif self.gacha_type == 302:
            if current_item_count >= 2:
                await interaction.response.send_message(
                    "Banner vũ khí chỉ được phép thêm tối đa 2 item.",
                    ephemeral=True
                )
                return

        if not self.item1:
            self.item1 = selected_item
        elif not self.item2:
            self.item2 = selected_item
        else:
            self.item1 = selected_item
        self._update_button_labels()
        await interaction.response.edit_message(embed=self._render_embed(), view=self)
    
    async def _on_item_deleted(self, deleted_item: Dict, interaction: discord.Interaction):
        if self.item1 and self.item1['value'] == deleted_item['value']:
            self.item1 = None
        elif self.item2 and self.item2['value'] == deleted_item['value']:
            self.item2 = None
        self._update_button_labels()
        await interaction.response.edit_message(embed=self._render_embed(), view=self)


class DraftView(discord.ui.View):
    def __init__(self, *, base_id: Optional[int] = None, gacha_type: Optional[int] = None,
                 id1: Optional[int] = None, id2: Optional[int] = None,
                 start: Optional[str] = None, end: Optional[str] = None, enabled: int = 1):
        super().__init__(timeout=300)
        self.base_id = base_id or int(time.time())
        self.gacha_type = gacha_type or 301
        self.item1 = None
        self.item2 = None
        if id1:
            self.item1 = next((item for item in BANNERS if str(item.get('value')) == str(id1)), None)
        if id2:
            self.item2 = next((item for item in BANNERS if str(item.get('value')) == str(id2)), None)

        self.start, self.end = set_default_time(start, end)

        self.enabled = enabled
        self._update_button_labels()
        self._create_gacha_type_select()

    @property
    def id1(self):
        return int(self.item1['value']) if self.item1 else None

    @property
    def id2(self):
        return int(self.item2['value']) if self.item2 else None
    
    async def _submit_to_server(self) -> bool:
        """Submit the event data to the server. Returns True if successful."""
        item_1 = self.item1['value']
        item_2 = self.item2['value'] if self.item2 and self.gacha_type == 302 else None
        display_up4_item_list = get_display_up4_item_list(self.item1, self.item2)

        event_data = {
            "item_1": item_1,
            "item_2": item_2,
            "gacha_type": self.gacha_type,
            "display_up4_item_list": display_up4_item_list,
            "start": self.start,
            "end": self.end,
            "enabled": self.enabled
        }
        try:
            return create_gacha_record(**event_data)
            
        except Exception as e:
            print(f"Error submitting gacha event: {e}")
            return False

    def _update_button_labels(self):
        """Update button labels to reflect current state."""
        update_button_labels(self)

    def _create_gacha_type_select(self):
        """Add gacha type selection dropdown to the view."""
        self.children[:] = [child for child in self.children if not isinstance(child, GachaTypeSelect)]

        gacha_types = create_gacha_type_options(self.gacha_type)
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
        if (old_gacha_type == 302 and self.gacha_type != 302) or (old_gacha_type != 302 and self.gacha_type == 302):
            self.item1 = None
            self.item2 = None
        self._update_button_labels()

        update_gacha_type_select_options(self, self.gacha_type)

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
        item1_id = int(self.item1['value']) if self.item1 else None
        item2_id = int(self.item2['value']) if self.item2 else None
        if not item1_id:
            await interaction.response.send_message("Vui lòng chọn nhân vật.", ephemeral=True)
            return
        loading_embed = discord.Embed(
            title="Đang xử lý...",
            description="Đang gửi yêu cầu tạo sự kiện đến server...",
            color=0xffa500
        )
        await interaction.response.edit_message(embed=loading_embed, view=None)
        success = await self._submit_to_server()

        if success:
            item1_name = get_item_name(item1_id) if item1_id else 'N/A'
            item2_name = get_item_name(item2_id) if item2_id else 'N/A'

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

class ItemSelectionView(discord.ui.View):
    """View for selecting items from search results."""

    def __init__(self, items: List[Dict], callback: Callable[[Dict, discord.Interaction], Any]):
        super().__init__(timeout=300)
        self.items = items
        self.callback = callback

        options = []
        values = set()

        for i, item in enumerate(items[:25]):
            item_name = item.get('vietnameseName', '') or item.get('name', 'Unknown')
            item_value = str(item.get('value', '0'))
            unique_value = f"{i}_{item_value}"

            if item_value in values:
                unique_value = f"{i}_{item_value}_{len(values)}"
            else:
                values.add(item_value)

            display_name = item_name[:97] + "..." if len(item_name) > 100 else item_name
            final_value = unique_value[:97] + "..." if len(unique_value) > 100 else unique_value

            options.append(discord.SelectOption(
                label=display_name,
                value=final_value,
                description=f"ID: {item_value}"
            ))

        self.add_item(ItemSelect(options, self.items, self.callback))


class ItemSelect(discord.ui.Select):
    """Select menu for choosing items. Show at most 25 items."""

    def __init__(self, options: List[discord.SelectOption], items: List[Dict], callback: Callable[[Dict, discord.Interaction], Any]):
        super().__init__(
            placeholder="Chọn item từ danh sách...",
            min_values=1,
            max_values=1,
            options=options
        )
        self.items = items
        self._callback = callback

    async def callback(self, interaction: discord.Interaction):
        selected_value = self.values[0]
        parts = selected_value.split('_', 1)

        if len(parts) >= 2:
            index = int(parts[0])
            if 0 <= index < len(self.items):
                selected_item = self.items[index]
                await self._callback(selected_item, interaction)
                return

        item_value_part = selected_value.split('_')[-1]
        selected_item = None
        for item in self.items:
            if str(item.get('value', '')) == item_value_part:
                selected_item = item
                break

        if selected_item:
            await self._callback(selected_item, interaction)
        else:
            await interaction.response.send_message(
                "Có lỗi xảy ra khi chọn item. Vui lòng thử lại.",
                ephemeral=True
            )


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

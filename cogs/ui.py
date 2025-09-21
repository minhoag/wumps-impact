import discord
from typing import Optional, Callable, Any, List, Dict
from utils.logger import logger


class SearchModal(discord.ui.Modal, title="Trình tìm kiếm"):
    """Reusable search modal for finding items or content."""
    def __init__(self, name: bool, quantity: bool, on_submit_cb: Callable[[str, discord.Interaction, Optional[str]], Any]):
        super().__init__()
        self.name = name
        self.quantity = quantity
        if name:
            name_input = discord.ui.TextInput(
                label="Tên item",
                placeholder="Tên item",
                required=True,
                max_length=64
            )
            self.add_item(name_input)
        if quantity:
            quantity_input = discord.ui.TextInput(
                label="Số lượng",
                placeholder="Số lượng",
                required=True,
                max_length=64
            )
            self.add_item(quantity_input)
        self.on_submit_cb = on_submit_cb
    
    def add_item(self, item: discord.ui.TextInput):
        super().add_item(item)

    async def on_submit(self, interaction: discord.Interaction):
        """Handle the submission of the search modal."""
        components = interaction.data.get('components', [])
        name = ""

        if len(components) > 0:
            name = components[0].get('components', [{}])[0].get('value', '').strip()

        if self.quantity:
            quantity = "1"
            if len(components) > 1:
                quantity_value = components[1].get('components', [{}])[0].get('value', '').strip()
                if quantity_value:
                    quantity = quantity_value
            await self.on_submit_cb(name, interaction, quantity)
        else:
            await self.on_submit_cb(name, interaction)


class TimeModal(discord.ui.Modal, title="Thời gian"):
    """Reusable time input modal for setting start and end times."""

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

    def __init__(self, on_submit_cb: Callable[[Optional[str], Optional[str], discord.Interaction], Any]):
        super().__init__()
        self._on_submit_cb = on_submit_cb

    async def on_submit(self, interaction: discord.Interaction):
        # Get values from the interaction data with proper error handling
        components = interaction.data.get('components', [])

        start_time = None
        end_time = None

        try:
            if len(components) > 0:
                start_time_value = components[0].get('components', [{}])[0].get('value', '').strip()
                if start_time_value:
                    start_time = start_time_value
            if len(components) > 1:
                end_time_value = components[1].get('components', [{}])[0].get('value', '').strip()
                if end_time_value:
                    end_time = end_time_value
        except (IndexError, KeyError, AttributeError) as e:
            logger.info(f"Error extracting time modal data: {e}")
            logger.info(f"Interaction data: {interaction.data}")

        await self._on_submit_cb(start_time, end_time, interaction)


class ItemSelect(discord.ui.Select):
    """Reusable select menu for choosing items. Show at most 25 items."""

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
        for item in self.items:
            if str(item.get('value', '')) == item_value_part:
                await self._callback(item, interaction)
                return

        # If no item found, send error message
        await interaction.response.send_message(
            "Có lỗi xảy ra khi chọn item. Vui lòng thử lại.",
            ephemeral=True
        )


class ItemSelectionView(discord.ui.View):
    """Reusable view for selecting items from search results."""

    def __init__(self, items: List[Dict], callback: Callable[[Dict, discord.Interaction], Any]):
        super().__init__(timeout=300)
        self.items = items
        self.callback = callback

        options = []
        values = set()

        for i, item in enumerate(items[:25]):
            item_name = item.get('globalName', None) or item.get('vietnameseName', None) or 'Unknown'
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
                description=f"{item_value}"
            ))

        self.add_item(ItemSelect(options, self.items, self.callback))

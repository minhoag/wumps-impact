import discord
from typing import Optional, Dict
from utils.embed import Embed
from utils.constants import BANNERS, INTERTWINED_FATE
from datetime import datetime

def get_item_name(item_id: Optional[int]) -> str: 
    """Get item name from BANNERS data by ID."""
    if not item_id:
        return "Chưa chọn"

    for item in BANNERS:
        if item.get('value') == item_id:
            vietnamese_name = item.get('vietnameseName', '').strip()
            english_name = item.get('name', '').strip()
            return vietnamese_name or english_name or f"ID: {item_id}"

    return f"ID: {item_id}"


def get_display_up4_item_list(banner1=None, banner2=None) -> list:
    """Get list of 4-star rate-up item names from selected banner objects."""
    up4_items = set()
    selected_banners = [banner1, banner2]
    for selected_banner in selected_banners:
        if selected_banner:
            rate_up_4 = selected_banner.get('rateUpItems4', '')
            if rate_up_4 and rate_up_4.strip():
                for item_id in rate_up_4.split(','):
                    item_id = item_id.strip()
                    if item_id and item_id.isdigit():
                        up4_items.add(int(item_id))
    if not up4_items:
        return []
    return [str(item_id) for item_id in sorted(up4_items)]

class GachaEmbed(Embed):
    def __init__(self, id: int, gacha_type: int, id1: Optional[int], id2: Optional[int], start: Optional[str], end: Optional[str], enabled: int, banner1=None, banner2=None):
        super().__init__()
        self.id = id
        self.gacha_type = gacha_type
        self.id1 = id1
        self.id2 = id2
        self.start = start or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.end = end or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.enabled = enabled

        # Use provided banner objects, or find them from IDs if not provided
        if banner1 is None and id1:
            for banner in BANNERS:
                if banner.get('value') and str(banner.get('value')) == str(id1):
                    banner1 = banner
                    break
        if banner2 is None and id2:
            for banner in BANNERS:
                if banner.get('value') and str(banner.get('value')) == str(id2):
                    banner2 = banner
                    break

        self.display_up4_item_list = get_display_up4_item_list(banner1, banner2)
        self.gacha_type_name = {
            201: "Banner nhân vật 2",
            301: "Banner nhân vật 1",
            302: "Banner vũ khí",
        }


    def build_embed(self):
        embed = Embed(
            title="Thêm sự kiện",
            color=0x3498db
        )
        embed.set_thumbnail(INTERTWINED_FATE)
        embed.add_field(name="Session", value=self.id, inline=True)
        embed.add_field(name="Loại sự kiện", value=self.gacha_type_name[self.gacha_type], inline=True)

        # Display selected items with names
        items_text = ""
        if self.id1:
            item_name = get_item_name(self.id1)
            items_text += f"• {item_name}"
        if self.id2:
            item_name = get_item_name(self.id2)
            items_text += f"\n• {item_name}"
        if not items_text:
            items_text = "Chưa chọn item nào"

        embed.add_field(name="5 sao", value=items_text, inline=False)

        # Format the 4-star items list for display
        if self.display_up4_item_list:
            display_text = " • " + "\n • ".join(self.display_up4_item_list)
        else:
            display_text = "Không có"

        embed.add_field(name="4 sao", value=display_text, inline=False)
        embed.add_field(name="Thời gian bắt đầu", value=self.start or "Chưa thiết lập", inline=True)
        embed.add_field(name="Thời gian kết thúc", value=self.end or "Chưa thiết lập", inline=True)
        embed.add_field(name="Trạng thái", value="Bắt đầu ngay" if self.enabled else "Chưa bắt đầu ngay", inline=True)

        return embed.build_embed()

class DraftGachaEmbed(Embed):
    def __init__(self, id: int, gacha_type: int, id1: Optional[int], id2: Optional[int], start: Optional[str], end: Optional[str], enabled: int, banner1=None, banner2=None):
        super().__init__()
        self.id = id
        self.gacha_type = gacha_type
        self.id1 = id1
        self.id2 = id2
        self.start = start or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.end = end or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.enabled = enabled

        # Use provided banner objects, or find them from IDs if not provided
        if banner1 is None and id1:
            for banner in BANNERS:
                if banner.get('value') and str(banner.get('value')) == str(id1):
                    banner1 = banner
                    break
        if banner2 is None and id2:
            for banner in BANNERS:
                if banner.get('value') and str(banner.get('value')) == str(id2):
                    banner2 = banner
                    break

        self.display_up4_item_list = get_display_up4_item_list(banner1, banner2)
        self.gacha_type_name = {
            201: "Banner nhân vật 2",
            301: "Banner nhân vật 1",
            302: "Banner vũ khí",
        }

    def build_embed(self):
        embed = Embed(
            title="Xác nhận sự kiện",
            description="Đây là bản nháp của sự kiện sẽ được tạo. Hãy kiểm tra kỹ trước khi xác nhận.",
            color=0xffa500
        )
        embed.add_field(name="Session", value=self.id, inline=True)
        embed.add_field(name="Loại sự kiện", value=self.gacha_type_name[self.gacha_type], inline=True)

        # Display selected items with names
        items_text = ""
        if self.id1:
            item_name = get_item_name(self.id1)
            items_text += f"• {item_name}"
        if self.id2:
            item_name = get_item_name(self.id2)
            items_text += f"\n• {item_name}"
        if not items_text:
            items_text = "Không có item nào được chọn"

        embed.add_field(name="Items được chọn", value=items_text, inline=False)

        if self.display_up4_item_list:
            display_text = " • " + "\n • ".join(self.display_up4_item_list)
        else:
            display_text = "Không có vật phẩm 4 sao đi kèm"

        embed.add_field(name="Vật phẩm 4 sao đi kèm", value=display_text, inline=True)
        embed.add_field(name="Thời gian bắt đầu", value=self.start or "Chưa thiết lập", inline=True)
        embed.add_field(name="Thời gian kết thúc", value=self.end or "Chưa thiết lập", inline=True)
        embed.add_field(name="Trạng thái", value="Bắt đầu ngay" if self.enabled else "Chưa bắt đầu ngay", inline=True)

        return embed.build_embed()
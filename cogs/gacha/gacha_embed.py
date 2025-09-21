from typing import Optional
from cogs.embed import Embed, COLORS
from utils.constants import BANNERS
from datetime import datetime
from .gacha_action import GachaActions
from utils.utils import Utils


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

        self.display_up4_item_list = GachaActions.get_display_up4_item_list(banner1, banner2)
        self.gacha_type_name = {
            201: "Banner nhân vật 2",
            301: "Banner nhân vật 1",
            302: "Banner vũ khí",
        }


    def build_embed(self):
        # Set up this embed instance instead of creating a new one
        self.embed.title = "Thêm sự kiện"
        self.embed.color = COLORS["primary"]

        intertwined_fate = Utils.get_image_file("intertwined_fate.webp")
        author_icon_file = Utils.get_image_file("author.webp")
        self.set_author(name="Tạo sự kiện giới hạn", icon_file=author_icon_file)
        self.set_thumbnail(thumb_file=intertwined_fate)

        self.add_field(name="Session", value=self.id, inline=True)
        self.add_field(name="Loại sự kiện", value=self.gacha_type_name[self.gacha_type], inline=True)

        # Display selected items with names
        items_text = ""
        if self.id1:
            items_text += f"{Utils.get_item_name(self.id1)}"
        if self.id2:
            items_text += f"\n{Utils.get_item_name(self.id2)}"
        if not items_text:
            items_text = "Chưa chọn vật phẩm nào"

        self.add_field(name="5 sao", value=items_text, inline=False)

        # Format the 4-star items list for display
        if self.display_up4_item_list:
            display_text = " • " + "\n • ".join(Utils.get_item_name(item) for item in self.display_up4_item_list)
        else:
            display_text = "Chưa chọn vật phẩm nào"

        self.add_field(name="4 sao", value=display_text, inline=False)
        self.add_field(name="Thời gian bắt đầu", value=self.start or "Chưa thiết lập", inline=True)
        self.add_field(name="Thời gian kết thúc", value=self.end or "Chưa thiết lập", inline=True)
        self.add_field(name="Trạng thái", value="Bắt đầu ngay" if self.enabled else "Chưa bắt đầu ngay", inline=True)

        return self.embed

# TODO: refactor draft embed
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

        self.display_up4_item_list = GachaActions.get_display_up4_item_list(banner1, banner2)
        self.gacha_type_name = {
            201: "Banner nhân vật 2",
            301: "Banner nhân vật 1",
            302: "Banner vũ khí",
        }

    def build_embed(self):
        # TODO: add get items name for this draft embed and remove duplicate code
        self.embed.title = "Xác nhận sự kiện"
        self.embed.description = "Đây là bản nháp của sự kiện sẽ được tạo. Hãy kiểm tra kỹ trước khi xác nhận."
        self.embed.color = COLORS["warning"]

        intertwined_fate = Utils.get_image_file("intertwined_fate.webp")
        author_icon_file = Utils.get_image_file("author.webp")
        self.set_author(name="Tạo sự kiện giới hạn", icon_file=author_icon_file)
        self.set_thumbnail(thumb_file=intertwined_fate)

        self.add_field(name="Session", value=self.id, inline=True)
        self.add_field(name="Loại sự kiện", value=self.gacha_type_name[self.gacha_type], inline=True)

        # Display selected items with names
        items_text = ""
        if self.id1:
            item_name = Utils.get_item_name(self.id1)
            items_text += f"• {item_name}"
        if self.id2:
            item_name = Utils.get_item_name(self.id2)
            items_text += f"\n• {item_name}"
        if not items_text:
            items_text = "Không có vật phẩm nào được chọn"

        self.add_field(name="Vật phẩm được chọn", value=items_text, inline=False)

        if self.display_up4_item_list:
            display_text = " • " + "\n • ".join(self.display_up4_item_list)
        else:
            display_text = "Không tìm thấy vật phẩm 4 sao đi kèm"

        self.add_field(name="Vật phẩm 4 sao đi kèm", value=display_text, inline=True)
        self.add_field(name="Thời gian bắt đầu", value=self.start or "Chưa thiết lập", inline=True)
        self.add_field(name="Thời gian kết thúc", value=self.end or "Chưa thiết lập", inline=True)
        self.add_field(name="Trạng thái", value="Bắt đầu ngay" if self.enabled else "Chưa bắt đầu ngay", inline=True)

        return self.embed
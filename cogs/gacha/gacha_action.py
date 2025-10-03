from typing import Optional, List, Dict, Callable, Any, Tuple
from datetime import datetime, timedelta
import discord
from utils.db import create_gacha_record, create_log_record, validate_gacha_record
from utils.constants import BANNERS
from utils.utils import Utils
from utils.logger import logger

class GachaActions:
    """Gacha operate logic"""

    @staticmethod
    async def submit_to_server(
        user_id: int,
        user_name: str,
        item1: Dict, 
        item2: Optional[Dict], 
        gacha_type: int, 
        start: str, 
        end: str, 
        enabled: int
    ) -> bool:
        """Submit the event data to the server. Returns True if successful."""
        try:
            item_1 = item1['value'] if item1 else None
            item_2 = item2['value'] if item2 and gacha_type == 302 else None

            if not item_1:
                raise ValueError("Item 1 is required")

            display_up4_item_list = GachaActions.get_display_up4_item_list(item1, item2)

            event_data = {
                "item_1": item_1,
                "item_2": item_2,
                "gacha_type": gacha_type,
                "display_up4_item_list": display_up4_item_list,
                "start": start,
                "end": end,
                "enabled": enabled
            }

            # create log
            create_log_record(
                type="GACHA_CREATE",
                message=f"SUCCESS|CREATE|{user_id}|{user_name}|{item_1}|{item_2}|{gacha_type}|{start}|{end}|{enabled}"
            )

            # create gacha record
            return create_gacha_record(**event_data)

        except Exception as e:
            logger.info(f"Error submitting gacha event: {e}")
            return False

    @staticmethod
    def validate_data(item1: Optional[Dict], item2: Optional[Dict], gacha_type: int) -> tuple[bool, str]:
        """Validate items based on gacha type requirements."""
        item1_id = item1['value'] if item1 else None
        item2_id = item2['value'] if item2 else None

        # Weapon banner -> check if it is weapon and have 2 different weapons
        if gacha_type == 302:
            if not item1_id or not item2_id:
                return False, "Vui lòng chọn đủ 2 vũ khí 5★ khác nhau cho banner vũ khí."
            if item1_id == item2_id:
                return False, "Vui lòng chọn đủ 2 vũ khí 5★ khác nhau cho banner vũ khí."
            if not Utils.is_weapon(item1_id) or not Utils.is_weapon(item2_id):
                msg = ""
                if not Utils.is_weapon(item1_id):
                    msg = f"{Utils.get_item_name(item1_id)} không phải là vũ khí."
                if not Utils.is_weapon(item2_id):
                    msg = f"{Utils.get_item_name(item2_id)} không phải là vũ khí."
                else:
                    msg = f"{Utils.get_item_name(item1_id)} và {Utils.get_item_name(item2_id)} đều không phải là vũ khí."
                return False, msg

        # Character banners -> check if it is character and have 1 character
        elif gacha_type in (201, 301):
            if not item1_id:
                return False, "Vui lòng chọn nhân vật."
            if not Utils.is_character(item1_id):
                msg = f"{Utils.get_item_name(item1_id)} không phải là nhân vật."
                return False, msg
        
        # Check if already have this gacha on server
        is_valid, msg = validate_gacha_record(gacha_type, item1, item2)
        if not is_valid:
            return False, msg

        return True, ""

    @staticmethod
    def can_add_item(current_item_count: int, gacha_type: int) -> tuple[bool, str]:
        """Check if an item can be added based on current count and gacha type."""
        if gacha_type in [301, 201] and current_item_count >= 1:
            return False, "Nhân vật chỉ được hoạt động với 1 nhân vật."
        elif gacha_type == 302 and current_item_count >= 2:
            return False, "Vũ khí chỉ được phép hoạt động với 2 vũ khí."
        return True, ""

    @staticmethod
    def get_banner_from_id(item_id: int) -> Optional[Dict]:
        """Find banner object from item ID."""
        for banner in BANNERS:
            if banner.get('value') and str(banner.get('value')) == str(item_id):
                return banner
        return None

    @staticmethod
    def set_default_time(start: Optional[str], end: Optional[str]) -> Tuple[str, str]:
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
            logger.info("Warning: Only end time provided. Using default start time to prevent potential data overlap.")
            start = now.strftime("%Y-%m-%d %H:%M:%S")
            end = (now + timedelta(weeks=2)).strftime("%Y-%m-%d %H:%M:%S")
            return start, end

        else:
            return start, end

    @staticmethod
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

    @staticmethod
    def update_gacha_type_select_options(view: discord.ui.View, current_gacha_type: int):
        """Update existing GachaTypeSelect options with correct defaults."""
        for child in view.children:
            if hasattr(child, '__class__') and 'GachaTypeSelect' in str(child.__class__):
                child.options = GachaActions.create_gacha_type_options(current_gacha_type)
                break

    @staticmethod
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

    @staticmethod
    def handle_gacha_type_change(old_gacha_type: int, new_gacha_type: int) -> bool:
        """Handle gacha type change logic. Returns True if items should be reset."""
        return (old_gacha_type == 302 and new_gacha_type != 302) or (old_gacha_type != 302 and new_gacha_type == 302)

    @staticmethod
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

# cogs/gm/gm.py
from discord import app_commands, Interaction
from discord.ext import commands
from typing import List
from cogs.gm.gm_action import GMActions
from utils.utils import Utils
from utils.constants import ITEMS
from cogs.permission import permission

class GM(commands.Cog):
    """Cog for handling GM commands."""
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    gm = app_commands.Group(name="gm", description="Lệnh GM để quản lý server Genshin Impact 3.4")

    async def item_autocomplete(self, interaction: Interaction, current: str) -> List[app_commands.Choice[int]]:
        """Autocomplete for item IDs using search."""
        matching_items = await self.bot.loop.run_in_executor(None, lambda: Utils.search_items(current, ITEMS, ['vietnameseName', 'globalName'], 25))
        return [
            app_commands.Choice(
                name=Utils.get_item_name(item),
                value=int(item['value'])
            ) for item in matching_items
        ]
    
    @gm.command(name="general", description="Thực hiện lệnh GM chung không cần tham số bổ sung")
    @app_commands.describe(
        uid="UID của người chơi",
        command="Chọn lệnh chung"
    )
    @app_commands.choices(command=[
        app_commands.Choice(name="Bật Stamina Vô Hạn", value="stamina infinite on"),
        app_commands.Choice(name="Tắt Stamina Vô Hạn", value="stamina infinite off"),
        app_commands.Choice(name="Bật Năng Lượng Vô Hạn", value="energy infinite on"),
        app_commands.Choice(name="Tắt Năng Lượng Vô Hạn", value="energy infinite off"),
        app_commands.Choice(name="Tự Sát", value="kill self"),
        app_commands.Choice(name="Giết Tất Cả Quái Vật", value="kill monster all"),
        app_commands.Choice(name="Bật HP Vô Hạn Nhân Vật", value="wudi global avatar on"),
        app_commands.Choice(name="Tắt HP Vô Hạn Nhân Vật", value="wudi global avatar off"),
        app_commands.Choice(name="Bật HP Vô Hạn Quái Vật", value="wudi global monster on"),
        app_commands.Choice(name="Tắt HP Vô Hạn Quái Vật", value="wudi global monster off"),
        app_commands.Choice(name="Mở Khóa Tất Cả Thiên Phú & Đồ Ngự", value="talent unlock all"),
        app_commands.Choice(name="Mở Khóa Tất Cả Điểm dịch chuyển", value="point 3 all"),
        app_commands.Choice(name="Mở Khóa Chơi Nhiều Người (quest accept 30904)", value="quest accept 30904"),
        app_commands.Choice(name="Mở Khóa Chúc Phúc (quest accept 35801)", value="quest accept 35801"),
        app_commands.Choice(name="Mở Khóa Bay (quest accept 35603)", value="quest accept 35603"),
        app_commands.Choice(name="Thêm Tất Cả Vật Phẩm & Nhân Vật Lv1", value="item add all"),
    ])
    async def general(self, interaction: Interaction, uid: str, command: str):
        """Send a general GM command to the specified UID."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="equip_add", description="Thêm vũ khí cho người chơi")
    @app_commands.describe(
        uid="UID của người chơi",
        item_id="ID vũ khí (có thể tìm kiếm)",
        level="Cấp độ vũ khí (mặc định: 90)",
        promote_level="Cấp độ tinh luyện (mặc định: 6)"
    )
    @app_commands.autocomplete(item_id=item_autocomplete)
    async def equip_add(self, interaction: Interaction, uid: str, item_id: int, level: int = 90, promote_level: int = 6):
        """Send equip add command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        command = f"equip add {item_id} {level} {promote_level}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="item_add", description="Add an item to the player")
    @app_commands.describe(
        uid="UID of the player",
        item_id="Item ID (searchable)",
        count="Amount to add"
    )
    @app_commands.autocomplete(item_id=item_autocomplete)
    async def item_add(self, interaction: Interaction, uid: str, item_id: int, count: int):
        """Send item add command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        if count <= 0 or count > 1000000:
            await interaction.response.send_message("Số lượng phải từ 1 đến 1,000,000.", ephemeral=True)
            return
        command = f"item add {item_id} {count}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="item_clear", description="Remove an item from the player")
    @app_commands.describe(
        uid="UID of the player",
        item_id="Item ID (searchable)",
        count="Amount to remove"
    )
    @app_commands.autocomplete(item_id=item_autocomplete)
    async def item_clear(self, interaction: Interaction, uid: str, item_id: int, count: int):
        """Send item clear command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        if count <= 0 or count > 1000000:
            await interaction.response.send_message("Số lượng phải từ 1 đến 1,000,000.", ephemeral=True)
            return
        command = f"item clear {item_id} {count}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="avatar_add", description="Thêm nhân vật cho người chơi")
    @app_commands.describe(
        uid="UID của người chơi",
        avatar_id="ID nhân vật (có thể tìm kiếm)"
    )
    @app_commands.autocomplete(avatar_id=item_autocomplete)
    async def avatar_add(self, interaction: Interaction, uid: str, avatar_id: int):
        """Send avatar add command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        command = f"avatar add {avatar_id}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="quest", description="Quản lý nhiệm vụ cho người chơi")
    @app_commands.describe(
        uid="UID của người chơi",
        action="Hành động nhiệm vụ",
        quest_id="ID nhiệm vụ (có thể tìm kiếm)"
    )
    @app_commands.choices(action=[
        app_commands.Choice(name="Thêm", value="add"),
        app_commands.Choice(name="Nhận", value="accept"),
        app_commands.Choice(name="Hoàn thành", value="finish"),
    ])
    @app_commands.autocomplete(quest_id=item_autocomplete)
    async def quest(self, interaction: Interaction, uid: str, action: str, quest_id: int):
        """Send quest command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        command = f"quest {action} {quest_id}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="player_level", description="Thiết lập cấp độ phiêu lưu của người chơi")
    @app_commands.describe(
        uid="UID của người chơi",
        level="Cấp độ phiêu lưu (1-60)"
    )
    async def player_level(self, interaction: Interaction, uid: str, level: int):
        """Send player level command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        command = f"player level {level}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="jump", description="Dịch chuyển đến một khu vực")
    @app_commands.describe(
        uid="UID của người chơi",
        scene_id="ID khu vực (có thể tìm kiếm)"
    )
    @app_commands.autocomplete(scene_id=item_autocomplete)
    async def jump(self, interaction: Interaction, uid: str, scene_id: int):
        """Send jump command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        command = f"jump {scene_id}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="goto", description="Dịch chuyển đến tọa độ cụ thể")
    @app_commands.describe(
        uid="UID của người chơi",
        x="Tọa độ X",
        y="Tọa độ Y",
        z="Tọa độ Z"
    )
    async def goto_cmd(self, interaction: Interaction, uid: str, x: float, y: float, z: float):
        """Send goto command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        command = f"goto {x} {y} {z}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="dungeon", description="Vào một dungeon")
    @app_commands.describe(
        uid="UID của người chơi",
        dungeon_id="ID dungeon (có thể tìm kiếm)"
    )
    @app_commands.autocomplete(dungeon_id=item_autocomplete)
    async def dungeon(self, interaction: Interaction, uid: str, dungeon_id: int):
        """Send dungeon command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        command = f"dungeon {dungeon_id}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="monster", description="Triệu hồi quái vật")
    @app_commands.describe(
        uid="UID của người chơi",
        monster_id="ID quái vật (có thể tìm kiếm)",
        count="Số lượng triệu hồi (mặc định: 5)",
        level="Cấp độ quái vật (mặc định: 20)"
    )
    @app_commands.autocomplete(monster_id=item_autocomplete)
    async def monster(self, interaction: Interaction, uid: str, monster_id: int, count: int = 5, level: int = 20):
        """Send monster spawn command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        command = f"monster {monster_id} {count} {level}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="mcoin", description="Thêm Nguyên Thạch")
    @app_commands.describe(
        uid="UID của người chơi",
        amount="Số lượng cần thêm"
    )
    async def mcoin(self, interaction: Interaction, uid: str, amount: int):
        """Send mcoin command (Genesis Crystals)."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        if amount <= 0 or amount > 1000000:
            await interaction.response.send_message("Số lượng phải từ 1 đến 1,000,000.", ephemeral=True)
            return
        command = f"mcoin {amount}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="scoin", description="Thêm Mora")
    @app_commands.describe(
        uid="UID của người chơi",
        amount="Số lượng cần thêm"
    )
    async def scoin(self, interaction: Interaction, uid: str, amount: int):
        """Send scoin command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        if amount <= 0 or amount > 1000000:
            await interaction.response.send_message("Số lượng phải từ 1 đến 1,000,000.", ephemeral=True)
            return
        command = f"scoin {amount}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="hcoin", description="Thêm Primogem")
    @app_commands.describe(
        uid="UID của người chơi",
        amount="Số lượng cần thêm"
    )
    async def hcoin(self, interaction: Interaction, uid: str, amount: int):
        """Send hcoin command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        if amount <= 0 or amount > 1000000:
            await interaction.response.send_message("Số lượng phải từ 1 đến 1,000,000.", ephemeral=True)
            return
        command = f"hcoin {amount}"
        await GMActions.execute_gm_command(interaction, uid, command)
    @gm.command(name="home_coin", description="Thêm Tiền Liền Sở")
    @app_commands.describe(
        uid="UID của người chơi",
        amount="Số lượng cần thêm"
    )
    async def home_coin(self, interaction: Interaction, uid: str, amount: int):
        """Send home_coin command."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        if amount <= 0 or amount > 1000000:
            await interaction.response.send_message("Số lượng phải từ 1 đến 1,000,000.", ephemeral=True)
            return
        command = f"home_coin {amount}"
        await GMActions.execute_gm_command(interaction, uid, command)
    
    @gm.command(name="whitelist", description="Cập nhật whitelist")
    async def refresh_whitelist(self, interaction: Interaction):
        """Refresh the whitelist."""
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        await self.bot.sync_whitelist()
        await interaction.response.send_message("Whitelist đã được cập nhật.", ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(GM(bot))
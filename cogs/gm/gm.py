# cogs/gm/gm.py

import discord
from discord import app_commands, Interaction
from discord.ext import commands
from typing import List
from utils.muip import MUIP
from cogs.check import is_whitelist
from cogs.gm.gm_action import GMActions
from utils.utils import Utils
from utils.constants import ITEMS

class GM(commands.Cog):
    """Cog for handling GM commands."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    gm = app_commands.Group(name="gm", description="GM commands for Genshin Impact 3.4 server management")

    async def item_autocomplete(self, interaction: Interaction, current: str) -> List[app_commands.Choice[int]]:
        """Autocomplete for item IDs using search."""
        matching_items = Utils.search_items(current, ITEMS, ['vietnameseName', 'globalName'], 25)
        return [
            app_commands.Choice(
                name=item.get('vietnameseName', item.get('globalName', 'Unknown')),
                value=int(item['value'])
            ) for item in matching_items
        ]

    @gm.command(name="general", description="Execute general GM commands that don't require additional parameters")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        command="Choose a general command"
    )
    @app_commands.choices(command=[
        app_commands.Choice(name="Stamina Infinite On", value="stamina infinite on"),
        app_commands.Choice(name="Stamina Infinite Off", value="stamina infinite off"),
        app_commands.Choice(name="Energy Infinite On", value="energy infinite on"),
        app_commands.Choice(name="Energy Infinite Off", value="energy infinite off"),
        app_commands.Choice(name="Kill Self", value="kill self"),
        app_commands.Choice(name="Kill All Monsters", value="kill monster all"),
        app_commands.Choice(name="Infinite HP Avatar On", value="wudi global avatar on"),
        app_commands.Choice(name="Infinite HP Avatar Off", value="wudi global avatar off"),
        app_commands.Choice(name="Infinite HP Monster On", value="wudi global monster on"),
        app_commands.Choice(name="Infinite HP Monster Off", value="wudi global monster off"),
        app_commands.Choice(name="Unlock All Talents & Constellations", value="talent unlock all"),
        app_commands.Choice(name="Unlock All Teleports", value="point 3 all"),
        app_commands.Choice(name="Unlock Multiplayer (quest accept 30904)", value="quest accept 30904"),
        app_commands.Choice(name="Unlock Wish (quest accept 35801)", value="quest accept 35801"),
        app_commands.Choice(name="Unlock Fly (quest accept 35603)", value="quest accept 35603"),
        app_commands.Choice(name="Add All Items & Characters Lv1", value="item add all"),
    ])
    async def general(self, interaction: Interaction, uid: str, command: str):
        """Send a general GM command to the specified UID."""
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="equip_add", description="Add a weapon to the player")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        item_id="Weapon ID (searchable)",
        level="Weapon level (default: 90)",
        promote_level="Promote level (default: 6)"
    )
    @app_commands.autocomplete(item_id=item_autocomplete)
    async def equip_add(self, interaction: Interaction, uid: str, item_id: int, level: int = 90, promote_level: int = 6):
        """Send equip add command."""
        command = f"equip add {item_id} {level} {promote_level}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="item_add", description="Add an item to the player")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        item_id="Item ID (searchable)",
        count="Amount to add"
    )
    @app_commands.autocomplete(item_id=item_autocomplete)
    async def item_add(self, interaction: Interaction, uid: str, item_id: int, count: int):
        """Send item add command."""
        command = f"item add {item_id} {count}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="item_clear", description="Remove an item from the player")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        item_id="Item ID (searchable)",
        count="Amount to remove"
    )
    @app_commands.autocomplete(item_id=item_autocomplete)
    async def item_clear(self, interaction: Interaction, uid: str, item_id: int, count: int):
        """Send item clear command."""
        command = f"item clear {item_id} {count}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="avatar_add", description="Add a character to the player")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        avatar_id="Character ID (searchable)"
    )
    @app_commands.autocomplete(avatar_id=item_autocomplete)
    async def avatar_add(self, interaction: Interaction, uid: str, avatar_id: int):
        """Send avatar add command."""
        command = f"avatar add {avatar_id}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="quest", description="Manage quests for the player")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        action="Quest action",
        quest_id="Quest ID (searchable)"
    )
    @app_commands.choices(action=[
        app_commands.Choice(name="Add", value="add"),
        app_commands.Choice(name="Accept", value="accept"),
        app_commands.Choice(name="Finish", value="finish"),
    ])
    @app_commands.autocomplete(quest_id=item_autocomplete)
    async def quest(self, interaction: Interaction, uid: str, action: str, quest_id: int):
        """Send quest command."""
        command = f"quest {action} {quest_id}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="player_level", description="Set the player's adventure rank")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        level="Adventure Rank (1-60)"
    )
    async def player_level(self, interaction: Interaction, uid: str, level: int):
        """Send player level command."""
        command = f"player level {level}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="jump", description="Teleport to a scene")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        scene_id="Scene ID (searchable)"
    )
    @app_commands.autocomplete(scene_id=item_autocomplete)
    async def jump(self, interaction: Interaction, uid: str, scene_id: int):
        """Send jump command."""
        command = f"jump {scene_id}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="goto", description="Teleport to specific coordinates")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        x="X coordinate",
        y="Y coordinate",
        z="Z coordinate"
    )
    async def goto_cmd(self, interaction: Interaction, uid: str, x: float, y: float, z: float):
        """Send goto command."""
        command = f"goto {x} {y} {z}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="dungeon", description="Enter a dungeon")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        dungeon_id="Dungeon ID (searchable)"
    )
    @app_commands.autocomplete(dungeon_id=item_autocomplete)
    async def dungeon(self, interaction: Interaction, uid: str, dungeon_id: int):
        """Send dungeon command."""
        command = f"dungeon {dungeon_id}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="monster", description="Spawn monsters")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        monster_id="Monster ID (searchable)",
        count="Number to spawn (default: 5)",
        level="Monster level (default: 20)"
    )
    @app_commands.autocomplete(monster_id=item_autocomplete)
    async def monster(self, interaction: Interaction, uid: str, monster_id: int, count: int = 5, level: int = 20):
        """Send monster spawn command."""
        command = f"monster {monster_id} {count} {level}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="mcoin", description="Add Genesis Crystals")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        amount="Amount to add"
    )
    async def mcoin(self, interaction: Interaction, uid: str, amount: int):
        """Send mcoin command (Genesis Crystals)."""
        command = f"mcoin {amount}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="scoin", description="Add Mora (or similar currency)")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        amount="Amount to add"
    )
    async def scoin(self, interaction: Interaction, uid: str, amount: int):
        """Send scoin command."""
        command = f"scoin {amount}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="hcoin", description="Add Primogems (or similar currency)")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        amount="Amount to add"
    )
    async def hcoin(self, interaction: Interaction, uid: str, amount: int):
        """Send hcoin command."""
        command = f"hcoin {amount}"
        await GMActions.execute_gm_command(interaction, uid, command)

    @gm.command(name="home_coin", description="Add Realm Currency")
    @is_whitelist
    @app_commands.describe(
        uid="UID of the player",
        amount="Amount to add"
    )
    async def home_coin(self, interaction: Interaction, uid: str, amount: int):
        """Send home_coin command."""
        command = f"home_coin {amount}"
        await GMActions.execute_gm_command(interaction, uid, command)

async def setup(bot: commands.Bot):
    await bot.add_cog(GM(bot))
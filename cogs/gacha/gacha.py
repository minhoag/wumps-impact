# cogs/gacha.py
from discord import app_commands, Interaction
from discord.ext import commands

from cogs.gacha.gacha_view import GachaView
from cogs.gacha.gacha_embed import GachaEmbed
from cogs.check import permission_check

class Gacha(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    group = app_commands.Group(name="gacha", description="Gacha command")

    @group.command(name="create", description="Create new gacha")
    async def create(self, interaction: Interaction):
        await interaction.response.defer(ephemeral=True)
        passed = await permission_check(interaction)
        if not passed:
            await interaction.followup.send("Bạn không có quyền sử dụng lệnh này.", ephemeral=True)
            return

        view = GachaView()
        embed_instance = GachaEmbed(
            id=view.base_id,
            gacha_type=view.gacha_type,
            id1=view.id1,
            id2=view.id2,
            start=view.start,
            end=view.end,
            enabled=view.enabled
        )
        embed = embed_instance.build_embed()
        files = []
        if hasattr(embed_instance, 'author_icon_file') and embed_instance.author_icon_file:
            files.append(embed_instance.author_icon_file)
        if hasattr(embed_instance, 'thumbnail_file') and embed_instance.thumbnail_file:
            files.append(embed_instance.thumbnail_file)

        await interaction.followup.send(
            embed=embed,
            view=view,
            ephemeral=True,
            files=files
        )
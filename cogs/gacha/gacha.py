# cogs/gacha.py
from discord import app_commands, Interaction
from discord.ext import commands

from cogs.gacha.gacha_view import GachaView
from cogs.gacha.gacha_embed import GachaEmbed
from cogs.permission import permission

class Gacha(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    group = app_commands.Group(name="gacha", description="Gacha command")

    @group.command(name="create", description="Create new gacha")
    async def create(self, interaction: Interaction):
        if not permission(interaction, self.bot):
            await interaction.response.send_message("Bạn không có quyền sử dụng bot", ephemeral=True)
            return
        await interaction.response.defer(ephemeral=True)
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
# cogs/gacha.py
from discord import app_commands, Interaction
from discord.ext import commands
from .gacha_view import GachaView
from .gacha_embed import GachaEmbed

class Gacha(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    group = app_commands.Group(name="gacha", description="Gacha command")

    @group.command(name="create", description="Create new gacha")
    @app_commands.checks.has_permissions(administrator=True)
    async def create(self, interaction: Interaction):
        view = GachaView()
        embed = GachaEmbed(
            id=view.base_id,
            gacha_type=view.gacha_type,
            id1=view.id1,
            id2=view.id2,
            start=view.start,
            end=view.end,
            enabled=view.enabled
        ).build_embed()

        await interaction.response.send_message(
            embed=embed,
            view=view,
            ephemeral=True
        )
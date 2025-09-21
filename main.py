import os
from dotenv import load_dotenv

load_dotenv()

import discord
from utils.logger import logger
from discord import app_commands, Interaction
from discord.ext import commands
from cogs.gacha.gacha import Gacha
from cogs.mail.mail import Mail
from cogs.check import check_allow_guild

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

async def on_error(interaction: Interaction, error: app_commands.AppCommandError):
    if isinstance(error, app_commands.CheckFailure):
        await interaction.response.send_message(
            "This command is not available in this server.",
            ephemeral=True
        )
        return
    if isinstance(error, app_commands.MissingPermissions):
        await interaction.response.send_message(
            "Administrator permission required.",
            ephemeral=True
        )
        return
    raise error


class DiscordBot(commands.Bot):
    def __init__(self) -> None:
        super().__init__(
            command_prefix="!",
            intents=intents
        )

    async def setup_hook(self) -> None:
        cogs = [Gacha, Mail]
        for cog in cogs:
            await self.add_cog(cog(self))
        logger.info(f"Logged in as {self.user.name}")

    async def on_ready(self) -> None:
        self.tree.on_error = on_error
        await self.tree.sync(guild=None)
        logger.info(f"Bot is ready! Logged in as {self.user.name} in {len(self.guilds)} guild(s)")

bot = DiscordBot()
bot.run(os.getenv("TOKEN"))
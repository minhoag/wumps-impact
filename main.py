import os
from dotenv import load_dotenv

load_dotenv()

import discord
from utils.logger import logger
from discord.ext import commands, tasks
from discord.ext.commands import Context
from cogs.gacha.gacha import Gacha
from cogs.mail.mail import Mail

intents = discord.Intents.default()
intents.message_content = True

class DiscordBot(commands.Bot):
    def __init__(self) -> None:
        super().__init__(
            command_prefix="!",
            intents=intents,
        )

    async def setup_hook(self) -> None:
        logger.info(f"Logged in as {self.user.name}")

    async def on_ready(self) -> None:
        cogs = [Gacha, Mail]
        for cog in cogs:
            await self.add_cog(cog(self))
        guild_id = os.getenv("GUILD_ID")
        await self.tree.sync(guild=discord.Object(id=guild_id))
        await self.tree.sync(guild=None)
        logger.info(f"Bot is ready! Logged in as {self.user.name} in guild {self.guilds[0].name}")


bot = DiscordBot()
bot.run(os.getenv("TOKEN"))
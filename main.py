import os
from dotenv import load_dotenv

load_dotenv()

import discord
from utils.logger import logger
from discord import app_commands
from discord.ext import commands
from cogs.gacha.gacha import Gacha
from cogs.mail.mail import Mail
from cogs.gm.gm import GM
from cogs.sys.sys import SYS
from utils.db import get_whitelist_server, get_whitelist_user

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

class DiscordBot(commands.Bot):
    def __init__(self) -> None:
        super().__init__(
            command_prefix="!",
            intents=intents
        )
        self.whitelisted_guilds: list[str] = []
        self.whitelisted_users: list[str] = []

    async def sync_commands(self) -> None:
        await self.tree.sync(guild=None)
    
    async def sync_whitelist(self) -> None:
        self.whitelisted_guilds = get_whitelist_server()
        self.whitelisted_users = get_whitelist_user()

    async def setup_hook(self) -> None:
        cogs = [Gacha, Mail, GM, SYS]
        for cog in cogs:
            await self.add_cog(cog(self))
        await self.sync_commands()
        await self.sync_whitelist()
        logger.info(f"Logged in as {self.user.name}")
    
    async def on_command_error(self, ctx: commands.Context, error: commands.CommandError) -> None:
        if isinstance(error, commands.CheckFailure):
            await ctx.send(str(error), ephemeral=True)
        else:
            await ctx.send(f"An error occurred: {error}", ephemeral=True)

    async def on_ready(self) -> None:
        logger.info(f"Bot is ready! Logged in as {self.user.name} in {len(self.guilds)} guild(s)")

bot = DiscordBot()

@bot.tree.error
async def on_tree_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    raise error

bot.run(os.getenv("TOKEN"))
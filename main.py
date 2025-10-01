import os
from dotenv import load_dotenv

load_dotenv()

import discord
from utils.logger import logger
from discord import app_commands, Interaction
from discord.ext import commands
from cogs.gacha.gacha import Gacha
from cogs.mail.mail import Mail
from cogs.gm.gm import GM

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

class DiscordBot(commands.Bot):
    def __init__(self) -> None:
        super().__init__(
            command_prefix="!",
            intents=intents
        )
    
    async def sync_commands(self) -> None:
        await self.tree.sync(guild=None)

    async def setup_hook(self) -> None:
        cogs = [Gacha, Mail, GM]
        for cog in cogs:
            await self.add_cog(cog(self))
        await self.sync_commands()
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
    if isinstance(error, app_commands.CheckFailure):
        await interaction.response.send_message("Server của bạn không được phép sử dụng lệnh này.", ephemeral=True)
    else:
        raise error
bot.run(os.getenv("TOKEN"))
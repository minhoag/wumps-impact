import os
from dotenv import load_dotenv

load_dotenv()

import discord
from utils.logger import logger
from discord import app_commands, Interaction
from discord.ext import commands
from cogs.gacha.gacha import Gacha
from cogs.mail.mail import Mail

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

async def on_error(interaction: Interaction, error: app_commands.AppCommandError):
    if isinstance(error, app_commands.CheckFailure):
        error_message = str(error)
    else:
        logger.error(f"Unhandled app command error: {error}")
    await interaction.response.send_message(error_message, ephemeral=True)


class DiscordBot(commands.Bot):
    def __init__(self) -> None:
        super().__init__(
            command_prefix="!",
            intents=intents
        )
    
    async def sync_commands(self) -> None:
        await self.tree.sync(guild=None)

    async def setup_hook(self) -> None:
        cogs = [Gacha, Mail]
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
        self.tree.on_error = on_error
        logger.info(f"Bot is ready! Logged in as {self.user.name} in {len(self.guilds)} guild(s)")

bot = DiscordBot()
bot.run(os.getenv("TOKEN"))
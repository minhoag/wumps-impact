from typing import List, Dict
import discord
from discord.ext import commands
import os
import polars as pl

def is_allowed_guild(func):
    async def wrapper(interaction: discord.Interaction):
        if interaction.guild and interaction.guild.id in interaction.client.allow_list:
            return await func(interaction)
        raise discord.app_commands.CheckFailure("This command is not available in this server.")
    return wrapper

class Utils:
    @staticmethod
    def search_items(query: str, file):
        df = pl.read_csv(file)
        df = df.filter(pl.col('vietnameseName').str.contains(query) | pl.col('globalName').str.contains(query))
        return df.to_dicts()

    @staticmethod
    def get_image_file(filename: str) -> discord.File:
        """Get a discord.File object for an image file in data/img/ directory."""
        img_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'img')
        file_path = os.path.join(img_dir, filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Image file not found: {file_path}")
        return discord.File(fp=file_path, filename=filename)
    
    @staticmethod
    def get_video_file(file: str, filename: str) -> discord.File:
        return discord.File(fp=os.path.join(os.path.dirname(__file__), file), filename=filename)

    @staticmethod
    def filter_by_field(data: List[Dict], field: str, value: any) -> List[Dict]:
        return [item for item in data if item.get(field) == value]

    @staticmethod
    def sort_by_field(data: List[Dict], field: str, reverse: bool = False) -> List[Dict]:
        return sorted(data, key=lambda x: x.get(field, ''), reverse=reverse)

    @staticmethod
    def is_weapon(item_id: int) -> bool:
        """Check if item is a weapon by ID length. 5-digit IDs are weapons, 4-digit IDs are characters."""
        return len(str(item_id)) == 5
    
    @staticmethod
    def is_character(item_id: int) -> bool:
        """Check if item is a character by ID length. 4-digit IDs are characters, 5-digit IDs are weapons."""
        return len(str(item_id)) == 4

    @staticmethod
    async def log_system_event(bot: commands.Bot, log_channel_id: int, title: str, description: str, color: discord.Color):
        """Send a system event log to the configured log channel."""
        if log_channel_id:
            channel = bot.get_channel(log_channel_id)
            if channel:
                embed = discord.Embed(
                    title=title,
                    description=description,
                    color=color,
                    timestamp=discord.utils.utcnow()
                )
                await channel.send(embed=embed)

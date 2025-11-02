from typing import List, Dict, Iterable, Tuple, Optional
import discord
from discord.ext import commands
import os
import re
from utils.constants import ITEMS
import unicodedata

def is_allowed_guild(func):
    async def wrapper(interaction: discord.Interaction):
        if interaction.guild and interaction.guild.id in interaction.client.allow_list:
            return await func(interaction)
        raise discord.app_commands.CheckFailure("This command is not available in this server.")
    return wrapper

class Utils:
    @staticmethod
    def search_items(query: str, data, search_fields: List[str] = None, max_results: int = 25) -> List[Dict]:
        if not query or not query.strip() or not data:
            return []
        items_list: Iterable[Dict] = data.values() if isinstance(data, dict) else data

        def _norm(s: str) -> str:
            normalized = unicodedata.normalize('NFKC', s).lower().strip()
            return ''.join(ch for ch in unicodedata.normalize('NFD', normalized) if not unicodedata.combining(ch))

        normalized_query = _norm(query)
        if not normalized_query:
            return []

        query_terms = tuple(term for term in (_norm(part) for part in query.split()) if term)
        if not query_terms:
            return []

        if not search_fields:
            search_fields = ['vietnameseName', 'globalName']
        else:
            search_fields = list(search_fields)

        def score_field(value: str, field_index: int) -> Optional[Tuple[int, int, int, int, int]]:
            norm_value = _norm(value)
            if not norm_value:
                return None

            matching_terms = [term for term in query_terms if term in norm_value]
            if not matching_terms:
                return None

            missing_terms = len(query_terms) - len(matching_terms)
            if norm_value == normalized_query:
                match_type = 0
            elif norm_value.startswith(normalized_query):
                match_type = 1
            elif normalized_query in norm_value:
                match_type = 2
            else:
                match_type = 3

            first_pos = min(norm_value.find(term) for term in matching_terms)
            return (missing_terms, match_type, first_pos, len(norm_value), field_index)

        scored_items: List[Tuple[Tuple[int, int, int, int, int], Dict]] = []

        for item in items_list:
            if not isinstance(item, dict):
                continue

            best_score = None
            for idx, field_name in enumerate(search_fields):
                field_value = item.get(field_name)
                if not field_value:
                    continue

                score = score_field(str(field_value), idx)
                if score is None:
                    continue

                if best_score is None or score < best_score:
                    best_score = score

            if best_score is not None:
                scored_items.append((best_score, item))

        scored_items.sort(key=lambda entry: entry[0])
        return [item for _, item in scored_items[:max_results]]

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
    def get_item_name(item) -> str:
        """Get item name from item data. Item can be a dict or an ID (int)."""
        for item_dict in ITEMS:
            if item_dict.get('value') == str(item):
                item = item_dict
                break
        vietnamese_name = item.get('vietnameseName', item.get('name', 'Không khả dụng'))
        name = item.get('name', 'Không khả dụng')
        vietnamese_name = re.sub(r': \d+$', '', vietnamese_name)
        name = re.sub(r': \d+$', '', name)

        return f"{vietnamese_name} ({name})"

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

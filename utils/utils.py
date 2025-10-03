from typing import List, Dict
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
        items_list = list(data.values()) if isinstance(data, dict) else data

        def _norm(s: str) -> str:
            s = unicodedata.normalize('NFKC', s).lower().strip()
            return ''.join(ch for ch in unicodedata.normalize('NFD', s) if not unicodedata.combining(ch))

        search_terms = [_norm(term) for term in query.strip().split() if term.strip()]
        if not search_terms:
            return []
        if not search_fields:
            search_fields = ['vietnameseName', 'globalName', 'value']
        if items_list and 'name' in items_list[0] and 'name' not in search_fields:
            search_fields = list(search_fields) + ['name']

        matches_with_scores = []
        terms_len = len(search_terms)

        for item in items_list:
            best_field_score = float('inf')
            matched_terms = 0
            item_score = 0

            norm_fields = {}
            for f in search_fields:
                v = item.get(f, '')
                if v:
                    norm_fields[f] = _norm(str(v))
            if not norm_fields:
                continue

            for f, field_value in norm_fields.items():
                field_score = 0
                terms_found_in_field = 0
                words = None

                for term in search_terms:
                    if field_value == term:
                        field_score += 0
                        terms_found_in_field += 1
                        item_score += 10
                    elif field_value.startswith(term):
                        field_score += 1
                        terms_found_in_field += 1
                        item_score += 5
                    elif term in field_value:
                        field_score += 2
                        terms_found_in_field += 1
                        item_score += 2
                    else:
                        if words is None:
                            words = field_value.split()
                        found = False
                        for w in words:
                            if term in w:
                                field_score += 3
                                terms_found_in_field += 1
                                item_score += 1
                                found = True
                                break
                        if not found:
                            continue

                if terms_found_in_field:
                    avg_field_score = field_score / terms_found_in_field
                    if avg_field_score < best_field_score:
                        best_field_score = avg_field_score
                    matched_terms += terms_found_in_field

            if best_field_score < float('inf'):
                coverage_bonus = (matched_terms / terms_len) * 5
                name_length = len(str(item.get('vietnameseName', '') + item.get('globalName', '')))
                length_penalty = min(name_length / 50, 3)
                final_score = best_field_score + coverage_bonus + length_penalty + item_score
                matches_with_scores.append((item, final_score))

        matches_with_scores.sort(key=lambda x: x[1])
        return [item for item, _ in matches_with_scores[:max_results]]

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
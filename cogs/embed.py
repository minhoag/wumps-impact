import discord
from typing import List, Dict, Any
from utils.utils import Utils

COLORS = {
    "primary": 0x3498db,
    "success": 0x2ecc71,
    "danger": 0xe74c3c,
    "warning": 0xf1c40f,
    "info": 0x3498db,
}

class Embed:
    def __init__(
        self,
        title: str = None,
        description: str = None,
        color: int = COLORS["primary"],
        thumbnail_url: str = None,
        author_name: str = None,
        author_icon_url: str = None,
        author_icon_file: discord.File = None,
        footer_text: str = "Wumps Private Server",
        thumbnail_file: discord.File = None,
    ):
        # Always use paimon as footer icon
        footer_icon_file = Utils.get_image_file("paimon.png")

        self.embed = discord.Embed(
            title=title,
            description=description,
            color=color
        )
        if author_name:
            author_icon_url_final = author_icon_url
            if author_icon_file:
                author_icon_url_final = f"attachment://{author_icon_file.filename}"

            self.embed.set_author(
                name=author_name,
                icon_url=author_icon_url_final
            )
        if thumbnail_url:
            self.embed.set_thumbnail(url=thumbnail_url)
        elif thumbnail_file:
            self.embed.set_thumbnail(url=f"attachment://{thumbnail_file.filename}")

        self.embed.set_footer(
            text=footer_text,
            icon_url=f"attachment://{footer_icon_file.filename}"
        )

        # Store files for external access
        self.author_icon_file = author_icon_file
        self.thumbnail_file = thumbnail_file
        self.footer_icon_file = footer_icon_file
    
    def set_author(self, name: str, icon_url: str = None, icon_file: discord.File = None):
        """Set the author with URL or file"""
        icon_url_final = icon_url
        if icon_file:
            icon_url_final = f"attachment://{icon_file.filename}"
            self.author_icon_file = icon_file

        self.embed.set_author(name=name, icon_url=icon_url_final)

    def set_thumbnail(self, thumb_file: discord.File):
        """Set the thumbnail"""
        self.embed.set_thumbnail(url=f"attachment://{thumb_file.filename}")
        self.thumbnail_file = thumb_file
    
    def add_field(self, name: str, value: str, inline: bool = True):
        """Add a field to the embed"""
        self.embed.add_field(name=name, value=value, inline=inline)
    
    def add_fields(self, fields: List[Dict[str, Any]]):
        """Add multiple fields at once."""
        for field in fields:
            self.embed.add_field(
                name=field.get('name', 'Field'),
                value=field.get('value', 'Value'),
                inline=field.get('inline', True)
            )
    
    def set_image(self, url: str) -> 'Embed':
        """Set the main image and return self for chaining."""
        self.embed.set_image(url=url)
        return self
    
    def build_embed(self) -> discord.Embed:
        """Return the discord.Embed object."""
        return self.embed
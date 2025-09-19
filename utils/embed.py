import discord
from typing import List, Dict, Any

class Embed:
    def __init__(
        self, 
        title: str = None, 
        description: str = None, 
        color: int = 0x3498db,
        thumbnail_url: str = None,
        author_name: str = None,
        author_icon_url: str = None,
        footer_text: str = "Wumps Bot",
        footer_icon_url: str = None,
    ):
        self.embed = discord.Embed(
            title=title,
            description=description,
            color=color
        )
        if author_name:
            self.embed.set_author(
                name=author_name,
                icon_url=author_icon_url
            )
        if thumbnail_url:
            self.embed.set_thumbnail(url=thumbnail_url)
            
        self.embed.set_footer(
            text=footer_text,
            icon_url=footer_icon_url
        )
    
    def set_thumbnail(self, url: str):
        """Set the thumbnail"""
        self.embed.set_thumbnail(url=url)
    
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
    
    def set_author_from_user(self, user: discord.User) -> 'Embed':
        """Set author information from a Discord user."""
        self.embed.set_author(
            name=user.display_name,
            icon_url=user.display_avatar.url
        )
        return self
    
    def build_embed(self) -> discord.Embed:
        """Return the discord.Embed object."""
        return self.embed
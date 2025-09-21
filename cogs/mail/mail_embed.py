from typing import List, Dict, Union
from cogs.embed import Embed, COLORS
from utils.utils import Utils
from utils.logger import logger

class MailEmbed(Embed):
    """Enhanced embed for displaying mail information with recipient and attachment details."""
    def __init__(self, mail_data: Union[Dict, None] = None, **kwargs):
        # Extract data from mail_data if provided, otherwise use kwargs
        if mail_data:
            title = mail_data.get('title', 'Không có tiêu đề')
            content = mail_data.get('content', 'Không có nội dung')
            send_to = mail_data.get('send_to', 'Không xác định')
            attachments = mail_data.get('attachments', [])
            sender = mail_data.get('sender', 'Admin')
        else:
            title = kwargs.get('title', 'Không có tiêu đề')
            content = kwargs.get('content', 'Không có nội dung')
            send_to = kwargs.get('send_to', 'Không xác định')
            attachments = kwargs.get('attachments', [])
            sender = kwargs.get('sender', 'Admin')

        recipient_display = self._format_recipients(send_to)
        mail_icon = Utils.get_image_file("mail.png")

        super().__init__(
            title=f"Tiêu đề: {title}",
            description=self._format_content(content),
            color=COLORS["primary"],
            thumbnail_file=mail_icon
        )
        self.add_field(
            name="Người gửi",
            value=sender,
            inline=True
        )
        self.add_field(
            name="Người nhận",
            value=recipient_display,
            inline=True
        )
        
        attachment_display = self._format_attachments(attachments)
        self.add_field(
            name="Vật phẩm được gửi đi: ",
            value=attachment_display,
            inline=False
        )
    
    def _format_content(self, content: str) -> str:
        """Format mail content for better display."""
        if not content or not content.strip():
            return "*Không có nội dung*"
        if len(content) > 1000:
            return content[:997] + "..."
        return content
    
    def _format_recipients(self, send_to: str) -> tuple[str, str]:
        if not send_to or not send_to.strip():
            return "Không xác định", ""
        send_to_clean = send_to.strip().lower()
        if send_to_clean == "all":
            return "Tất cả người chơi", "Tất cả người chơi"
        recipients = [r.strip() for r in send_to.split(',') if r.strip()]
    
    def _format_attachments(self, attachments: List[Dict]) -> str:
        """Format attachment list for comprehensive display, grouped by item type."""
        if not attachments or len(attachments) == 0:
            return "Không có vật phẩm đính kèm"
        item_groups = {}
        total_items = 0
        
        for attachment in attachments:
            item = attachment.get('item', {})
            quantity = attachment.get('quantity', 1)
            item_id = item.get('value', 'unknown')
            item_name = item.get('name', 'Unknown Item')
            item_rarity = item.get('rarity', '')
            
            if item_id in item_groups:
                item_groups[item_id]['total_quantity'] += quantity
            else:
                item_groups[item_id] = {
                    'name': item_name,
                    'rarity': item_rarity,
                    'total_quantity': quantity,
                    'item': item
                }
            
            total_items += quantity
        
        attachment_lines = []
        display_limit = 15
        
        for i, (item_id, group_data) in enumerate(list(item_groups.items())[:display_limit]):
            item_name = group_data['name']
            total_quantity = group_data['total_quantity']
            item_rarity = group_data['rarity']
            
            if len(item_name) > 35:
                item_name = item_name[:32] + "..."
            
            attachment_lines.append(f"{i}. **{item_name}** x{total_quantity}")
        
        # Show remaining items if over limit
        if len(item_groups) > display_limit:
            remaining = len(item_groups) - display_limit
            attachment_lines.append(f"... và **{remaining}** loại item khác")
        
        # Add total summary
        attachment_lines.append("")
        attachment_lines.append(f"**Tổng cộng:** {len(item_groups)} loại item, {total_items} vật phẩm")
        
        return "\n".join(attachment_lines)
    
    def set_mail_status(self, status: str, message: str = ""):
        """Update embed with mail status information."""
        status_colors = {
            'draft': COLORS["primary"],
            'sending': 0xffaa00,  # Orange
            'sent': 0x00ff00,     # Green
            'failed': 0xff0000    # Red
        }
        
        status_messages = {
            'draft': "Thư nháp",
            'sending': "Đang gửi thư...",
            'sent': "Thư đã được gửi thành công!",
            'failed': f"Gửi thư thất bại: {message}"
        }
        
        self.embed.color = status_colors.get(status, COLORS["primary"])
        self.embed.set_footer(text=status_messages.get(status, message))
    
    def update_mail_data(self, mail_data: Dict):
        """Update embed with new mail data."""
        self.embed.clear_fields()
        title = mail_data.get('title', 'Không có tiêu đề')
        content = mail_data.get('content', 'Không có nội dung')
        send_to = mail_data.get('send_to', 'Không xác định')
        attachments = mail_data.get('attachments', [])

        self.embed.title = f"Tiêu đề thư: {title}"
        self.embed.description = self._format_content(content)
        self.embed.add_field(
            name="Người gửi",
            value="Admin",
            inline=True
        )
        
        recipient_display = self._format_recipients(send_to)
        self.embed.add_field(
            name="Người nhận",
            value=recipient_display,
            inline=True
        )
        
        attachment_display = self._format_attachments(attachments)
        self.embed.add_field(
            name="Vật phẩm đính kèm",
            value=attachment_display,
            inline=False
        )
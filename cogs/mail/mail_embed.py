from typing import List, Dict, Union
from cogs.embed import Embed, COLORS
from utils.utils import Utils
from utils.constants import SENDER
from datetime import datetime
from cogs.mail.mail_action import MailActions

class MailEmbed(Embed):
    """Enhanced embed for displaying mail information with recipient and attachment details."""
    def __init__(self, mail_data: Union[Dict, None] = None, **kwargs):
        # Extract data from mail_data if provided, otherwise use kwargs
        if mail_data:
            title = mail_data.get('title', 'Không có tiêu đề')
            content = mail_data.get('content', 'Không có nội dung')
            send_to = mail_data.get('send_to', 'Không xác định')
            attachments = mail_data.get('attachments', [])
        else:
            title = kwargs.get('title', 'Không có tiêu đề')
            content = kwargs.get('content', 'Không có nội dung')
            send_to = kwargs.get('send_to', 'Không xác định')
            attachments = kwargs.get('attachments', [])

        recipient_display = MailActions.format_recipients_display(send_to, for_embed=True)
        mail_icon = Utils.get_image_file("mail.png")

        super().__init__(
            title="Soạn thư",
            description="Nội dung thư khi gửi đi sẽ có thông tin như sau:",
            thumbnail_file=mail_icon
        )
        
        self.add_field(
            name="Tiêu đề thư",
            value=title,
            inline=False
        )

        self.add_field(
            name="Nội dung",
            value=self._format_content(content),
            inline=False
        )

        self.add_field(
            name="Người gửi",
            value=SENDER,
            inline=True
        )
        self.add_field(
            name="Người nhận",
            value=recipient_display[0],
            inline=True
        )
        self.add_field(
            name="Thời hạn nhận thư",
            value="30 ngày",
            inline=True
        )
        
        attachment_display = self._format_attachments(attachments)
        self.add_field(
            name="Vật phẩm đính kèm",
            value=attachment_display,
            inline=True
        )
        self.add_field(
            name="Thời gian gửi",
            value=datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            inline=True
        )
    
    def _format_content(self, content: str) -> str:
        """Format mail content for better display."""
        if not content or not content.strip():
            return "*Không có nội dung*"
        if len(content) > 1000:
            return content[:997] + "..."
        return content

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
            item_name = item.get('globalName', None) or item.get('vietnameseName', None) or 'Unknown Item'
            
            if item_id in item_groups:
                item_groups[item_id]['total_quantity'] += quantity
            else:
                item_groups[item_id] = {
                    'name': item_name,
                    'total_quantity': quantity,
                    'item': item
                }
            
            total_items += quantity
        
        attachment_lines = []
        display_limit = 15
        
        for i, (item_id, group_data) in enumerate(list(item_groups.items())[:display_limit]):
            item_name = group_data['name']
            total_quantity = group_data['total_quantity']
            
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
            'sending': COLORS["warning"],  # Orange
            'sent': COLORS["success"],     # Green
            'failed': COLORS["danger"]    # Red
        }
        
        status_messages = {
            'draft': "Thư nháp",
            'sending': "Đang gửi thư...",
            'sent': "Thư đã được gửi thành công!",
            'failed': f"Gửi thư thất bại: {message}"
        }
        
        self.embed.color = status_colors.get(status, COLORS["primary"])
        self.embed.footer.text = status_messages.get(status, message)
    
    def update_mail_data(self, mail_data: Dict):
        """Update embed with new mail data."""
        self.embed.clear_fields()
        title = mail_data.get('title', 'Không có tiêu đề')
        content = mail_data.get('content', 'Không có nội dung')
        send_to = mail_data.get('send_to', 'Không xác định')
        attachments = mail_data.get('attachments', [])

        self.embed.title = "Chỉnh sửa thư"
        self.embed.description = "Nội dung thư khi gửi đi sẽ có thông tin như sau:"

        self.embed.set_thumbnail(url=Utils.get_image_file("mail.png"))

        self.embed.add_field(
            name=f"Tiêu đề thư",
            value=title,
            inline=False
        )
        self.embed.add_field(
            name="Nội dung",
            value=self._format_content(content),
            inline=False
        )

        self.embed.add_field(
            name="Người gửi",
            value=SENDER,
            inline=True
        )
        recipient_display = MailActions.format_recipients_display(send_to, for_embed=True)
        self.embed.add_field(
            name="Người nhận",
            value=recipient_display[0],
            inline=True
        )
        self.embed.add_field(
            name="Thời hạn nhận thư",
            value="30 ngày",
            inline=True
        )
        attachment_display = self._format_attachments(attachments)
        self.embed.add_field(
                name="Vật phẩm đính kèm",
            value=attachment_display,
            inline=True
        )
        self.embed.add_field(
            name="Thời gian gửi",
            value=datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            inline=True
        )
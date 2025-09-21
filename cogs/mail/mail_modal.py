import discord
from typing import Callable, Any, Dict


class MailModal(discord.ui.Modal, title="Create Mail"):
    """Modal for creating a new mail with recipient, title, and content information."""

    def __init__(self, on_submit_cb: Callable[[discord.Interaction, Dict[str, str]], Any] = None,
                 initial_send_to: str = "", initial_title: str = "", initial_content: str = ""):
        super().__init__()

        # Set initial values or defaults
        self.send_to = discord.ui.TextInput(
            label="Gửi đến",
            placeholder="10002 hoặc 10002, 10003, 10004 hoặc all",
            default=initial_send_to or "",
            required=True,
            max_length=500
        )

        self.mail_title = discord.ui.TextInput(
            label="Tiêu đề thư: ",
            default=initial_title or "You received a mail",
            required=True,
            max_length=255
        )

        self.content = discord.ui.TextInput(
            label="Nội dung",
            default=initial_content or "Thank you for supporting WumPS.",
            style=discord.TextStyle.paragraph,
            required=True,
            max_length=2000
        )

        self._on_submit_cb = on_submit_cb

        # Add the text inputs to the modal
        self.add_item(self.send_to)
        self.add_item(self.mail_title)
        self.add_item(self.content)

    def _validate_input_data(self, send_to: str, title: str, content: str) -> tuple[bool, str]:
        """Validate modal input data."""
        if not send_to.strip():
            return False, "Trường 'Gửi đến' không được để trống"
        
        if not title.strip():
            return False, "Trường 'Tiêu đề' không được để trống"
            
        if not content.strip():
            return False, "Trường 'Nội dung' không được để trống"
        
        # Validate UID format
        send_to_clean = send_to.strip().lower()
        if send_to_clean == "all":
            return True, ""
        
        # Check if UID is valid
        recipient_parts = [part.strip() for part in send_to.split(",")]
        for part in recipient_parts:
            if not part.isdigit():
                return False, "Định dạng người nhận không hợp lệ. Sử dụng: 10002 hoặc 10002, 10003 hoặc all"
        
        return True, ""

    async def on_submit(self, interaction: discord.Interaction):
        """Handle modal submission with proper field extraction and validation."""
        send_to = self.send_to.value.strip()
        title = self.mail_title.value.strip()
        content = self.content.value.strip()

        is_valid, error_message = self._validate_input_data(send_to, title, content)

        if not is_valid:
            await interaction.response.send_message(
                f"Lỗi thư: {error_message}",
                ephemeral=True
            )
            return

        mail_data = {
            'send_to': send_to,
            'title': title,
            'content': content,
            'attachments': []
        }

        if self._on_submit_cb:
            await self._on_submit_cb(interaction, mail_data)
        else:
            await interaction.response.send_message(
                "Mail modal submitted but no handler configured.",
                ephemeral=True
            )

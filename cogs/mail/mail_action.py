import re
import asyncio
from typing import List, Dict, Tuple, Union
from utils.db import create_log_record, create_email_log_record, get_all_uid
from utils.utils import Utils
from utils.constants import ITEMS, MAIL_ITEM_LIMITS
from utils.muip import MUIP, GMResponse


class MailBatch:
    """Result structure for batch mail operations"""
    def __init__(self, uid_results: List[Tuple[str, GMResponse]]):
        self.uid_results = uid_results
        self.success_count = sum(1 for _, response in uid_results if response.success)
        self.total_count = len(uid_results)
        self.success_uids = [uid for uid, response in uid_results if response.success]
        self.failed_uids = [uid for uid, response in uid_results if not response.success]

    @property
    def is_success(self) -> bool:
        return self.success_count == self.total_count

    @property
    def is_partial_success(self) -> bool:
        return self.success_count > 0 and self.success_count < self.total_count

    @property
    def is_fail(self) -> bool:
        return self.success_count == 0

class MailActions:
    """Core business logic for mail system operations"""
    @staticmethod
    def parse_recipients(send_to: str) -> Tuple[bool, List[str], str]:
        if not send_to or not send_to.strip():
            return False, [], "Vui lòng nhập người nhận"
        send_to = send_to.strip().lower()
        if send_to == "all":
            return True, ["all"], ""
        recipient_parts = [part.strip() for part in send_to.split(",")]
        recipient_list = []
        
        for part in recipient_parts:
            if not part:
                continue
            if not re.match(r'^\d+$', part):
                return False, [], f"ID người dùng không hợp lệ: {part}. Chỉ chấp nhận số."
            recipient_list.append(part)
        if not recipient_list:
            return False, [], "Không tìm thấy ID người dùng hợp lệ"
        return True, recipient_list, ""
    
    @staticmethod
    def search_items(query: str) -> List[Dict]:
        return Utils.search_items(query, ITEMS, ['vietnameseName', 'globalName'], max_results=25)
    
    @staticmethod
    def split_item_by_limit(item: Dict, quantity: int) -> List[Dict]:
        item_id = int(item.get('value', 0))
        max_per_attachment = MAIL_ITEM_LIMITS.get(item_id)
        if max_per_attachment is None:
            return [{
                'item': item,
                'quantity': quantity
            }]
        
        attachments = []
        remaining_quantity = quantity
        
        while remaining_quantity > 0:
            current_quantity = min(remaining_quantity, max_per_attachment)
            attachments.append({
                'item': item,
                'quantity': current_quantity
            })
            remaining_quantity -= current_quantity
        
        return attachments
    
    @staticmethod
    def get_item_limit_info(item: Dict) -> Tuple[bool, int]:
        item_id = int(item.get('value', 0))
        max_quantity = MAIL_ITEM_LIMITS.get(item_id)
        return max_quantity is not None, max_quantity or 0

    @staticmethod
    def format_recipients_display(send_to: str, for_embed: bool = True) -> Union[str, Tuple[str, str]]:
        """
        Format recipients for display.
        """
        if not send_to or not send_to.strip():
            if for_embed:
                return "Không xác định", ""
            else:
                return "Không xác định"

        send_to_clean = send_to.strip().lower()
        if send_to_clean == "all":
            display_text = "Tất cả người chơi"
            return (display_text, "") if for_embed else display_text

        # Handle specific recipients
        recipients = [r.strip() for r in send_to.split(',') if r.strip()]
        if len(recipients) == 1:
            display_text = f"{recipients[0]}"
        elif len(recipients) <= 5:
            display_text = f"{', '.join(recipients)}"
        else:
            display_text = f"{len(recipients)} người dùng cụ thể"

        return (display_text, "") if for_embed else display_text
    
    @staticmethod
    def format_item_list(attachments: List[Dict]) -> str:
        if not attachments:
            return ""
        
        item_parts = []
        for attachment in attachments:
            item = attachment.get('item', {})
            quantity = attachment.get('quantity', 1)
            item_id = item.get('value', '0')
            
            item_parts.append(f"{item_id}:{quantity}")
        
        return ",".join(item_parts)
    
    @staticmethod
    def validate(mail_data: Dict) -> Tuple[bool, str]:
        if not mail_data or not isinstance(mail_data, dict):
            return False, "Dữ liệu mail không hợp lệ"
        required_fields = {
            'send_to': 'Người nhận',
            'title': 'Tiêu đề', 
            'content': 'Nội dung'
        }
        for field, field_name in required_fields.items():
            if field not in mail_data:
                return False, f"Thiếu trường bắt buộc: {field_name}"
            
            value = mail_data.get(field)
            if not value or not str(value).strip():
                return False, f"{field_name} không được để trống"
        
        is_valid, _, error_msg = MailActions.parse_recipients(mail_data['send_to'])
        if not is_valid:
            return False, f"Định dạng người nhận không hợp lệ: {error_msg}"
        
        attachments = mail_data.get('attachments', [])
        if attachments:
            if not isinstance(attachments, list):
                return False, "Danh sách vật phẩm đính kèm phải là một mảng"
            if len(attachments) > 20:
                return False, "Không thể đính kèm quá 50 loại vật phẩm"
            total_items = 0
            for i, attachment in enumerate(attachments):
                if not isinstance(attachment, dict):
                    return False, f"Vật phẩm thứ {i+1} có định dạng không hợp lệ"
                if 'item' not in attachment:
                    return False, f"Vật phẩm thứ {i+1} thiếu thông tin item"
                if 'quantity' not in attachment:
                    return False, f"Vật phẩm thứ {i+1} thiếu thông tin số lượng"
                item = attachment.get('item')
                if not isinstance(item, dict):
                    return False, f"Thông tin item thứ {i+1} không hợp lệ"
                
                if not item.get('globalName') and not item.get('vietnameseName'):
                    return False, f"Vật phẩm thứ {i+1} thiếu tên"
                try:
                    quantity = int(attachment['quantity'])
                    if quantity <= 0:
                        return False, f"Số lượng vật phẩm thứ {i+1} phải lớn hơn 0"
                    if quantity > 999999:
                        return False, f"Số lượng vật phẩm thứ {i+1} không được vượt quá 999,999"
                    total_items += quantity
                except (ValueError, TypeError):
                    return False, f"Số lượng vật phẩm thứ {i+1} phải là số nguyên hợp lệ"

            if total_items > 9999999:
                return False, "Tổng số lượng vật phẩm không được vượt quá 9,999,999"
        
        send_to = mail_data['send_to'].strip().lower()
        if send_to != 'all':
            recipients = [r.strip() for r in mail_data['send_to'].split(',') if r.strip()]
            if len(recipients) > 1000:
                return False, "Không thể gửi mail cho quá 1000 người dùng cùng lúc"
            for recipient in recipients:
                if not re.match(r'^\d{5,10}$', recipient):
                    return False, f"ID người dùng '{recipient}' không hợp lệ (phải là số từ 5-10 chữ số)"
        return True, "Validation passed"
    
    @staticmethod
    async def validate_recipients(send_to: str) -> Tuple[bool, List[str], int, str]:
        is_valid, parsed_recipients, error_msg = MailActions.parse_recipients(send_to)
        if not is_valid:
            return False, [], 0, error_msg
        if parsed_recipients == ["all"]:
            all_users = get_all_uid()
            if not all_users:
                return False, [], 0, "Không tìm thấy người dùng nào trong cơ sở dữ liệu"
            return True, all_users, len(all_users), ""
        return True, parsed_recipients, len(parsed_recipients), ""

    @staticmethod
    async def send(mail_data: Dict, sender_discord_id: str) -> Tuple[bool, str]:
        success, recipient_list, count, error_msg = await MailActions.validate_recipients(mail_data['send_to'])
        if not success:
            return False, f"Recipient validation error: {error_msg}"
        if count == 0:
            return False, "No valid recipients found"

        attachments = mail_data.get('attachments', [])
        item_list = MailActions.format_item_list(attachments)
        title = mail_data['title'].strip()
        content = mail_data['content'].strip()
        expiry_days = 30
        recipient_count = len(recipient_list)
        log_message = f"{sender_discord_id}|{recipient_count}|{title}|SENT_TO[{recipient_count}]"
        log_id = create_log_record("MAIL", log_message)

        tasks = [
            MUIP.send_mail(uid, title, content, item_list, expiry_days)
            for uid in recipient_list
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        uid_results = []
        for i, response in enumerate(responses):
            uid = recipient_list[i]
            if isinstance(response, Exception):
                gm_response = MUIP.GMResponse(False, -1, f"Request failed: {str(response)}")
            else:
                gm_response = response
            uid_results.append((uid, gm_response))

        batch_result = MailBatch(uid_results)
        success_count = batch_result.success_count
        failed_uids = batch_result.failed_uids
                
        if success_count == count:
            success_parts = [f"Mail successfully sent to {count} recipient(s)"]
            log_msg = f"SUCCESS|SENT_TO[{recipient_count}]"
            create_email_log_record(
                log_id=log_id,
                subject=title,
                body=content,
                sender=sender_discord_id,
                recipient= f"SEND_TO[{recipient_count}]",
                delivery_status="SENT",
                message=log_msg
            )
            return True, " ".join(success_parts)
        elif success_count > 0:
            failed_count = len(failed_uids)
            log_msg = f"WARN|SENT_TO[{recipient_count}]"
            create_email_log_record(
                log_id=log_id,
                subject=title,
                body=content,
                sender=sender_discord_id,
                recipient= f"SEND_TO[{recipient_count}]",
                delivery_status="WARN",
                message=log_msg
            )
            return True, f"Partially successful: {success_count}/{count} mails sent. {failed_count} failed: {', '.join(failed_uids[:5])}{'...' if failed_count > 5 else ''}"
        else:
            log_msg = f"FAILED|SENT_TO[{recipient_count}]"
            create_email_log_record(
                log_id=log_id,
                subject=title,
                body=content,
                sender=sender_discord_id,
                recipient= f"SEND_TO[{recipient_count}]",
                delivery_status="FAILED",
                message=log_msg
            )
            return False, f"Failed to send mail to all {count} recipients. Check server connection and user IDs."

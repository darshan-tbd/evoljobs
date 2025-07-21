from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

def send_user_notification(user_id, message):
    """
    Send real-time notification to a specific user via WebSocket
    
    Args:
        user_id: ID of the user to send notification to
        message: Dictionary containing notification data
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            logger.error("Channel layer not configured")
            return False
            
        group_name = f"user_{user_id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification",
                "message": message
            }
        )
        logger.info(f"Sent notification to user {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending notification to user {user_id}: {str(e)}")
        return False

def send_notification_to_group(group_name, message):
    """
    Send notification to a specific group
    
    Args:
        group_name: Name of the group (e.g., 'admin_notifications')
        message: Dictionary containing notification data
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            logger.error("Channel layer not configured")
            return False
            
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification",
                "message": message
            }
        )
        logger.info(f"Sent notification to group {group_name}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending notification to group {group_name}: {str(e)}")
        return False 
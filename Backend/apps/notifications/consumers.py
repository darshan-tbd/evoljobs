import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import NotificationChannel, Notification

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]
        
        # Check if user is authenticated
        if not self.user.is_authenticated:
            await self.close(code=4001)  # Unauthorized
            return
        
        # Create user group name
        self.user_group_name = f"user_{self.user.id}"
        
        # Join user group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        
        # Store channel in database
        await self.store_channel()
        
        # Send initial data
        await self.send_initial_data()
        
        logger.info(f"NotificationConsumer connected for user {self.user.email}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user_group_name'):
            # Leave user group
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            
            # Mark channel as inactive
            await self.mark_channel_inactive()
            
            logger.info(f"NotificationConsumer disconnected for user {self.user.email}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_notification_read':
                await self.mark_notification_read(data.get('notification_id'))
            elif message_type == 'mark_all_read':
                await self.mark_all_notifications_read()
            elif message_type == 'dismiss_notification':
                await self.dismiss_notification(data.get('notification_id'))
            elif message_type == 'get_unread_count':
                await self.send_unread_count()
            elif message_type == 'heartbeat':
                await self.handle_heartbeat()
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            await self.send_error("Error processing message")
    
    async def send_notification(self, event):
        """Send notification to WebSocket"""
        try:
            notification_data = event['notification']
            
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'data': notification_data
            }))
            
            # Mark notification as sent
            await self.mark_notification_sent(notification_data['id'])
            
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
    
    async def send_unread_count_update(self, event):
        """Send unread count update"""
        await self.send(text_data=json.dumps({
            'type': 'unread_count_update',
            'count': event['count']
        }))
    
    async def send_bulk_update(self, event):
        """Send bulk notification update"""
        await self.send(text_data=json.dumps({
            'type': 'bulk_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def store_channel(self):
        """Store channel information in database"""
        try:
            # Get client info
            headers = dict(self.scope.get('headers', []))
            user_agent = headers.get(b'user-agent', b'').decode()
            
            # Try to get IP address
            ip_address = None
            forwarded_for = headers.get(b'x-forwarded-for')
            if forwarded_for:
                ip_address = forwarded_for.decode().split(',')[0].strip()
            elif headers.get(b'x-real-ip'):
                ip_address = headers.get(b'x-real-ip').decode()
            
            # Create or update channel
            channel, created = NotificationChannel.objects.update_or_create(
                user=self.user,
                channel_name=self.channel_name,
                defaults={
                    'is_active': True,
                    'user_agent': user_agent,
                    'ip_address': ip_address,
                    'last_seen': timezone.now()
                }
            )
            
            return channel
            
        except Exception as e:
            logger.error(f"Error storing channel: {str(e)}")
            return None
    
    @database_sync_to_async
    def mark_channel_inactive(self):
        """Mark channel as inactive"""
        try:
            NotificationChannel.objects.filter(
                user=self.user,
                channel_name=self.channel_name
            ).update(is_active=False)
        except Exception as e:
            logger.error(f"Error marking channel inactive: {str(e)}")
    
    @database_sync_to_async
    def get_unread_notifications(self):
        """Get unread notifications for user"""
        try:
            notifications = Notification.objects.filter(
                user=self.user,
                is_read=False,
                is_dismissed=False
            ).exclude(
                expires_at__lt=timezone.now()
            ).order_by('-created_at')[:20]
            
            return [{
                'id': str(n.id),
                'title': n.title,
                'message': n.message,
                'notification_type': n.notification_type,
                'priority': n.priority,
                'created_at': n.created_at.isoformat(),
                'action_url': n.action_url,
                'action_label': n.action_label,
                'is_actionable': n.is_actionable,
                'metadata': n.metadata
            } for n in notifications]
            
        except Exception as e:
            logger.error(f"Error getting unread notifications: {str(e)}")
            return []
    
    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notification count"""
        try:
            return Notification.objects.filter(
                user=self.user,
                is_read=False,
                is_dismissed=False
            ).exclude(
                expires_at__lt=timezone.now()
            ).count()
        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}")
            return 0
    
    async def send_initial_data(self):
        """Send initial data to client"""
        try:
            # Send unread notifications
            unread_notifications = await self.get_unread_notifications()
            unread_count = await self.get_unread_count()
            
            await self.send(text_data=json.dumps({
                'type': 'initial_data',
                'notifications': unread_notifications,
                'unread_count': unread_count
            }))
            
        except Exception as e:
            logger.error(f"Error sending initial data: {str(e)}")
    
    async def send_unread_count(self):
        """Send current unread count"""
        try:
            count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': count
            }))
        except Exception as e:
            logger.error(f"Error sending unread count: {str(e)}")
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark specific notification as read"""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=self.user
            )
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            logger.warning(f"Notification {notification_id} not found for user {self.user.email}")
            return False
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            return False
    
    @database_sync_to_async
    def mark_all_notifications_read(self):
        """Mark all notifications as read"""
        try:
            updated = Notification.objects.filter(
                user=self.user,
                is_read=False
            ).update(
                is_read=True,
                read_at=timezone.now()
            )
            return updated
        except Exception as e:
            logger.error(f"Error marking all notifications as read: {str(e)}")
            return 0
    
    @database_sync_to_async
    def dismiss_notification(self, notification_id):
        """Dismiss specific notification"""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=self.user
            )
            notification.dismiss()
            return True
        except Notification.DoesNotExist:
            logger.warning(f"Notification {notification_id} not found for user {self.user.email}")
            return False
        except Exception as e:
            logger.error(f"Error dismissing notification: {str(e)}")
            return False
    
    @database_sync_to_async
    def mark_notification_sent(self, notification_id):
        """Mark notification as sent via WebSocket"""
        try:
            notification = Notification.objects.get(id=notification_id)
            notification.is_sent = True
            notification.sent_at = timezone.now()
            notification.save(update_fields=['is_sent', 'sent_at'])
        except Exception as e:
            logger.error(f"Error marking notification as sent: {str(e)}")
    
    async def handle_heartbeat(self):
        """Handle heartbeat message"""
        await self.update_last_seen()
        await self.send(text_data=json.dumps({
            'type': 'heartbeat_ack'
        }))
    
    @database_sync_to_async
    def update_last_seen(self):
        """Update last seen timestamp"""
        try:
            NotificationChannel.objects.filter(
                user=self.user,
                channel_name=self.channel_name
            ).update(last_seen=timezone.now())
        except Exception as e:
            logger.error(f"Error updating last seen: {str(e)}")
    
    async def send_error(self, message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))

class AdminNotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for admin notifications
    """
    
    async def connect(self):
        """Handle WebSocket connection for admin"""
        self.user = self.scope["user"]
        
        # Check if user is authenticated and is staff
        if not self.user.is_authenticated or not self.user.is_staff:
            await self.close(code=4001)  # Unauthorized
            return
        
        # Join admin group
        await self.channel_layer.group_add(
            "admin_notifications",
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"AdminNotificationConsumer connected for admin {self.user.email}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            "admin_notifications",
            self.channel_name
        )
        logger.info(f"AdminNotificationConsumer disconnected for admin {self.user.email}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'get_stats':
                await self.send_notification_stats()
            elif message_type == 'broadcast_announcement':
                await self.broadcast_announcement(data)
            else:
                logger.warning(f"Unknown admin message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received from admin")
            await self.send_error("Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling admin message: {str(e)}")
            await self.send_error("Error processing message")
    
    async def send_admin_notification(self, event):
        """Send admin notification"""
        await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def get_notification_stats(self):
        """Get notification statistics"""
        try:
            from django.db.models import Count, Q
            from datetime import timedelta
            
            now = timezone.now()
            last_24h = now - timedelta(hours=24)
            
            stats = {
                'total_notifications': Notification.objects.count(),
                'unread_notifications': Notification.objects.filter(is_read=False).count(),
                'notifications_24h': Notification.objects.filter(created_at__gte=last_24h).count(),
                'active_channels': NotificationChannel.objects.filter(is_active=True).count(),
                'notification_types': list(
                    Notification.objects.values('notification_type')
                    .annotate(count=Count('notification_type'))
                    .order_by('-count')
                )
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting notification stats: {str(e)}")
            return {}
    
    async def send_notification_stats(self):
        """Send notification statistics to admin"""
        try:
            stats = await self.get_notification_stats()
            await self.send(text_data=json.dumps({
                'type': 'notification_stats',
                'data': stats
            }))
        except Exception as e:
            logger.error(f"Error sending notification stats: {str(e)}")
    
    async def broadcast_announcement(self, data):
        """Broadcast announcement to all users"""
        try:
            # This would typically create notifications for all users
            # For now, just acknowledge the request
            await self.send(text_data=json.dumps({
                'type': 'broadcast_success',
                'message': 'Announcement scheduled for broadcast'
            }))
        except Exception as e:
            logger.error(f"Error broadcasting announcement: {str(e)}")
    
    async def send_error(self, message):
        """Send error message to admin"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        })) 
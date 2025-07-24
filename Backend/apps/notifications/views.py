from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, NotificationPreference, NotificationTemplate, NotificationChannel, NotificationDelivery
from .serializers import NotificationSerializer, NotificationPreferenceSerializer, NotificationTemplateSerializer, NotificationChannelSerializer, NotificationDeliverySerializer
from .serializers import AdminNotificationSerializer, AdminNotificationPreferenceSerializer, AdminNotificationTemplateSerializer, AdminNotificationChannelSerializer, AdminNotificationDeliverySerializer
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

class NotificationTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

class NotificationChannelViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationChannelSerializer
    permission_classes = [permissions.IsAuthenticated]

class NotificationDeliveryViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationDeliverySerializer
    permission_classes = [permissions.IsAuthenticated]

class AdminNotificationViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all notifications
    """
    serializer_class = AdminNotificationSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Notification.objects.all()
    
    def get_queryset(self):
        queryset = Notification.objects.all().select_related('user')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(message__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )
        
        # Filter by notification type
        notification_type = self.request.query_params.get('notification_type', None)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter by priority
        priority = self.request.query_params.get('priority', None)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read', None)
        if is_read is not None:
            if is_read.lower() == 'true':
                queryset = queryset.filter(is_read=True)
            elif is_read.lower() == 'false':
                queryset = queryset.filter(is_read=False)
        
        # Filter by sent status
        is_sent = self.request.query_params.get('is_sent', None)
        if is_sent is not None:
            if is_sent.lower() == 'true':
                queryset = queryset.filter(is_sent=True)
            elif is_sent.lower() == 'false':
                queryset = queryset.filter(is_sent=False)
        
        # Filter by user
        user = self.request.query_params.get('user', None)
        if user:
            queryset = queryset.filter(user_id=user)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def mark_unread(self, request, pk=None):
        """Mark notification as unread"""
        notification = self.get_object()
        notification.mark_as_unread()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def dismiss(self, request, pk=None):
        """Dismiss notification"""
        notification = self.get_object()
        notification.dismiss()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        user_id = request.data.get('user_id')
        if user_id:
            Notification.objects.filter(user_id=user_id, is_read=False).update(
                is_read=True, read_at=timezone.now()
            )
        else:
            Notification.objects.filter(is_read=False).update(
                is_read=True, read_at=timezone.now()
            )
        
        return Response({'message': 'All notifications marked as read'})
    
    @action(detail=False, methods=['post'])
    def dismiss_all(self, request):
        """Dismiss all notifications"""
        user_id = request.data.get('user_id')
        if user_id:
            Notification.objects.filter(user_id=user_id, is_dismissed=False).update(
                is_dismissed=True, dismissed_at=timezone.now()
            )
        else:
            Notification.objects.filter(is_dismissed=False).update(
                is_dismissed=True, dismissed_at=timezone.now()
            )
        
        return Response({'message': 'All notifications dismissed'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get notification statistics"""
        total_notifications = Notification.objects.count()
        unread_notifications = Notification.objects.filter(is_read=False).count()
        sent_notifications = Notification.objects.filter(is_sent=True).count()
        dismissed_notifications = Notification.objects.filter(is_dismissed=True).count()
        
        # Notification types
        notification_types = Notification.objects.values('notification_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Priority levels
        priority_levels = Notification.objects.values('priority').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Recent activity
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        new_notifications_today = Notification.objects.filter(created_at__date=today).count()
        new_notifications_this_week = Notification.objects.filter(created_at__date__gte=week_ago).count()
        new_notifications_this_month = Notification.objects.filter(created_at__date__gte=month_ago).count()
        
        return Response({
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'sent_notifications': sent_notifications,
            'dismissed_notifications': dismissed_notifications,
            'notification_types': notification_types,
            'priority_levels': priority_levels,
            'recent_activity': {
                'new_notifications_today': new_notifications_today,
                'new_notifications_this_week': new_notifications_this_week,
                'new_notifications_this_month': new_notifications_this_month,
            }
        })
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent notification activity"""
        limit = int(request.query_params.get('limit', 10))
        
        recent_notifications = Notification.objects.order_by('-created_at')[:limit]
        
        return Response({
            'recent_notifications': AdminNotificationSerializer(recent_notifications, many=True).data,
        })

class AdminNotificationPreferenceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for notification preferences
    """
    serializer_class = AdminNotificationPreferenceSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = NotificationPreference.objects.all()
    
    def get_queryset(self):
        queryset = NotificationPreference.objects.all().select_related('user')
        
        # Filter by user
        user = self.request.query_params.get('user', None)
        if user:
            queryset = queryset.filter(user_id=user)
        
        return queryset.order_by('-created_at')

class AdminNotificationTemplateViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing notification templates
    """
    serializer_class = AdminNotificationTemplateSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = NotificationTemplate.objects.all()
    
    def get_queryset(self):
        queryset = NotificationTemplate.objects.all()
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(title_template__icontains=search) |
                Q(message_template__icontains=search)
            )
        
        # Filter by notification type
        notification_type = self.request.query_params.get('notification_type', None)
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset.order_by('name')

class AdminNotificationChannelViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing notification channels
    """
    serializer_class = AdminNotificationChannelSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = NotificationChannel.objects.all()
    
    def get_queryset(self):
        queryset = NotificationChannel.objects.all()
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filter by channel type
        channel_type = self.request.query_params.get('channel_type', None)
        if channel_type:
            queryset = queryset.filter(channel_type=channel_type)
        
        return queryset.order_by('name')

class AdminNotificationDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for notification delivery tracking
    """
    serializer_class = AdminNotificationDeliverySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = NotificationDelivery.objects.all()
    
    def get_queryset(self):
        queryset = NotificationDelivery.objects.all().select_related('notification', 'channel')
        
        # Filter by notification
        notification = self.request.query_params.get('notification', None)
        if notification:
            queryset = queryset.filter(notification_id=notification)
        
        # Filter by channel
        channel = self.request.query_params.get('channel', None)
        if channel:
            queryset = queryset.filter(channel_id=channel)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at') 
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .services import notification_service

User = get_user_model()

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing user notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get notifications for the current user"""
        return Notification.objects.filter(
            user=self.request.user,
            is_dismissed=False
        ).exclude(
            expires_at__lt=timezone.now()
        ).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """
        Get unread notifications
        GET /api/v1/notifications/unread/
        """
        notifications = self.get_queryset().filter(is_read=False)
        page = self.paginate_queryset(notifications)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(notifications, many=True)
        return Response({
            'results': serializer.data,
            'count': notifications.count()
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get unread notification count
        GET /api/v1/notifications/unread_count/
        """
        count = notification_service.get_unread_count(request.user)
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark specific notification as read
        POST /api/v1/notifications/{id}/mark_read/
        """
        try:
            notification = self.get_object()
            notification.mark_as_read()
            
            # Get updated count
            unread_count = notification_service.get_unread_count(request.user)
            
            return Response({
                'success': True,
                'message': 'Notification marked as read',
                'unread_count': unread_count
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """
        Mark specific notification as unread
        POST /api/v1/notifications/{id}/mark_unread/
        """
        try:
            notification = self.get_object()
            notification.mark_as_unread()
            
            # Get updated count
            unread_count = notification_service.get_unread_count(request.user)
            
            return Response({
                'success': True,
                'message': 'Notification marked as unread',
                'unread_count': unread_count
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """
        Dismiss specific notification
        POST /api/v1/notifications/{id}/dismiss/
        """
        try:
            notification = self.get_object()
            notification.dismiss()
            
            # Get updated count
            unread_count = notification_service.get_unread_count(request.user)
            
            return Response({
                'success': True,
                'message': 'Notification dismissed',
                'unread_count': unread_count
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all notifications as read
        POST /api/v1/notifications/mark_all_read/
        """
        try:
            updated = notification_service.mark_all_as_read(request.user)
            
            return Response({
                'success': True,
                'message': f'Marked {updated} notifications as read',
                'unread_count': 0
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def dismiss_all(self, request):
        """
        Dismiss all notifications
        POST /api/v1/notifications/dismiss_all/
        """
        try:
            updated = self.get_queryset().filter(
                is_dismissed=False
            ).update(
                is_dismissed=True,
                dismissed_at=timezone.now()
            )
            
            return Response({
                'success': True,
                'message': f'Dismissed {updated} notifications',
                'unread_count': 0
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """
        Get notifications by type
        GET /api/v1/notifications/by_type/?type=job_alert
        """
        notification_type = request.query_params.get('type')
        if not notification_type:
            return Response({
                'error': 'type parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        notifications = self.get_queryset().filter(
            notification_type=notification_type
        )
        
        page = self.paginate_queryset(notifications)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(notifications, many=True)
        return Response({
            'results': serializer.data,
            'count': notifications.count()
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get notification summary/statistics
        GET /api/v1/notifications/summary/
        """
        from django.db.models import Count
        
        # Get counts by type
        type_counts = self.get_queryset().values('notification_type').annotate(
            count=Count('notification_type')
        ).order_by('-count')
        
        # Get counts by status
        total_count = self.get_queryset().count()
        unread_count = self.get_queryset().filter(is_read=False).count()
        read_count = total_count - unread_count
        
        # Get recent notifications
        recent_notifications = self.get_queryset()[:5]
        recent_serializer = self.get_serializer(recent_notifications, many=True)
        
        return Response({
            'total_count': total_count,
            'unread_count': unread_count,
            'read_count': read_count,
            'type_counts': list(type_counts),
            'recent_notifications': recent_serializer.data
        })

class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notification preferences
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Get or create preferences for current user"""
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user,
            defaults={}
        )
        return preferences
    
    def list(self, request):
        """Get current user's preferences"""
        preferences = self.get_object()
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update notification preferences"""
        preferences = self.get_object()
        serializer = self.get_serializer(
            preferences, 
            data=request.data, 
            partial=kwargs.get('partial', False)
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Preferences updated successfully',
                'data': serializer.data
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, *args, **kwargs):
        """Partially update notification preferences"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def reset_to_defaults(self, request):
        """
        Reset preferences to defaults
        POST /api/v1/notification-preferences/reset_to_defaults/
        """
        try:
            preferences = self.get_object()
            
            # Reset to default values
            for field in preferences._meta.fields:
                if hasattr(field, 'default') and field.name != 'user':
                    setattr(preferences, field.name, field.default)
            
            preferences.save()
            
            serializer = self.get_serializer(preferences)
            return Response({
                'success': True,
                'message': 'Preferences reset to defaults',
                'data': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def test_notification(self, request):
        """
        Send a test notification
        POST /api/v1/notification-preferences/test_notification/
        Body: {"type": "realtime|email|both"}
        """
        test_type = request.data.get('type', 'realtime')
        
        try:
            notification = notification_service.create_notification(
                user=request.user,
                notification_type='system',
                title='Test Notification',
                message='This is a test notification to verify your settings are working correctly.',
                priority='low',
                action_url='/notifications',
                action_label='View Notifications',
                delivery_method=test_type,
                expires_in_hours=1
            )
            
            return Response({
                'success': True,
                'message': f'Test notification sent via {test_type}',
                'notification_id': str(notification.id)
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST) 
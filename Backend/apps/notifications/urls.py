from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.NotificationViewSet, basename='notification')
router.register(r'preferences', views.NotificationPreferenceViewSet, basename='notification-preference')
router.register(r'templates', views.NotificationTemplateViewSet, basename='notification-template')
router.register(r'channels', views.NotificationChannelViewSet, basename='notification-channel')
router.register(r'delivery', views.NotificationDeliveryViewSet, basename='notification-delivery')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin-notifications', views.AdminNotificationViewSet, basename='adminnotification')
admin_router.register(r'admin-preferences', views.AdminNotificationPreferenceViewSet, basename='adminnotificationpreference')
admin_router.register(r'admin-templates', views.AdminNotificationTemplateViewSet, basename='adminnotificationtemplate')
admin_router.register(r'admin-channels', views.AdminNotificationChannelViewSet, basename='adminnotificationchannel')
admin_router.register(r'admin-delivery', views.AdminNotificationDeliveryViewSet, basename='adminnotificationdelivery')

app_name = 'notifications'

urlpatterns = [
    path('', include(router.urls)),
    path('', include(admin_router.urls)),
    
    # Real-time notification endpoints
    # GET /api/v1/notifications/ - List notifications
    # GET /api/v1/notifications/unread/ - Get unread notifications
    # GET /api/v1/notifications/unread_count/ - Get unread count
    # POST /api/v1/notifications/{id}/mark_read/ - Mark notification as read
    # POST /api/v1/notifications/{id}/mark_unread/ - Mark notification as unread
    # POST /api/v1/notifications/{id}/dismiss/ - Dismiss notification
    # POST /api/v1/notifications/mark_all_read/ - Mark all as read
    # POST /api/v1/notifications/dismiss_all/ - Dismiss all notifications
    # GET /api/v1/notifications/by_type/?type=job_alert - Filter by type
    # GET /api/v1/notifications/summary/ - Get notification summary
    
    # Notification preferences endpoints
    # GET /api/v1/notifications/preferences/ - Get preferences
    # PUT /api/v1/notifications/preferences/ - Update preferences
    # PATCH /api/v1/notifications/preferences/ - Partial update preferences
    # POST /api/v1/notifications/preferences/reset_to_defaults/ - Reset preferences
    # POST /api/v1/notifications/preferences/test_notification/ - Send test notification
] 
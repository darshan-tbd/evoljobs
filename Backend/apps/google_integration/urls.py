"""
URL patterns for Google Integration API in JobPilot (EvolJobs.com)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GoogleOAuthView, GoogleIntegrationViewSet, EmailActivityViewSet,
    AutoApplySessionViewSet, DashboardStatsView,
    AdminGoogleIntegrationViewSet, AdminEmailActivityViewSet,
    AdminAutoApplySessionViewSet, AdminGoogleStatsView,
    GoogleOAuthRegistrationView
)

app_name = 'google_integration'

# Create router for viewsets
router = DefaultRouter()
router.register(r'integration', GoogleIntegrationViewSet, basename='integration')
router.register(r'emails', EmailActivityViewSet, basename='emails')
router.register(r'sessions', AutoApplySessionViewSet, basename='sessions')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin/integrations', AdminGoogleIntegrationViewSet, basename='admin-integrations')
admin_router.register(r'admin/emails', AdminEmailActivityViewSet, basename='admin-emails')
admin_router.register(r'admin/sessions', AdminAutoApplySessionViewSet, basename='admin-sessions')

urlpatterns = [
    # OAuth flow endpoints
    path('oauth/authorize/', GoogleOAuthView.as_view(), name='oauth_authorize'),
    path('oauth/authorize/registration/', GoogleOAuthRegistrationView.as_view(), name='oauth_authorize_registration'),
    path('oauth/callback/', GoogleOAuthView.as_view(), name='oauth_callback'),
    
    # Dashboard statistics
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    
    # Admin endpoints
    path('admin/stats/', AdminGoogleStatsView.as_view(), name='admin_stats'),
    
    # Include router URLs
    path('', include(router.urls)),
    path('', include(admin_router.urls)),
] 
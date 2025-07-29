"""
Authentication URL patterns for JobPilot (EvolJobs.com) Backend.
"""

from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('login/google/', views.GoogleAuthView.as_view(), name='google_auth'),
    path('logout/', views.UserLogoutView.as_view(), name='logout'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Debug endpoints
    path('debug/google-config/', views.debug_google_config, name='debug_google_config'),
    path('debug/google-auth-url/', views.get_google_auth_url, name='get_google_auth_url'),
    
    # Password management
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', views.PasswordResetView.as_view(), name='password_reset'),
    path('password-reset-confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Token management
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', views.verify_token, name='verify_token'),
    
    # Status check
    path('status/', views.auth_status, name='auth_status'),
] 
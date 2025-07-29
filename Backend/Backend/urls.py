"""
URL configuration for JobPilot (EvolJobs.com) Backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from apps.jobs.views import JobPostingViewSet
from django.utils import timezone

# Health check view
def health_check(request):
    from django.http import JsonResponse
    return JsonResponse({'status': 'healthy', 'timestamp': timezone.now()})

# Root API view
def api_root(request):
    from django.http import JsonResponse
    return JsonResponse({
        'message': 'JobPilot API is running',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'api_docs': '/api/docs/',
            'health': '/health/',
            'jobs': '/api/v1/jobs/',
            'auth': '/api/v1/auth/',
        }
    })

# URL patterns
urlpatterns = [
    # Root endpoint
    path('', api_root, name='api_root'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Authentication
    path('api/v1/auth/', include('apps.authentication.urls')),
    
    # Core APIs
    path('api/v1/core/', include('apps.core.urls')),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/companies/', include('apps.companies.urls')),
    path('api/v1/jobs/', include('apps.jobs.urls')),
    path('api/v1/applications/', include('apps.applications.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/subscriptions/', include('apps.subscriptions.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/scrapers/', include('apps.scrapers.urls')),
    path('api/v1/search/', include('apps.search.urls')),
    path('api/v1/ai/', include('apps.ai.urls')),
    path('api/v1/resumes/', include('apps.resumes.urls')),
    path('api/v1/google/', include('apps.google_integration.urls')),
    
    # Custom endpoint for job recommendations as requested
    # path('api/recommended-jobs/', JobPostingViewSet.as_view({'get': 'recommended'}), name='recommended-jobs'),
    
    # Health check
    path('health/', health_check, name='health_check'),
]

# Development settings
if settings.DEBUG:
    # Serve media files in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass 
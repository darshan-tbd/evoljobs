from django.urls import path
from . import views

urlpatterns = [
    # Scraper management endpoints
    path('stats/', views.scraper_stats, name='scraper_stats'),
    path('status/', views.scraper_status, name='scraper_status'),
    path('run/<str:scraper_id>/', views.run_scraper, name='run_scraper'),
    path('recent-jobs/', views.recent_scraped_jobs, name='recent_scraped_jobs'),
    path('logs/', views.scraper_logs, name='scraper_logs'),
    
    # Legacy endpoints (if needed)
    # path('', views.JobScraperViewSet.as_view({'get': 'list'}), name='scraper-list'),
    # path('<int:pk>/', views.JobScraperViewSet.as_view({'get': 'retrieve'}), name='scraper-detail'),
] 
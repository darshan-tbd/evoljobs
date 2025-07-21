from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'scrapers', views.JobScraperViewSet)
router.register(r'scraped-jobs', views.ScrapedJobViewSet)

app_name = 'scrapers'

urlpatterns = [
    path('', include(router.urls)),
] 
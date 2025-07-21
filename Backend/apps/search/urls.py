from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'queries', views.SearchQueryViewSet, basename='searchquery')

app_name = 'search'

urlpatterns = [
    path('', include(router.urls)),
    path('jobs/', views.search_jobs, name='search_jobs'),
] 
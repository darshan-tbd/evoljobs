from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'locations', views.LocationViewSet)
router.register(r'skills', views.SkillViewSet)
router.register(r'industries', views.IndustryViewSet)

app_name = 'core'

urlpatterns = [
    path('', include(router.urls)),
    path('health/', views.health_check, name='health_check'),
] 
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'jobs', views.JobPostingViewSet)
router.register(r'saved-jobs', views.SavedJobViewSet, basename='savedjob')
router.register(r'job-alerts', views.JobAlertViewSet, basename='jobalert')

app_name = 'jobs'

urlpatterns = [
    path('', include(router.urls)),
] 
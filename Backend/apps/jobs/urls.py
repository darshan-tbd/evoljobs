from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'jobs', views.JobPostingViewSet)
router.register(r'job-categories', views.JobCategoryViewSet, basename='jobcategory')
router.register(r'saved-jobs', views.SavedJobViewSet, basename='savedjob')
router.register(r'job-alerts', views.JobAlertViewSet, basename='jobalert')
router.register(r'job-views', views.JobViewViewSet, basename='jobview')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin-jobs', views.AdminJobPostingViewSet, basename='adminjob')
admin_router.register(r'admin-job-views', views.AdminJobViewViewSet, basename='adminjobview')
admin_router.register(r'admin-saved-jobs', views.AdminSavedJobViewSet, basename='adminsavedjob')
admin_router.register(r'admin-job-alerts', views.AdminJobAlertViewSet, basename='adminjobalert')

app_name = 'jobs'

urlpatterns = [
    path('', include(router.urls)),
    path('', include(admin_router.urls)),
] 
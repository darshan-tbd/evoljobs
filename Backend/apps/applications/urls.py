from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'applications', views.JobApplicationViewSet, basename='jobapplication')
router.register(r'interviews', views.InterviewViewSet, basename='interview')
router.register(r'documents', views.ApplicationDocumentViewSet, basename='applicationdocument')
router.register(r'status-history', views.ApplicationStatusHistoryViewSet, basename='applicationstatushistory')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin-applications', views.AdminJobApplicationViewSet, basename='adminjobapplication')
admin_router.register(r'admin-interviews', views.AdminInterviewViewSet, basename='admininterview')
admin_router.register(r'admin-documents', views.AdminApplicationDocumentViewSet, basename='adminapplicationdocument')
admin_router.register(r'admin-status-history', views.AdminApplicationStatusHistoryViewSet, basename='adminapplicationstatushistory')

# External application tracking
router.register(r'external-applications', views.ExternalApplicationViewSet, basename='externalapplications')

app_name = 'applications'

urlpatterns = [
    path('', include(router.urls)),
    path('', include(admin_router.urls)),
] 
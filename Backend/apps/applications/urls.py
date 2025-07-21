from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'applications', views.JobApplicationViewSet, basename='jobapplication')
router.register(r'interviews', views.InterviewViewSet, basename='interview')
router.register(r'documents', views.ApplicationDocumentViewSet, basename='applicationdocument')

app_name = 'applications'

urlpatterns = [
    path('', include(router.urls)),
] 
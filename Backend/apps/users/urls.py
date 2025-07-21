from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.UserProfileViewSet, basename='userprofile')
router.register(r'experiences', views.UserExperienceViewSet, basename='userexperience')
router.register(r'educations', views.UserEducationViewSet, basename='usereducation')

app_name = 'users'

urlpatterns = [
    path('', include(router.urls)),
] 
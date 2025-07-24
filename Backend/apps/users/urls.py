from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.UserProfileViewSet, basename='userprofile')
router.register(r'experiences', views.UserExperienceViewSet, basename='userexperience')
router.register(r'educations', views.UserEducationViewSet, basename='usereducation')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin-users', views.AdminUserViewSet, basename='adminuser')

app_name = 'users'

urlpatterns = [
    path('', include(router.urls)),
    path('', include(admin_router.urls)),
] 
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'companies', views.CompanyViewSet)
router.register(r'employees', views.CompanyEmployeeViewSet, basename='companyemployee')
router.register(r'reviews', views.CompanyReviewViewSet, basename='companyreview')

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin-companies', views.AdminCompanyViewSet, basename='admincompany')
admin_router.register(r'admin-employees', views.AdminCompanyEmployeeViewSet, basename='admincompanyemployee')
admin_router.register(r'admin-reviews', views.AdminCompanyReviewViewSet, basename='admincompanyreview')

app_name = 'companies'

urlpatterns = [
    path('', include(router.urls)),
    path('', include(admin_router.urls)),
] 
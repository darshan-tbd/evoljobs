from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'companies', views.CompanyViewSet)
router.register(r'employees', views.CompanyEmployeeViewSet, basename='companyemployee')
router.register(r'reviews', views.CompanyReviewViewSet, basename='companyreview')

app_name = 'companies'

urlpatterns = [
    path('', include(router.urls)),
] 
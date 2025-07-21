from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plans', views.SubscriptionPlanViewSet)
router.register(r'subscriptions', views.UserSubscriptionViewSet, basename='usersubscription')

app_name = 'subscriptions'

urlpatterns = [
    path('', include(router.urls)),
] 
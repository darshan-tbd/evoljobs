from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plans', views.SubscriptionPlanViewSet)
router.register(r'subscriptions', views.UserSubscriptionViewSet, basename='usersubscription')
router.register(r'limits', views.SubscriptionLimitViewSet, basename='subscriptionlimits')

# Admin routers
admin_router = DefaultRouter()
admin_router.register(r'admin-plans', views.AdminSubscriptionPlanViewSet, basename='adminsubscriptionplan')
admin_router.register(r'admin-subscriptions', views.AdminUserSubscriptionViewSet, basename='adminusersubscription')

app_name = 'subscriptions'

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', include(admin_router.urls)),
] 
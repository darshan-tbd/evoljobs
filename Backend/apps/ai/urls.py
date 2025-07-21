from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.AIViewSet, basename='ai')

app_name = 'ai'

urlpatterns = [
    path('', include(router.urls)),
    
    # AI Job Matching Endpoints
    # GET /api/v1/ai/recommended-jobs/ - Get recommended jobs for user
    # POST /api/v1/ai/calculate-match/ - Calculate match score for specific job
    # POST /api/v1/ai/bulk-calculate-matches/ - Calculate matches for multiple jobs
    # GET /api/v1/ai/match-history/ - Get user's match history
    # GET /api/v1/ai/profile-completeness/ - Check profile completeness
    # GET /api/v1/ai/matching-stats/ - Get user's matching statistics
] 
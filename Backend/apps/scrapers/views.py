from rest_framework import viewsets, permissions
from .models import JobScraper, ScrapedJob
from .serializers import JobScraperSerializer, ScrapedJobSerializer

class JobScraperViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = JobScraper.objects.filter(is_active=True)
    serializer_class = JobScraperSerializer
    permission_classes = [permissions.IsAdminUser]

class ScrapedJobViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ScrapedJob.objects.all()
    serializer_class = ScrapedJobSerializer
    permission_classes = [permissions.IsAdminUser] 
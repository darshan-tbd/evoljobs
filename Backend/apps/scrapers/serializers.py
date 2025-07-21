from rest_framework import serializers
from .models import JobScraper, ScrapedJob

class JobScraperSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobScraper
        fields = '__all__'

class ScrapedJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapedJob
        fields = '__all__' 
from django.contrib import admin
from .models import JobScraper, ScrapedJob

@admin.register(JobScraper)
class JobScraperAdmin(admin.ModelAdmin):
    list_display = ['name', 'url', 'is_active', 'last_run']
    list_filter = ['is_active']
    search_fields = ['name', 'url']

@admin.register(ScrapedJob)
class ScrapedJobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'scraper', 'is_processed', 'created_at']
    list_filter = ['scraper', 'is_processed']
    search_fields = ['title', 'company', 'location'] 
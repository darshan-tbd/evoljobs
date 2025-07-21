from django.db import models
from apps.core.models import BaseModel

class JobScraper(BaseModel):
    name = models.CharField(max_length=100)
    url = models.URLField()
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.name

class ScrapedJob(BaseModel):
    scraper = models.ForeignKey(JobScraper, on_delete=models.CASCADE)
    external_id = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    description = models.TextField()
    url = models.URLField()
    is_processed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.title} at {self.company}" 
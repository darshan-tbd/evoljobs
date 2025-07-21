from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import BaseModel

User = get_user_model()

class SearchQuery(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    query = models.CharField(max_length=255)
    filters = models.JSONField(default=dict)
    results_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.query} - {self.results_count} results" 
"""
Google Integration app configuration for JobPilot (EvolJobs.com)
"""

from django.apps import AppConfig


class GoogleIntegrationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.google_integration'
    verbose_name = 'Google Integration'

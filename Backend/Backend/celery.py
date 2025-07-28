"""
Celery configuration for JobPilot (EvolJobs.com) Backend project.

This module defines the Celery instance and configuration for background task processing.
"""

import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')

# Create the Celery application instance
app = Celery('Backend')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Optional configuration for specific task routes
app.conf.update(
    task_routes={
        'apps.scrapers.tasks.scrape_job_board': {'queue': 'scraping'},
        'apps.notifications.tasks.send_email_notification': {'queue': 'notifications'},
        'apps.ai.tasks.generate_job_recommendations': {'queue': 'ai'},
        'apps.jobs.tasks.update_job_status': {'queue': 'jobs'},
        'apps.google_integration.tasks.execute_auto_apply_session': {'queue': 'google_integration'},
        'apps.google_integration.tasks.trigger_auto_apply_for_user': {'queue': 'google_integration'},
        'apps.google_integration.tasks.check_email_responses_for_integration': {'queue': 'google_integration'},
        'apps.google_integration.tasks.check_all_email_responses': {'queue': 'google_integration'},
    },
    task_annotations={
        'apps.scrapers.tasks.scrape_job_board': {'rate_limit': '10/m'},
        'apps.notifications.tasks.send_email_notification': {'rate_limit': '100/m'},
        'apps.ai.tasks.generate_job_recommendations': {'rate_limit': '50/m'},
        'apps.google_integration.tasks.execute_auto_apply_session': {'rate_limit': '5/m'},
        'apps.google_integration.tasks.check_email_responses_for_integration': {'rate_limit': '30/m'},
    },
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_soft_time_limit=300,  # 5 minutes
    task_time_limit=600,       # 10 minutes
    result_expires=3600,       # 1 hour
    beat_schedule={
        'scrape-job-boards': {
            'task': 'apps.scrapers.tasks.scrape_all_job_boards',
            'schedule': 3600.0,  # Every hour
        },
        'cleanup-old-jobs': {
            'task': 'apps.jobs.tasks.cleanup_old_jobs',
            'schedule': 86400.0,  # Every day
        },
        'send-daily-digest': {
            'task': 'apps.notifications.tasks.send_daily_digest',
            'schedule': 86400.0,  # Every day
            'options': {'queue': 'notifications'}
        },
        'update-job-recommendations': {
            'task': 'apps.ai.tasks.update_all_recommendations',
            'schedule': 21600.0,  # Every 6 hours
            'options': {'queue': 'ai'}
        },
        'check-email-responses': {
            'task': 'apps.google_integration.tasks.check_all_email_responses',
            'schedule': 3600.0,  # Every hour
            'options': {'queue': 'google_integration'}
        },
        'refresh-google-tokens': {
            'task': 'apps.google_integration.tasks.refresh_expired_tokens',
            'schedule': 1800.0,  # Every 30 minutes
            'options': {'queue': 'google_integration'}
        },
        'trigger-daily-auto-apply': {
            'task': 'apps.google_integration.tasks.trigger_daily_auto_apply',
            'schedule': 86400.0,  # Every day at midnight
            'options': {'queue': 'google_integration'}
        },
        'cleanup-old-sessions': {
            'task': 'apps.google_integration.tasks.cleanup_old_sessions',
            'schedule': 604800.0,  # Every week
            'options': {'queue': 'google_integration'}
        },
    },
)

@app.task(bind=True)
def debug_task(self):
    """
    Debug task for testing Celery configuration
    """
    print(f'Request: {self.request!r}') 
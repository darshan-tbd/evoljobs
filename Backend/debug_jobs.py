import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.jobs.models import JobPosting
from django.utils import timezone

jobs = JobPosting.objects.all()
now = timezone.now()

print(f"Current time: {now}")
print(f"Total jobs: {jobs.count()}")
print("\nJob deadlines:")

for job in jobs:
    if job.application_deadline:
        expired = job.application_deadline <= now
        print(f"- {job.title}: {job.application_deadline} ({'EXPIRED' if expired else 'ACTIVE'})")
    else:
        print(f"- {job.title}: No deadline (ACTIVE)") 
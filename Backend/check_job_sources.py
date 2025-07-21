#!/usr/bin/env python
"""
Script to check the source of job data
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.scrapers.models import JobScraper, ScrapedJob

def check_job_sources():
    print("=== JOB DATA SOURCE ANALYSIS ===")
    
    # Get total jobs
    total_jobs = JobPosting.objects.count()
    active_jobs = JobPosting.objects.filter(status='active').count()
    
    print(f"Total jobs in database: {total_jobs}")
    print(f"Active jobs: {active_jobs}")
    
    # Check companies
    companies = Company.objects.all()
    print(f"Total companies: {companies.count()}")
    
    print("\n=== COMPANIES ===")
    for company in companies[:10]:
        print(f"- {company.name}")
    
    # Check scraper activity
    print("\n=== SCRAPER RECORDS ===")
    scrapers = JobScraper.objects.all()
    for scraper in scrapers:
        print(f"Scraper: {scraper.name}")
        print(f"  Active: {scraper.is_active}")
        print(f"  Last run: {scraper.last_run}")
        print()
    
    # Check scraped jobs
    scraped_count = ScrapedJob.objects.count()
    print(f"Scraped jobs in database: {scraped_count}")
    
    # Check jobs with external fields
    jobs_with_external = JobPosting.objects.exclude(external_id__exact='').count()
    print(f"Jobs with external_id: {jobs_with_external}")
    
    # Check Michael Page jobs specifically
    michael_page_jobs = JobPosting.objects.filter(company__name='Michael Page')
    print(f"Michael Page jobs: {michael_page_jobs.count()}")
    
    # Check job creation dates
    recent_jobs = JobPosting.objects.filter(created_at__gte='2025-07-14').order_by('-created_at')
    print(f"Jobs created since July 14, 2025: {recent_jobs.count()}")
    
    # Check job fields to see if they indicate scraping
    print("\n=== JOB MODEL FIELDS ===")
    job_fields = [field.name for field in JobPosting._meta.fields]
    print("Available fields:", job_fields)
    
    # Check sample jobs
    print("\n=== SAMPLE JOB DATA ===")
    sample_jobs = JobPosting.objects.filter(status='active')[:8]
    
    for job in sample_jobs:
        print(f"\nJob: {job.title}")
        print(f"  Company: {job.company.name if job.company else 'No company'}")
        print(f"  Created: {job.created_at}")
        print(f"  External Source: {getattr(job, 'external_source', 'N/A')}")
        print(f"  External ID: {getattr(job, 'external_id', 'N/A')}")
        print(f"  External URL: {getattr(job, 'external_url', 'N/A')}")

if __name__ == "__main__":
    check_job_sources() 
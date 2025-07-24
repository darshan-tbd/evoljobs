#!/usr/bin/env python
"""
Unified Job Scraper Runner
==========================

This script runs all job scrapers and saves data to the JobPosting model.
Supports:
- Michael Page Australia
- Pro Bono Australia  
- ServiceSeeking

Usage:
    python run_all_scrapers.py                    # Run all scrapers
    python run_all_scrapers.py --michael-page     # Run only Michael Page
    python run_all_scrapers.py --pro-bono         # Run only Pro Bono Australia
    python run_all_scrapers.py --service-seeking  # Run only ServiceSeeking
    python run_all_scrapers.py --max-jobs 50      # Set max jobs per scraper
"""

import os
import sys
import django
import argparse
from datetime import datetime

# Django setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from apps.jobs.models import JobPosting
from django.utils import timezone

def run_michael_page_scraper(max_jobs=100):
    """Run Michael Page scraper"""
    print("\n" + "="*60)
    print("🚀 Starting Michael Page Australia Scraper")
    print("="*60)
    
    try:
        from fetch_michael_page_job import fetch_michael_page_job
        fetch_michael_page_job(max_jobs)
        print("✅ Michael Page scraper completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Michael Page scraper failed: {str(e)}")
        return False

def run_pro_bono_scraper(max_jobs=30):
    """Run Pro Bono Australia scraper"""
    print("\n" + "="*60)
    print("🚀 Starting Pro Bono Australia Scraper")
    print("="*60)
    
    try:
        from scrape_probonoaustralia import fetch_probonoaustralia_jobs
        fetch_probonoaustralia_jobs()
        print("✅ Pro Bono Australia scraper completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Pro Bono Australia scraper failed: {str(e)}")
        return False

def run_service_seeking_scraper(max_jobs=30):
    """Run ServiceSeeking scraper"""
    print("\n" + "="*60)
    print("🚀 Starting ServiceSeeking Scraper")
    print("="*60)
    
    try:
        from scrape_serviceseeking import fetch_serviceseeking_all_jobs
        fetch_serviceseeking_all_jobs()
        print("✅ ServiceSeeking scraper completed successfully!")
        return True
    except Exception as e:
        print(f"❌ ServiceSeeking scraper failed: {str(e)}")
        return False

def get_scraping_stats():
    """Get statistics about scraped jobs"""
    total_jobs = JobPosting.objects.count()
    
    # Count by source
    michael_page_jobs = JobPosting.objects.filter(external_source="Michael Page").count()
    pro_bono_jobs = JobPosting.objects.filter(external_source="Pro Bono Australia").count()
    service_seeking_jobs = JobPosting.objects.filter(external_source="ServiceSeeking").count()
    
    # Count by date (last 24 hours)
    yesterday = timezone.now() - timezone.timedelta(days=1)
    recent_jobs = JobPosting.objects.filter(created_at__gte=yesterday).count()
    
    return {
        'total_jobs': total_jobs,
        'michael_page_jobs': michael_page_jobs,
        'pro_bono_jobs': pro_bono_jobs,
        'service_seeking_jobs': service_seeking_jobs,
        'recent_jobs': recent_jobs
    }

def print_stats():
    """Print scraping statistics"""
    stats = get_scraping_stats()
    
    print("\n" + "="*60)
    print("📊 SCRAPING STATISTICS")
    print("="*60)
    print(f"📈 Total Jobs in Database: {stats['total_jobs']}")
    print(f"📈 Recent Jobs (24h): {stats['recent_jobs']}")
    print(f"🏢 Michael Page Jobs: {stats['michael_page_jobs']}")
    print(f"🏢 Pro Bono Australia Jobs: {stats['pro_bono_jobs']}")
    print(f"🏢 ServiceSeeking Jobs: {stats['service_seeking_jobs']}")
    print("="*60)

def main():
    parser = argparse.ArgumentParser(description='Run job scrapers')
    parser.add_argument('--michael-page', action='store_true', help='Run only Michael Page scraper')
    parser.add_argument('--pro-bono', action='store_true', help='Run only Pro Bono Australia scraper')
    parser.add_argument('--service-seeking', action='store_true', help='Run only ServiceSeeking scraper')
    parser.add_argument('--max-jobs', type=int, default=100, help='Maximum jobs to scrape per source')
    parser.add_argument('--stats', action='store_true', help='Show statistics only')
    
    args = parser.parse_args()
    
    print("🎯 EvolJobs.com - Unified Job Scraper")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if args.stats:
        print_stats()
        return
    
    # Show initial stats
    print("\n📊 Initial Statistics:")
    initial_stats = get_scraping_stats()
    print(f"   Total jobs before scraping: {initial_stats['total_jobs']}")
    
    success_count = 0
    total_scrapers = 0
    
    # Run scrapers based on arguments
    if args.michael_page:
        total_scrapers += 1
        if run_michael_page_scraper(args.max_jobs):
            success_count += 1
    elif args.pro_bono:
        total_scrapers += 1
        if run_pro_bono_scraper(args.max_jobs):
            success_count += 1
    elif args.service_seeking:
        total_scrapers += 1
        if run_service_seeking_scraper(args.max_jobs):
            success_count += 1
    else:
        # Run all scrapers
        total_scrapers = 3
        
        # Michael Page
        if run_michael_page_scraper(args.max_jobs):
            success_count += 1
        
        # Pro Bono Australia
        if run_pro_bono_scraper(30):  # Pro Bono typically has fewer jobs
            success_count += 1
        
        # ServiceSeeking
        if run_service_seeking_scraper(30):  # ServiceSeeking typically has fewer jobs
            success_count += 1
    
    # Show final stats
    print("\n" + "="*60)
    print("🎉 SCRAPING COMPLETED")
    print("="*60)
    print(f"✅ Successful scrapers: {success_count}/{total_scrapers}")
    
    if success_count > 0:
        print_stats()
        
        # Show new jobs added
        final_stats = get_scraping_stats()
        new_jobs = final_stats['total_jobs'] - initial_stats['total_jobs']
        print(f"\n🎯 New jobs added in this session: {new_jobs}")
        
        if new_jobs > 0:
            print("🚀 Jobs are now available in your JobPilot platform!")
            print("   - Search and browse jobs on the frontend")
            print("   - Manage jobs through the admin dashboard")
            print("   - Jobs will appear in AI recommendations")
    else:
        print("❌ No scrapers completed successfully")
    
    print(f"\n⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Comprehensive Job Scraper
Scrapes jobs from multiple sources to get large amounts of data efficiently
"""

import os
import sys
import django
import time
import random
from datetime import datetime

# Django setup
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from apps.scrapers.real_job_scraper import RealJobScraper
from fetch_michael_page_job import MichaelPageScraper
from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.core.models import Location, Industry, Skill
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class ComprehensiveJobScraper:
    """
    Comprehensive scraper that combines multiple job sources
    """
    
    def __init__(self, max_jobs_per_source=50):
        self.max_jobs_per_source = max_jobs_per_source
        self.total_jobs_scraped = 0
        self.scrapers = []
        
    def setup_scrapers(self):
        """Setup all available scrapers"""
        try:
            # Real job scraper (static data)
            self.scrapers.append({
                'name': 'Real Jobs',
                'scraper': RealJobScraper(),
                'method': 'run_scraper',
                'args': {'limit_per_site': self.max_jobs_per_source // 5}  # Divide by number of sites
            })
            
            # Michael Page scraper (Selenium-based)
            self.scrapers.append({
                'name': 'Michael Page',
                'scraper': MichaelPageScraper(max_jobs=self.max_jobs_per_source),
                'method': 'scrape_multiple_jobs',
                'args': {}
            })
            
            print(f"✅ Setup {len(self.scrapers)} scrapers")
            
        except Exception as e:
            print(f"❌ Error setting up scrapers: {str(e)}")
    
    def run_all_scrapers(self):
        """Run all scrapers and collect results"""
        print("🚀 Starting comprehensive job scraping...")
        print("=" * 60)
        
        self.setup_scrapers()
        
        start_time = timezone.now()
        initial_job_count = JobPosting.objects.count()
        
        for i, scraper_info in enumerate(self.scrapers):
            try:
                print(f"\n📊 Scraper {i+1}/{len(self.scrapers)}: {scraper_info['name']}")
                print("-" * 40)
                
                scraper = scraper_info['scraper']
                method_name = scraper_info['method']
                method_args = scraper_info['args']
                
                # Get the method
                method = getattr(scraper, method_name)
                
                # Run the scraper
                if method_name == 'run_scraper':
                    jobs_scraped = method(**method_args)
                    print(f"✅ {scraper_info['name']} scraped {jobs_scraped} jobs")
                elif method_name == 'scrape_multiple_jobs':
                    method()  # This method handles its own output
                    # Count new jobs added
                    current_count = JobPosting.objects.count()
                    jobs_scraped = current_count - initial_job_count
                    initial_job_count = current_count
                    print(f"✅ {scraper_info['name']} completed")
                
                self.total_jobs_scraped += jobs_scraped if 'jobs_scraped' in locals() else 0
                
                # Add delay between scrapers
                if i < len(self.scrapers) - 1:
                    delay = random.uniform(5, 10)
                    print(f"⏱️ Waiting {delay:.1f} seconds before next scraper...")
                    time.sleep(delay)
                
            except Exception as e:
                print(f"❌ Error with {scraper_info['name']}: {str(e)}")
                logger.error(f"Scraper {scraper_info['name']} failed: {str(e)}")
                continue
        
        end_time = timezone.now()
        duration = end_time - start_time
        
        # Final summary
        final_job_count = JobPosting.objects.count()
        total_new_jobs = final_job_count - initial_job_count
        
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE SCRAPING SUMMARY")
        print("=" * 60)
        print(f"⏱️  Duration: {duration}")
        print(f"📈 Total jobs in database: {final_job_count}")
        print(f"🆕 New jobs added: {total_new_jobs}")
        print(f"🎯 Target per source: {self.max_jobs_per_source}")
        print(f"✅ Scraping completed successfully!")
        
        return total_new_jobs

def run_comprehensive_scraper(max_jobs_per_source=50):
    """Main function to run comprehensive scraping"""
    scraper = ComprehensiveJobScraper(max_jobs_per_source=max_jobs_per_source)
    return scraper.run_all_scrapers()

if __name__ == "__main__":
    # Allow command line argument for number of jobs per source
    import sys
    max_jobs_per_source = 50
    if len(sys.argv) > 1:
        try:
            max_jobs_per_source = int(sys.argv[1])
        except ValueError:
            print("Invalid number of jobs. Using default: 50 per source")
    
    print(f"🚀 Starting comprehensive scraper to fetch up to {max_jobs_per_source} jobs per source...")
    run_comprehensive_scraper(max_jobs_per_source) 
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.scrapers.real_job_scraper import RealJobScraper
from apps.scrapers.models import JobScraper
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Scrape real jobs from legitimate job boards and company websites'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=5,
            help='Number of jobs to scrape per site (default: 5)'
        )
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Clean existing fictional jobs before scraping'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting real job scraping...'))
        
        # Clean existing fictional jobs if requested
        if options['clean']:
            self.clean_fictional_jobs()
        
        # Create or update scraper record
        scraper, created = JobScraper.objects.get_or_create(
            name='Real Jobs Scraper',
            defaults={
                'url': 'https://multiple-sources.com',
                'is_active': True
            }
        )
        
        # Run the scraper
        try:
            real_scraper = RealJobScraper()
            total_processed = real_scraper.run_scraper(
                scraper_name='real-jobs',
                limit_per_site=options['limit']
            )
            
            # Update scraper record
            scraper.last_run = timezone.now()
            scraper.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully scraped and processed {total_processed} real jobs!'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error running scraper: {str(e)}')
            )
            logger.error(f'Error running scraper: {str(e)}')
    
    def clean_fictional_jobs(self):
        """Clean existing fictional jobs from the database"""
        from apps.jobs.models import JobPosting
        from apps.companies.models import Company
        
        self.stdout.write('Cleaning fictional jobs...')
        
        # Delete fictional TechCorp AI jobs
        fictional_jobs = JobPosting.objects.filter(
            company__name='TechCorp AI'
        )
        
        count = fictional_jobs.count()
        fictional_jobs.delete()
        
        # Delete fictional company if no other jobs
        try:
            techcorp = Company.objects.get(name='TechCorp AI')
            if not techcorp.job_postings.exists():
                techcorp.delete()
                self.stdout.write(f'Deleted fictional company: TechCorp AI')
        except Company.DoesNotExist:
            pass
        
        self.stdout.write(f'Cleaned {count} fictional jobs') 
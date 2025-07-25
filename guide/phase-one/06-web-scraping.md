# Web Scraping & Data Acquisition System

##  Web Scraping Overview

JobPilot employs a sophisticated web scraping system that automatically collects job listings from legitimate job boards and company career pages. The system ensures fresh, accurate job data while respecting website policies and rate limits.

##  Supported Data Sources

### 1. Technology Companies
- **GitHub Careers**: Open source and tech-focused positions
- **Stripe Jobs**: Fintech and payment industry roles
- **Shopify Careers**: E-commerce and SaaS positions
- **Netflix Jobs**: Media and entertainment positions

### 2. Recruitment Platforms
- **Michael Page**: Professional recruitment services
- **ProBonoAustralia**: Non-profit and social impact roles
- **ServiceSeeking**: Service-based job opportunities

### 3. Industry-Specific Sources
- **Tech Startups**: YC companies and unicorn startups
- **Government Jobs**: Public sector opportunities (planned)
- **Healthcare**: Medical and healthcare positions (planned)
- **Education**: Academic and educational roles (planned)

##  Technical Architecture

### Scraper Framework
`python
class RealJobScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
    def scrape_site(self, site_config):
        """Generic scraping method for any job site"""
        try:
            response = self.session.get(site_config['url'], timeout=10)
            if response.status_code == 200:
                return self.parse_jobs(response.content, site_config)
        except Exception as e:
            logger.error(f"Scraping failed for {site_config['name']}: {e}")
            return []
`

### Data Processing Pipeline
`
Raw HTML Content
     BeautifulSoup Parsing
Structured Job Data
     Data Validation
Clean Job Information
     Deduplication
Unique Job Listings
     AI Enhancement
Enhanced Job Data
     Database Storage
JobPosting Records
`

##  Data Models

### JobScraper Model
`python
class JobScraper(BaseModel):
    name = CharField(max_length=100)
    url = URLField()
    is_active = BooleanField(default=True)
    last_run = DateTimeField(null=True, blank=True)
    success_rate = FloatField(default=0.0)
    jobs_scraped = IntegerField(default=0)
    
    # Scraping configuration
    rate_limit_delay = IntegerField(default=2)  # seconds between requests
    max_pages = IntegerField(default=10)
    selectors = JSONField(default=dict)  # CSS selectors for parsing
    
    # Status tracking
    status = CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('error', 'Error'),
        ('maintenance', 'Maintenance')
    ], default='active')
`

### ScrapedJob Model
`python
class ScrapedJob(BaseModel):
    # Source information
    scraper = ForeignKey(JobScraper, on_delete=CASCADE)
    external_id = CharField(max_length=255)
    external_url = URLField()
    source_name = CharField(max_length=100)
    
    # Job data
    title = CharField(max_length=255)
    company_name = CharField(max_length=255)
    location = CharField(max_length=255, blank=True)
    description = TextField()
    requirements = TextField(blank=True)
    benefits = TextField(blank=True)
    
    # Job details
    job_type = CharField(max_length=20, choices=JobPosting.JOB_TYPES)
    experience_level = CharField(max_length=20, choices=JobPosting.EXPERIENCE_LEVELS)
    remote_option = CharField(max_length=20, choices=JobPosting.REMOTE_OPTIONS)
    
    # Salary information
    salary_min = DecimalField(max_digits=10, decimal_places=2, null=True)
    salary_max = DecimalField(max_digits=10, decimal_places=2, null=True)
    salary_currency = CharField(max_length=3, default='USD')
    
    # Skills and metadata
    extracted_skills = JSONField(default=list)
    metadata = JSONField(default=dict)
    
    # Processing status
    is_processed = BooleanField(default=False)
    processed_at = DateTimeField(null=True, blank=True)
    processing_errors = TextField(blank=True)
`

##  Intelligent Data Processing

### 1. Content Extraction
`python
def extract_job_data(self, html_content, site_config):
    """Extract structured job data from HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    jobs = []
    job_elements = soup.select(site_config['job_selector'])
    
    for job_element in job_elements:
        job_data = {
            'title': self.extract_text(job_element, site_config['title_selector']),
            'company': self.extract_text(job_element, site_config['company_selector']),
            'location': self.extract_text(job_element, site_config['location_selector']),
            'description': self.extract_text(job_element, site_config['description_selector']),
            'url': self.extract_url(job_element, site_config['url_selector']),
            'posted_date': self.extract_date(job_element, site_config['date_selector'])
        }
        
        # Validate required fields
        if job_data['title'] and job_data['company']:
            jobs.append(job_data)
    
    return jobs
`

### 2. Data Enrichment
`python
def enrich_job_data(self, job_data):
    """Enhance scraped job data with AI processing"""
    
    # Extract skills from description
    skills = self.extract_skills_from_text(job_data['description'])
    job_data['extracted_skills'] = skills
    
    # Classify job category
    category = self.classify_job_category(job_data['title'], job_data['description'])
    job_data['category'] = category
    
    # Standardize location
    standardized_location = self.standardize_location(job_data['location'])
    job_data['standardized_location'] = standardized_location
    
    # Estimate salary range (if not provided)
    if not job_data.get('salary_min'):
        estimated_salary = self.estimate_salary_range(
            job_data['title'], 
            job_data['location'], 
            job_data['extracted_skills']
        )
        job_data['estimated_salary'] = estimated_salary
    
    return job_data
`

### 3. Deduplication System
`python
def detect_duplicate_jobs(self, new_job):
    """Detect duplicate jobs using multiple criteria"""
    
    # Check for exact matches
    exact_match = JobPosting.objects.filter(
        title__iexact=new_job['title'],
        company__name__iexact=new_job['company'],
        external_url=new_job.get('external_url', '')
    ).exists()
    
    if exact_match:
        return True
    
    # Check for similar matches
    similar_jobs = JobPosting.objects.filter(
        title__icontains=self.extract_core_title(new_job['title']),
        company__name__iexact=new_job['company']
    )
    
    for job in similar_jobs:
        similarity_score = self.calculate_job_similarity(new_job, job)
        if similarity_score > 0.85:  # 85% similarity threshold
            return True
    
    return False

def calculate_job_similarity(self, job1, job2):
    """Calculate similarity between two jobs"""
    from difflib import SequenceMatcher
    
    # Title similarity (40% weight)
    title_sim = SequenceMatcher(None, job1['title'].lower(), job2.title.lower()).ratio()
    
    # Description similarity (40% weight)
    desc_sim = SequenceMatcher(None, job1['description'][:500].lower(), 
                              job2.description[:500].lower()).ratio()
    
    # Location similarity (20% weight)
    loc_sim = SequenceMatcher(None, job1.get('location', '').lower(), 
                             str(job2.location).lower()).ratio()
    
    # Weighted average
    overall_similarity = (title_sim * 0.4) + (desc_sim * 0.4) + (loc_sim * 0.2)
    
    return overall_similarity
`

##  Scraping Workflow

### 1. Scheduled Execution
`python
# Django management command
class Command(BaseCommand):
    help = 'Run job scrapers to collect fresh job data'
    
    def add_arguments(self, parser):
        parser.add_argument('--scraper', type=str, help='Specific scraper to run')
        parser.add_argument('--limit', type=int, default=50, help='Max jobs per scraper')
        parser.add_argument('--force', action='store_true', help='Force run even if recently executed')
    
    def handle(self, *args, **options):
        if options['scraper']:
            scrapers = [JobScraper.objects.get(name=options['scraper'])]
        else:
            scrapers = JobScraper.objects.filter(is_active=True)
        
        for scraper in scrapers:
            try:
                runner = ScraperRunner(scraper)
                result = runner.execute(limit=options['limit'])
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Scraper '{scraper.name}': {result['jobs_found']} jobs found, "
                        f"{result['jobs_saved']} saved, {result['duplicates']} duplicates"
                    )
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Scraper '{scraper.name}' failed: {e}")
                )
`

### 2. Rate Limiting & Politeness
`python
class ScraperRunner:
    def __init__(self, scraper):
        self.scraper = scraper
        self.rate_limiter = RateLimiter(scraper.rate_limit_delay)
        
    def execute(self, limit=50):
        """Execute scraping with rate limiting"""
        jobs_found = 0
        jobs_saved = 0
        duplicates = 0
        
        try:
            for page in range(1, self.scraper.max_pages + 1):
                # Rate limiting
                self.rate_limiter.wait()
                
                # Scrape page
                page_jobs = self.scrape_page(page)
                jobs_found += len(page_jobs)
                
                for job_data in page_jobs:
                    if not self.is_duplicate(job_data):
                        self.save_job(job_data)
                        jobs_saved += 1
                    else:
                        duplicates += 1
                
                # Stop if limit reached
                if jobs_saved >= limit:
                    break
                    
                # Stop if no jobs found on page
                if not page_jobs:
                    break
            
            # Update scraper statistics
            self.update_scraper_stats(jobs_found, jobs_saved, duplicates)
            
        except Exception as e:
            self.log_error(str(e))
            raise
        
        return {
            'jobs_found': jobs_found,
            'jobs_saved': jobs_saved,
            'duplicates': duplicates
        }
`

### 3. Error Handling & Monitoring
`python
class ScrapingMonitor:
    @staticmethod
    def log_scraping_activity(scraper, status, message, **kwargs):
        """Log scraping activities for monitoring"""
        ScrapingLog.objects.create(
            scraper=scraper,
            status=status,
            message=message,
            metadata=kwargs,
            timestamp=timezone.now()
        )
    
    @staticmethod
    def check_scraper_health():
        """Monitor scraper health and send alerts"""
        unhealthy_scrapers = []
        
        for scraper in JobScraper.objects.filter(is_active=True):
            # Check if scraper ran recently
            last_run = scraper.last_run
            if last_run and (timezone.now() - last_run).days > 1:
                unhealthy_scrapers.append(f"{scraper.name}: No activity for {(timezone.now() - last_run).days} days")
            
            # Check success rate
            if scraper.success_rate < 0.5:  # Less than 50% success
                unhealthy_scrapers.append(f"{scraper.name}: Low success rate ({scraper.success_rate:.1%})")
        
        if unhealthy_scrapers:
            # Send alert to admins
            NotificationService.send_admin_alert(
                title="Scraper Health Warning",
                message=f"Issues detected with scrapers:\n" + "\n".join(unhealthy_scrapers)
            )
        
        return unhealthy_scrapers
`

##  Analytics & Performance

### Scraping Metrics
`python
def get_scraping_analytics():
    """Get comprehensive scraping analytics"""
    total_jobs_scraped = ScrapedJob.objects.count()
    jobs_processed = ScrapedJob.objects.filter(is_processed=True).count()
    
    # Success rates by scraper
    scraper_stats = {}
    for scraper in JobScraper.objects.all():
        recent_logs = ScrapingLog.objects.filter(
            scraper=scraper,
            timestamp__gte=timezone.now() - timedelta(days=7)
        )
        
        total_runs = recent_logs.count()
        successful_runs = recent_logs.filter(status='success').count()
        success_rate = (successful_runs / total_runs) * 100 if total_runs > 0 else 0
        
        scraper_stats[scraper.name] = {
            'success_rate': success_rate,
            'total_jobs': scraper.jobs_scraped,
            'last_run': scraper.last_run,
            'status': scraper.status
        }
    
    return {
        'total_jobs_scraped': total_jobs_scraped,
        'processing_rate': (jobs_processed / total_jobs_scraped) * 100 if total_jobs_scraped > 0 else 0,
        'scraper_statistics': scraper_stats,
        'daily_scraping_volume': get_daily_scraping_volume()
    }
`

### Quality Assurance
`python
def validate_scraped_job(job_data):
    """Validate scraped job data quality"""
    issues = []
    
    # Required fields check
    required_fields = ['title', 'company', 'description']
    for field in required_fields:
        if not job_data.get(field):
            issues.append(f"Missing required field: {field}")
    
    # Content quality checks
    if len(job_data.get('description', '')) < 100:
        issues.append("Description too short")
    
    if len(job_data.get('title', '')) < 5:
        issues.append("Title too short")
    
    # Spam detection
    spam_keywords = ['get rich quick', 'work from home scam', 'pyramid scheme']
    description_lower = job_data.get('description', '').lower()
    for spam_word in spam_keywords:
        if spam_word in description_lower:
            issues.append(f"Potential spam content detected: {spam_word}")
    
    return {
        'is_valid': len(issues) == 0,
        'issues': issues,
        'quality_score': calculate_quality_score(job_data)
    }

def calculate_quality_score(job_data):
    """Calculate job data quality score (0-100)"""
    score = 0
    
    # Completeness (40 points)
    fields = ['title', 'company', 'description', 'location', 'requirements']
    filled_fields = sum(1 for field in fields if job_data.get(field))
    score += (filled_fields / len(fields)) * 40
    
    # Content length (30 points)
    desc_length = len(job_data.get('description', ''))
    if desc_length > 500:
        score += 30
    elif desc_length > 200:
        score += 20
    elif desc_length > 100:
        score += 10
    
    # Additional info (30 points)
    if job_data.get('salary_min'):
        score += 10
    if job_data.get('requirements'):
        score += 10
    if job_data.get('benefits'):
        score += 10
    
    return min(100, score)
`

##  Configuration & Customization

### Site Configuration
`python
SCRAPER_CONFIGS = {
    'github': {
        'name': 'GitHub Careers',
        'base_url': 'https://github.com/about/careers',
        'job_selector': '.job-listing',
        'title_selector': '.job-title',
        'company_selector': '.company-name',
        'location_selector': '.job-location',
        'description_selector': '.job-description',
        'url_selector': 'a.job-link',
        'rate_limit': 2,  # seconds
        'max_pages': 5
    },
    'stripe': {
        'name': 'Stripe Jobs',
        'base_url': 'https://stripe.com/jobs',
        'job_selector': '.job-card',
        'title_selector': '.job-title',
        'company_selector': '.company-stripe',
        'location_selector': '.job-location',
        'description_selector': '.job-desc',
        'rate_limit': 3,
        'max_pages': 3
    }
}
`

### Dynamic Configuration
`python
class ScraperConfigManager:
    @staticmethod
    def update_scraper_config(scraper_name, config_updates):
        """Update scraper configuration dynamically"""
        scraper = JobScraper.objects.get(name=scraper_name)
        current_config = scraper.selectors or {}
        current_config.update(config_updates)
        scraper.selectors = current_config
        scraper.save()
    
    @staticmethod
    def test_scraper_config(scraper_name, test_url=None):
        """Test scraper configuration before deployment"""
        scraper = JobScraper.objects.get(name=scraper_name)
        runner = ScraperRunner(scraper)
        
        try:
            # Test with single page
            test_jobs = runner.scrape_page(1, test_url=test_url)
            return {
                'success': True,
                'jobs_found': len(test_jobs),
                'sample_jobs': test_jobs[:3]
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
`

##  Future Enhancements

### Advanced Features (Planned)
- **Machine Learning**: AI-powered content extraction
- **Image Recognition**: Logo and visual content analysis
- **Natural Language Processing**: Advanced skill extraction
- **Predictive Analytics**: Job market trend analysis
- **Real-time Monitoring**: Live job posting alerts

### Scalability Improvements
- **Distributed Scraping**: Multi-server scraping deployment
- **Queue Management**: Advanced job processing queues
- **Cache Optimization**: Intelligent caching strategies
- **API Integration**: Direct integration with job board APIs

### Compliance & Ethics
- **Robots.txt Compliance**: Respect website scraping policies
- **Rate Limiting**: Intelligent adaptive rate limiting
- **Data Privacy**: GDPR-compliant data handling
- **Terms of Service**: Automated ToS monitoring

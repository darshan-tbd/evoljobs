import uuid
import os
import django
import random
import re
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import sys
import json

# Django setup
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Backend.settings")
django.setup()

from apps.jobs.models import JobPosting
from apps.jobs.services import JobCategorizationService
from apps.companies.models import Company
from apps.core.models import Location
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()

class MichaelPageScraper:
    def __init__(self, max_jobs=100):
        self.driver = None
        self.base_url = "https://www.michaelpage.com.au"
        self.search_url = "https://www.michaelpage.com.au/jobs"
        self.max_jobs_to_scrape = max_jobs  # Configurable limit
        self.jobs_scraped = 0
        
    def setup_driver(self):
        """Setup Chrome driver with proper options"""
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument("--disable-web-security")
        options.add_argument("--disable-features=VizDisplayCompositor")
        
        self.driver = webdriver.Chrome(options=options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        return self.driver
    
    def wait_for_page_load(self, timeout=15):
        """Wait for page to fully load"""
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            time.sleep(3)  # Additional wait for dynamic content
            return True
        except TimeoutException:
            print("⚠️ Page load timeout")
            return False
    
    def scroll_to_load_more_content(self):
        """Scroll down to load more content if the page uses lazy loading"""
        try:
            print("📜 Scrolling to load more content...")
            
            # Get initial page height
            initial_height = self.driver.execute_script("return document.body.scrollHeight")
            
            # Scroll down multiple times to trigger lazy loading
            for i in range(3):
                # Scroll to bottom
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                
                # Check if new content loaded
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height > initial_height:
                    print(f"✅ New content loaded (height: {initial_height} -> {new_height})")
                    initial_height = new_height
                else:
                    print("ℹ️ No new content loaded")
                    break
            
            # Scroll back to top
            self.driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(2)
            
        except Exception as e:
            print(f"⚠️ Error during scrolling: {str(e)[:50]}...")
    
    def find_job_elements(self):
        """Find job elements using multiple strategies with better error handling"""
        job_elements = []
        
        # Wait for page to fully load and stabilize
        print("⏳ Waiting for page to stabilize...")
        time.sleep(5)
        
        # Try different selectors that might work with current site
        selectors = [
            # Modern selectors
            "[data-testid*='job']",
            "[data-automation-id*='job']",
            ".job-tile",
            ".job-card",
            ".job-result",
            ".search-result",
            ".job-listing",
            ".job-item",
            
            # Generic selectors
            "[class*='job-search']",
            "[class*='job-card']",
            "[class*='job-item']",
            "[class*='job-result']",
            "[class*='search-result']",
            
            # Fallback selectors
            "article[class*='job']",
            "div[class*='job']",
            "li[class*='job']",
            ".result",
            "[role='listitem']",
            
            # Try looking for links to job detail pages
            "a[href*='/job/']",
            "a[href*='/jobs/']",
            "a[href*='/job-detail/']",
            "a[href*='/position/']",
        ]
        
        for selector in selectors:
            try:
                print(f"🔍 Trying selector: {selector}")
                
                # Wait for elements to be present
                wait = WebDriverWait(self.driver, 10)
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(f"✅ Found {len(elements)} elements with selector: {selector}")
                    
                    # Filter out elements that are too small or likely not job cards
                    valid_elements = []
                    for elem in elements:
                        try:
                            # Wait for element to be visible
                            wait.until(EC.visibility_of(elem))
                            
                            # Check if element has some content
                            if elem.text.strip() and len(elem.text.strip()) > 20:
                                valid_elements.append(elem)
                        except Exception as e:
                            print(f"⚠️ Element validation failed: {str(e)[:30]}...")
                            continue
                    
                    if valid_elements:
                        print(f"✅ {len(valid_elements)} valid job elements found")
                        return valid_elements, selector
                    else:
                        print(f"⚠️ No valid elements found with selector: {selector}")
                        
            except Exception as e:
                print(f"❌ Selector {selector} failed: {str(e)[:50]}...")
                continue
        
        return [], None
    
    def extract_job_data_from_listing(self, job_element):
        """Extract job data from a job listing element"""
        job_data = {
            'title': '',
            'company': 'Michael Page',
            'location': '',
            'salary': '',
            'url': '',
            'description': '',
            'posted_date': None
        }
        
        try:
            # Use explicit wait to ensure element is still attached to DOM
            wait = WebDriverWait(self.driver, 10)
            
            # Get the element's HTML content with retry mechanism
            html_content = None
            max_retries = 3
            
            for attempt in range(max_retries):
                try:
                    # Check if element is still attached to DOM
                    wait.until(lambda driver: job_element.is_enabled())
                    
                    # Get HTML content
                    html_content = job_element.get_attribute('innerHTML')
                    if html_content:
                        break
                        
                except Exception as e:
                    print(f"⚠️ Attempt {attempt + 1} failed to get element content: {str(e)[:50]}...")
                    if attempt < max_retries - 1:
                        time.sleep(1)  # Wait before retry
                        continue
                    else:
                        print("❌ Failed to get element content after all retries")
                        return job_data
            
            if not html_content:
                print("❌ No HTML content found")
                return job_data
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extract job title - try multiple approaches with better error handling
            title_selectors = [
                'h1', 'h2', 'h3', 'h4',
                '.title', '.job-title', '.position-title',
                '[class*="title"]', '[class*="heading"]',
                'a[href*="/job"]', 'a[href*="/position"]',
                'strong', 'b'
            ]
            
            title_found = False
            for selector in title_selectors:
                try:
                    title_elements = soup.select(selector)
                    for elem in title_elements:
                        text = elem.get_text(strip=True)
                        if self.is_valid_job_title(text):
                            job_data['title'] = text
                            title_found = True
                            break
                    if title_found:
                        break
                except Exception as e:
                    print(f"⚠️ Error with title selector {selector}: {str(e)[:30]}...")
                    continue
            
            # Extract job URL with retry mechanism
            url_selectors = [
                'a[href*="/job"]',
                'a[href*="/position"]', 
                'a[href*="/jobs"]',
                'a[href*="/careers"]',
                'a[href]'
            ]
            
            for selector in url_selectors:
                try:
                    url_elements = soup.select(selector)
                    for elem in url_elements:
                        href = elem.get('href', '')
                        if href and ('/job' in href or '/position' in href):
                            if href.startswith('/'):
                                job_data['url'] = self.base_url + href
                            elif href.startswith('http'):
                                job_data['url'] = href
                            break
                    if job_data['url']:
                        break
                except Exception as e:
                    print(f"⚠️ Error with URL selector {selector}: {str(e)[:30]}...")
                    continue
            
            # Extract location with better text processing
            try:
                location_text = soup.get_text()
                australian_cities = [
                    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Darwin', 'Canberra',
                    'Gold Coast', 'Newcastle', 'Wollongong', 'Cairns', 'Townsville', 'Geelong',
                    'Ballarat', 'Bendigo', 'Albury', 'Launceston', 'Hobart', 'Mackay', 'Rockhampton'
                ]
                
                for city in australian_cities:
                    if city in location_text:
                        job_data['location'] = city
                        break
            except Exception as e:
                print(f"⚠️ Error extracting location: {str(e)[:30]}...")
            
            # Extract salary info with better regex handling
            try:
                salary_patterns = [
                    r'AU\$[\d,]+\s*-\s*AU\$[\d,]+',
                    r'\$[\d,]+\s*-\s*\$[\d,]+',
                    r'[\d,]+k\s*-\s*[\d,]+k',
                    r'AU\$[\d,]+',
                    r'\$[\d,]+',
                    r'[\d,]+k'
                ]
                
                for pattern in salary_patterns:
                    match = re.search(pattern, location_text)
                    if match:
                        job_data['salary'] = match.group(0)
                        break
            except Exception as e:
                print(f"⚠️ Error extracting salary: {str(e)[:30]}...")
            
            # Extract company if different from default
            try:
                company_selectors = [
                    '.company', '.employer', '[class*="company"]', '[class*="employer"]'
                ]
                
                for selector in company_selectors:
                    company_elements = soup.select(selector)
                    for elem in company_elements:
                        text = elem.get_text(strip=True)
                        if text and text != 'Michael Page' and len(text) > 2:
                            job_data['company'] = text
                            break
                    if job_data['company'] != 'Michael Page':
                        break
            except Exception as e:
                print(f"⚠️ Error extracting company: {str(e)[:30]}...")
            
            print(f"📋 Extracted from listing: {job_data['title'][:50]}... | {job_data['company']} | {job_data['location']}")
            
        except Exception as e:
            print(f"⚠️ Error extracting job data from listing: {str(e)}")
        
        return job_data
    
    def is_valid_job_title(self, title):
        """Check if a title looks like a valid job title"""
        if not title or len(title) < 10 or len(title) > 100:
            return False
        
        # Filter out common non-job-title text
        invalid_phrases = [
            'view job', 'save job', 'apply now', 'apply', 'save', 'view',
            'michael page', 'more details', 'read more', 'click here',
            'see more', 'find out more', 'learn more', 'contact us',
            'back to search', 'search again', 'filter', 'sort by',
            'page not found', 'error', '404', 'javascript', 'loading'
        ]
        
        title_lower = title.lower()
        for phrase in invalid_phrases:
            if phrase in title_lower:
                return False
        
        # Check if title contains job-related keywords
        job_keywords = [
            'manager', 'analyst', 'engineer', 'developer', 'specialist', 'coordinator',
            'assistant', 'director', 'officer', 'consultant', 'advisor', 'technician',
            'supervisor', 'lead', 'senior', 'junior', 'administrator', 'executive',
            'architect', 'designer', 'planner', 'researcher', 'scientist', 'accountant',
            'lawyer', 'nurse', 'teacher', 'sales', 'marketing', 'operations', 'finance',
            'hr', 'human resources', 'project', 'product', 'business', 'data', 'IT',
            'support', 'service', 'customer', 'client', 'team', 'head', 'chief'
        ]
        
        return any(keyword in title_lower for keyword in job_keywords)
    
    def extract_detailed_job_info(self, job_url):
        """Extract detailed information from job detail page"""
        detailed_info = {
            'description': '',
            'title': '',
            'salary': '',
            'location': '',
            'company': ''
        }
        
        if not job_url or job_url == self.search_url:
            return detailed_info
        
        try:
            print(f"🔗 Visiting job detail page: {job_url}")
            self.driver.get(job_url)
            
            if not self.wait_for_page_load():
                return detailed_info
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Extract job title from detail page
            title_selectors = [
                'h1', '.job-title', '.position-title', '.hero-title',
                '[class*="job-title"]', '[class*="position-title"]',
                '.page-title', '.main-title', '.header-title'
            ]
            
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title_text = title_elem.get_text(strip=True)
                    if self.is_valid_job_title(title_text):
                        detailed_info['title'] = title_text
                        break
            
            # Extract job description
            desc_selectors = [
                '.job-description', '.description', '.job-details',
                '[class*="description"]', '[class*="job-details"]',
                '.content', '.main-content', '.job-content',
                '.role-description', '.position-description'
            ]
            
            for selector in desc_selectors:
                desc_elem = soup.select_one(selector)
                if desc_elem:
                    # Remove unwanted elements
                    for unwanted in desc_elem.select('script, style, .btn, .button, [class*="btn"]'):
                        unwanted.decompose()
                    
                    description = desc_elem.get_text(separator='\n', strip=True)
                    if description and len(description) > 100:
                        detailed_info['description'] = description
                        break
            
            # Extract salary from detail page
            page_text = soup.get_text()
            salary_patterns = [
                r'AU\$[\d,]+\s*-\s*AU\$[\d,]+\s*per\s+(?:year|annum|hour)',
                r'\$[\d,]+\s*-\s*\$[\d,]+\s*per\s+(?:year|annum|hour)',
                r'AU\$[\d,]+\s*-\s*AU\$[\d,]+',
                r'\$[\d,]+\s*-\s*\$[\d,]+',
                r'[\d,]+k\s*-\s*[\d,]+k',
                r'AU\$[\d,]+',
                r'\$[\d,]+[k]?'
            ]
            
            for pattern in salary_patterns:
                match = re.search(pattern, page_text)
                if match:
                    salary_text = match.group(0)
                    # Make sure it's not part of a larger text that's not about salary
                    if not any(word in salary_text.lower() for word in ['guide', 'calculator', 'information']):
                        detailed_info['salary'] = salary_text
                        break
            
            # Extract location from detail page
            location_selectors = [
                '.location', '[class*="location"]', '.job-location',
                '[class*="job-location"]', '.address'
            ]
            
            australian_cities = [
                'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Darwin', 'Canberra',
                'Gold Coast', 'Newcastle', 'Wollongong', 'Cairns', 'Townsville', 'Geelong'
            ]
            
            for selector in location_selectors:
                location_elem = soup.select_one(selector)
                if location_elem:
                    location_text = location_elem.get_text(strip=True)
                    for city in australian_cities:
                        if city in location_text:
                            detailed_info['location'] = city
                            break
                    if detailed_info['location']:
                        break
            
            # If no location found in specific selectors, search the entire page
            if not detailed_info['location']:
                for city in australian_cities:
                    if city in page_text:
                        detailed_info['location'] = city
                        break
            
            print(f"✅ Extracted detailed info: {detailed_info['title'][:50]}...")
            
        except Exception as e:
            print(f"⚠️ Error extracting detailed job info: {str(e)}")
        
        return detailed_info
    
    def parse_salary(self, salary_text):
        """Parse salary string into structured data"""
        if not salary_text:
            return None, None, "AUD", "yearly"
        
        salary_min = None
        salary_max = None
        currency = "AUD"
        salary_type = "yearly"
        
        try:
            # Determine if it's hourly or yearly
            if any(word in salary_text.lower() for word in ['hour', 'hourly']):
                salary_type = "hourly"
            
            # Clean up the salary text
            cleaned = re.sub(r'[^\d,.-]', ' ', salary_text)
            
            # Extract salary range
            range_match = re.search(r'(\d+(?:,\d+)*)\s*-\s*(\d+(?:,\d+)*)', cleaned)
            if range_match:
                salary_min = float(range_match.group(1).replace(',', ''))
                salary_max = float(range_match.group(2).replace(',', ''))
            else:
                # Single salary value
                single_match = re.search(r'(\d+(?:,\d+)*)', cleaned)
                if single_match:
                    salary_min = float(single_match.group(1).replace(',', ''))
                    salary_max = salary_min
            
            # Handle 'k' notation
            if 'k' in salary_text.lower():
                if salary_min: salary_min *= 1000
                if salary_max: salary_max *= 1000
            
            print(f"✅ Parsed salary: {salary_min}-{salary_max} {currency} ({salary_type})")
            
        except Exception as e:
            print(f"⚠️ Error parsing salary '{salary_text}': {e}")
        
        return salary_min, salary_max, currency, salary_type
    
    def save_job_to_database(self, job_data):
        """Save job data to the database"""
        try:
            # Check if job already exists by URL
            if job_data.get('url'):
                existing_job = JobPosting.objects.filter(external_url=job_data['url']).first()
                if existing_job:
                    print(f"⏭️ Job already exists: {job_data['title']}")
                    return existing_job
            
            # Get or create company
            company_name = job_data.get('company', 'Michael Page')
            company_slug = slugify(company_name)
            
            company_obj, created = Company.objects.get_or_create(
                slug=company_slug,
                defaults={
                    'name': company_name,
                    'description': f'{company_name} - Jobs posted from Michael Page',
                    'website': 'https://www.michaelpage.com.au',
                    'company_size': 'large'
                }
            )
            
            # Get or create system user
            system_user, _ = User.objects.get_or_create(
                email='system@evoljobs.com',
                defaults={
                    'first_name': 'System',
                    'last_name': 'Scraper',
                    'is_staff': True
                }
            )
            
            # Create location if provided
            location_obj = None
            if job_data.get('location'):
                location_obj, _ = Location.objects.get_or_create(
                    name=job_data['location'],
                    country="Australia",
                    defaults={
                        'city': job_data['location'],
                        'state': '',
                    }
                )
            
            # Parse salary
            salary_min, salary_max, currency, salary_type = self.parse_salary(job_data.get('salary', ''))
            
            # Create unique slug
            base_slug = slugify(job_data['title'])
            unique_slug = base_slug
            counter = 1
            while JobPosting.objects.filter(slug=unique_slug).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            
            # Intelligent job categorization
            job_category = JobCategorizationService.categorize_job(
                title=job_data['title'],
                description=job_data.get('description', '')
            )
            
            # Create job posting
            job_obj = JobPosting.objects.create(
                title=job_data['title'],
                slug=unique_slug,
                description=job_data.get('description', 'No description available'),
                company=company_obj,
                posted_by=system_user,
                job_category=job_category,  # Automatically assigned category
                location=location_obj,
                salary_min=salary_min,
                salary_max=salary_max,
                salary_currency=currency,
                salary_type=salary_type,
                external_source="Michael Page",
                external_url=job_data.get('url', ''),
                job_type="full_time",
                status="active"
            )
            
            print(f"✅ Job saved successfully!")
            print(f"   Title: {job_obj.title}")
            print(f"   Company: {job_obj.company.name}")
            print(f"   Location: {job_obj.location.name if job_obj.location else 'Not specified'}")
            print(f"   Salary: {job_obj.salary_min}-{job_obj.salary_max} {job_obj.salary_currency} ({job_obj.salary_type})")
            print(f"   URL: {job_obj.external_url}")
            print(f"   Description: {len(job_obj.description)} characters")
            
            return job_obj
            
        except Exception as e:
            print(f"❌ Error saving job to database: {str(e)}")
            return None
    
    def scrape_multiple_jobs(self):
        """Main scraping method to fetch multiple jobs"""
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                print(f"🔄 Attempt {attempt + 1}/{max_retries}")
                
                # Setup driver
                self.setup_driver()
                
                # Navigate to jobs page
                print(f"🔍 Loading Michael Page jobs page...")
                self.driver.get(self.search_url)
                
                if not self.wait_for_page_load():
                    print("❌ Failed to load page")
                    return
                
                print(f"📄 Page loaded: {self.driver.title}")
                
                # Try to scroll to load more content
                self.scroll_to_load_more_content()
                
                # Find job elements and collect URLs first
                job_urls = self.collect_job_urls()
                
                if not job_urls:
                    print("❌ No job URLs found")
                    # Save page source for debugging
                    with open('debug_page.html', 'w', encoding='utf-8') as f:
                        f.write(self.driver.page_source)
                    print("💾 Page source saved to 'debug_page.html'")
                    return
                
                print(f"🎯 Found {len(job_urls)} job URLs. Will scrape up to {self.max_jobs_to_scrape} jobs.")
                
                # Process each job URL
                successful_jobs = 0
                failed_jobs = 0
                
                for i, job_url in enumerate(job_urls):
                    if self.jobs_scraped >= self.max_jobs_to_scrape:
                        print(f"🛑 Reached maximum jobs limit ({self.max_jobs_to_scrape})")
                        break
                    
                    try:
                        print(f"\n📋 Processing job {i + 1}/{len(job_urls)}")
                        print(f"🔗 URL: {job_url}")
                        
                        # Extract detailed information from job detail page
                        detailed_info = self.extract_detailed_job_info(job_url)
                        
                        if not detailed_info['title']:
                            print("❌ Could not extract job title from detail page")
                            failed_jobs += 1
                            continue
                        
                        # Create job data structure
                        job_data = {
                            'title': detailed_info['title'],
                            'company': detailed_info.get('company', 'Michael Page'),
                            'location': detailed_info.get('location', ''),
                            'salary': detailed_info.get('salary', ''),
                            'url': job_url,
                            'description': detailed_info.get('description', 'No description available'),
                            'posted_date': None
                        }
                        
                        # Ensure we have minimum required data
                        if not job_data['title'] or not self.is_valid_job_title(job_data['title']):
                            print("❌ No valid job title found")
                            failed_jobs += 1
                            continue
                        
                        # Save to database
                        job_obj = self.save_job_to_database(job_data)
                        
                        if job_obj:
                            successful_jobs += 1
                            self.jobs_scraped += 1
                            print(f"🎉 Successfully scraped and saved job: {job_obj.title}")
                        else:
                            failed_jobs += 1
                            print("❌ Failed to save job to database")
                        
                        # Add delay between jobs to be respectful and avoid rate limiting
                        delay = random.uniform(2, 5)  # Random delay between 2-5 seconds
                        print(f"⏱️ Waiting {delay:.1f} seconds before next job...")
                        time.sleep(delay)
                        
                    except Exception as e:
                        print(f"❌ Error processing job {i + 1}: {str(e)}")
                        failed_jobs += 1
                        continue
                
                print(f"\n📊 Scraping Summary:")
                print(f"   Total jobs found: {len(job_urls)}")
                print(f"   Successfully scraped: {successful_jobs}")
                print(f"   Failed: {failed_jobs}")
                print(f"   Total jobs in database: {JobPosting.objects.count()}")
                
                # If we got some jobs, consider it successful
                if successful_jobs > 0:
                    print("✅ Scraping completed successfully!")
                    break
                else:
                    print(f"⚠️ No jobs scraped in attempt {attempt + 1}")
                    if attempt < max_retries - 1:
                        print("🔄 Retrying...")
                        if self.driver:
                            self.driver.quit()
                        time.sleep(5)  # Wait before retry
                    else:
                        print("❌ All retry attempts failed")
                        
            except Exception as e:
                print(f"❌ Unexpected error during scraping: {str(e)}")
                import traceback
                traceback.print_exc()
                
                if attempt < max_retries - 1:
                    print("🔄 Retrying due to error...")
                    if self.driver:
                        self.driver.quit()
                    time.sleep(5)  # Wait before retry
                else:
                    print("❌ All retry attempts failed")
            
            finally:
                if self.driver:
                    self.driver.quit()
                    print("🔚 Browser closed")
    
    def collect_job_urls(self):
        """Collect all job URLs from the listing page without visiting them"""
        job_urls = []
        
        try:
            # Find job elements
            job_elements, working_selector = self.find_job_elements()
            
            if not job_elements:
                return []
            
            print(f"🔍 Collecting URLs from {len(job_elements)} job elements...")
            
            # Extract URLs from all elements at once
            for i, job_element in enumerate(job_elements):
                try:
                    # Get HTML content
                    html_content = job_element.get_attribute('innerHTML')
                    if not html_content:
                        continue
                    
                    # Parse with BeautifulSoup
                    soup = BeautifulSoup(html_content, 'html.parser')
                    
                    # Find job URL
                    url_selectors = [
                        'a[href*="/job"]',
                        'a[href*="/position"]', 
                        'a[href*="/jobs"]',
                        'a[href*="/careers"]',
                        'a[href]'
                    ]
                    
                    job_url = None
                    for selector in url_selectors:
                        url_elements = soup.select(selector)
                        for elem in url_elements:
                            href = elem.get('href', '')
                            if href and ('/job' in href or '/position' in href):
                                if href.startswith('/'):
                                    job_url = self.base_url + href
                                elif href.startswith('http'):
                                    job_url = href
                                break
                        if job_url:
                            break
                    
                    if job_url and job_url not in job_urls:
                        job_urls.append(job_url)
                        print(f"✅ Collected URL {len(job_urls)}: {job_url}")
                    
                except Exception as e:
                    print(f"⚠️ Error collecting URL from element {i + 1}: {str(e)[:30]}...")
                    continue
            
            print(f"🎯 Successfully collected {len(job_urls)} unique job URLs")
            return job_urls
            
        except Exception as e:
            print(f"❌ Error collecting job URLs: {str(e)}")
            return []

def fetch_michael_page_job(max_jobs=100):
    """Main function to fetch multiple Michael Page jobs"""
    scraper = MichaelPageScraper(max_jobs=max_jobs)
    scraper.scrape_multiple_jobs()

if __name__ == "__main__":
    # Allow command line argument for number of jobs
    import sys
    max_jobs = 100
    if len(sys.argv) > 1:
        try:
            max_jobs = int(sys.argv[1])
        except ValueError:
            print("Invalid number of jobs. Using default: 100")
    
    print(f"🚀 Starting scraper to fetch up to {max_jobs} jobs...")
    fetch_michael_page_job(max_jobs) 
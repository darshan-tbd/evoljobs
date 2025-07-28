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
import time
import sys

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
from django.utils import timezone

User = get_user_model()

def wait_like_human(min_s=1.2, max_s=3.5):
    """Sleep randomly to mimic human behavior."""
    time.sleep(random.uniform(min_s, max_s))

def fetch_probonoaustralia_jobs():
    """
    🎯 Pro Bono Australia Live Job Scraper
    ==================================================
    This script will scrape 30 random live job postings from Pro Bono Australia
    and save them to your JobPilot database with all fields populated.
    ==================================================
    """
    print("🎯 Pro Bono Australia Live Job Scraper")
    print("=" * 50)
    print("This script will scrape 30 random live job postings from Pro Bono Australia")
    print("and save them to your JobPilot database with all fields populated.")
    print("=" * 50)
    
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    # Add user agent to avoid detection
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(options=options)

    try:
        url = "https://www.probonoaustralia.com.au/jobs/"
        print(f"🚀 Starting Pro Bono Australia Scraper - Target: 30 Random Jobs\n")
        print(f"🔍 Loading Pro Bono Australia careers page: {url}")
        driver.get(url)

        # Wait longer for page to load with human-like behavior
        wait_like_human(8.0, 12.0)
        print(f"📄 Page loaded: {driver.title}")

        # Try multiple selectors - Pro Bono Australia uses carousel format
        job_elements = []
        selectors_to_try = [
            ".owl-item .item a",  # Carousel job links
            ".featured-jobs-carousel-description",  # Job titles in carousel
            ".owl-item a",
            ".job-listing",
            ".job-item",
            ".job-card",
            "article.job",
            "div.job",
            "[class*='job']",
            ".listing-item",
            ".vacancy",
            ".position",
            ".opportunity",
            "article",
            ".post",
            "[data-testid*='job']",
            ".search-result"
        ]
        
        for selector in selectors_to_try:
            try:
                print(f"🔍 Trying selector: {selector}")
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                job_elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if job_elements:
                    print(f"✅ Found {len(job_elements)} jobs using selector: {selector}")
                    working_selector = selector
                    break
            except Exception as e:
                print(f"❌ Selector {selector} failed: {str(e)[:50]}...")
                continue
        
        if not job_elements:
            print("❌ No job elements found with any selector. Page might have changed.")
            # Save page source for debugging
            with open('probonoaustralia_debug_page.html', 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
            print("💾 Page source saved to 'probonoaustralia_debug_page.html' for inspection")
            return
        
        # Always save page source for debugging
        with open('probonoaustralia_debug_page.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        print("🔍 Page source saved to 'probonoaustralia_debug_page.html' for debugging")

        # Parse job list page and get all job cards
        soup = BeautifulSoup(driver.page_source, "html.parser")
        job_cards = soup.select(working_selector)
        
        if not job_cards:
            print("❌ No job cards found with working selector.")
            return
        
        print(f"🎲 Found {len(job_cards)} total jobs, will process 30 random jobs")
        
        # Shuffle the job cards to get random selection
        random.shuffle(job_cards)
        
        # Process up to 30 jobs
        jobs_to_process = min(30, len(job_cards))
        successful_jobs = 0
        processed_urls = set()  # To avoid duplicates
        
        for i, job_card in enumerate(job_cards[:jobs_to_process * 2]):  # Try more jobs in case some fail
            if successful_jobs >= 30:
                break
                
            print(f"\n🔄 Processing job {successful_jobs + 1}/30 (attempt {i + 1})")
            
            # Add human-like delay between processing jobs
            wait_like_human(2.0, 4.0)
            
            try:
                # Extract job data using Pro Bono Australia specific logic
                job_data = extract_job_data(job_card, driver, url, processed_urls)
                
                if job_data:
                    # Save to database using JobPosting model
                    try:
                        job_obj = save_job_to_database(job_data)
                        
                        if job_obj:
                            print(f"✅ Job {successful_jobs + 1} saved successfully!")
                            print(f"   Title: {job_obj.title}")
                            print(f"   Company: {job_obj.company.name}")
                            print(f"   Location: {job_obj.location.name if job_obj.location else 'Not specified'}")
                            print(f"   Salary: {job_obj.salary_min}-{job_obj.salary_max} {job_obj.salary_currency} ({job_obj.salary_type})")
                            
                            successful_jobs += 1
                            processed_urls.add(job_data['url'])
                            
                            # Human-like delay after successful save
                            wait_like_human(1.5, 2.5)
                        else:
                            print("❌ Failed to save job to database")
                        
                    except Exception as e:
                        print(f"❌ Error saving job to database: {str(e)}")
                else:
                    print(f"⚠️ Skipped job due to extraction issues")
                    
            except Exception as e:
                print(f"❌ Error processing job: {str(e)}")
                continue
        
        print(f"\n🎉 Successfully processed {successful_jobs} jobs out of {jobs_to_process} attempted")

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
    finally:
        driver.quit()
        print("🔚 Browser closed")

def extract_job_data(job_card, driver, base_url, processed_urls):
    """Extract job data from a Pro Bono Australia job card"""
    
    # Debug: Print job card HTML structure
    card_html = str(job_card)[:800]
    print(f"🔍 Job card HTML preview: {card_html}...")
    
    # Debug: Look for all text content in the card
    all_text = job_card.get_text(separator=" | ", strip=True)
    print(f"📝 Job card text content: {all_text[:300]}...")
    
    # Check if this is a carousel item with location|title format  
    carousel_text = job_card.get_text(strip=True)
    print(f"🔍 Carousel text: '{carousel_text}'")
    
    # Since the pipe character gets stripped, we need to use pattern matching
    # Pattern: Location (usually 1-2 words) followed by job title
    # Common locations: Melbourne CBD, Sydney CBD, Box Hill, Parkville, Ararat, etc.
    location_patterns = [
        r'^(Melbourne CBD|Sydney CBD|Brisbane CBD|Perth CBD|Adelaide CBD)',
        r'^(Box Hill|St Kilda|South Yarra|North Melbourne|West Melbourne)',
        r'^(Parkville|Carlton|Richmond|Fitzroy|Collingwood)',
        r'^(Ararat|Ballarat|Bendigo|Geelong|Warrnambool)',
        r'^(Merimbula|Corryong|Morwell|Heathcote)',
        r'^(MELBOURNE|SYDNEY|BRISBANE|PERTH|ADELAIDE)',
        r'^([A-Z][a-z]+\s+[A-Z][a-z]+)',  # Two title-case words
        r'^([A-Z][a-z]+)',  # Single title-case word
    ]
    
    title = None
    location = "Australia"
    
    for pattern in location_patterns:
        match = re.search(pattern, carousel_text)
        if match:
            potential_location = match.group(1)
            potential_title = carousel_text[len(potential_location):].strip()
            
            print(f"🔍 Pattern matched - Location: '{potential_location}', Title: '{potential_title}'")
            
            # Validate the title looks reasonable
            if (potential_title and len(potential_title) > 5 and 
                not any(skip in potential_title.lower() for skip in [
                    'featured jobs', 'changemaker', 'career advice', 'make impact',
                    'search jobs', 'about us', 'find jobs', 'all jobs'
                ]) and
                # Check if it contains typical job title words
                any(job_word in potential_title.lower() for job_word in [
                    'manager', 'director', 'officer', 'coordinator', 'specialist',
                    'executive', 'assistant', 'analyst', 'advisor', 'lead', 'ceo',
                    'solicitor', 'database', 'engagement', 'support', 'program'
                ])):
                title = potential_title
                location = potential_location
                print(f"✅ Extracted from pattern: '{title}' in '{location}'")
                break
            else:
                print(f"❌ Title validation failed for: '{potential_title}'")
    
    # If pattern matching failed, try standard selectors
    if not title:
        title_selectors = [
            ".featured-jobs-carousel-description",
            "h3.job-title",
            "h2.job-title", 
            ".job-title",
            "h3[class*='title']",
            "h2[class*='title']", 
            "h1[class*='title']",
            "[class*='job-title']",
            ".title",
            "h3",
            "h2",
            "h1"
        ]
        
        for selector in title_selectors:
            title_elem = job_card.select_one(selector)
            if title_elem:
                title_text = title_elem.get_text(strip=True)
                # Skip generic terms
                if title_text and title_text.lower() not in ['view job', 'read more', 'apply now', 'see details', 'job details']:
                    title = title_text
                    break
        
        # If no direct title found, try from links but filter out generic terms
        if not title:
            link_selectors = [
                "h3 a", 
                "h2 a",
                "h1 a",
                "a[class*='title']",
                ".title a",
                "a"
            ]
            
            for selector in link_selectors:
                title_elem = job_card.select_one(selector)
                if title_elem:
                    title_text = title_elem.get_text(strip=True)
                    # Skip generic terms and short text
                    if (title_text and len(title_text) > 10 and 
                        title_text.lower() not in ['view job', 'read more', 'apply now', 'see details', 'job details', 'view details']):
                        title = title_text
                        break

    if not title:
        print("❌ Could not extract job title")
        return None

    print(f"✅ Successfully extracted title: '{title}'")

    # STEP 2: Extract job URL for individual job page
    job_url = None
    
    # The job_card itself is the <a> element, so get href directly
    if job_card.name == 'a' and job_card.get('href'):
        href = job_card.get('href')
        if href.startswith('http'):
            job_url = href
        elif href.startswith('/'):
            job_url = base_url.rstrip('/') + href
        else:
            job_url = base_url.rstrip('/') + '/' + href
        print(f"✅ Found job URL from element itself: {job_url}")
    else:
        # Fallback: Try to find job page URL inside the element
        url_selectors = [
            "a[href*='/jobs/']",
            "[href*='job']",
            "a"
        ]
        
        for url_selector in url_selectors:
            url_elem = job_card.select_one(url_selector)
            if url_elem and url_elem.get('href'):
                href = url_elem.get('href')
                if href.startswith('http'):
                    job_url = href
                elif href.startswith('/'):
                    job_url = base_url.rstrip('/') + href
                else:
                    job_url = base_url.rstrip('/') + '/' + href
                
                # Validate URL
                if '/jobs/' in job_url and job_url != base_url:
                    print(f"✅ Found valid job URL: {job_url}")
                    break
                else:
                    print(f"❌ Invalid job URL: {job_url}")
    
    print(f"🔗 Final job URL: {job_url}")
    
    # Skip this job if it doesn't have a proper individual job page URL or is duplicate
    if not job_url or job_url == base_url or job_url in processed_urls:
        print(f"❌ Skipping job - URL issue: url={job_url}, base_url={base_url}, in_processed={job_url in processed_urls if job_url else 'N/A'}")
        return None
    
    print(f"✅ Job URL validation passed")
    
    # Location was already extracted above in the carousel parsing
    if not location or location == "Australia":
        # Try additional selectors as fallback
        location_elem = (job_card.select_one(".job-location") or
                        job_card.select_one(".location") or
                        job_card.select_one("[class*='location']") or
                        job_card.select_one(".job-meta .location") or
                        job_card.select_one(".meta-location"))
        
        if location_elem:
            location = location_elem.get_text(strip=True)
            # Clean up common location suffixes but keep the specific location
            location = re.sub(r'\s*,?\s*(Australia|NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\s*$', '', location, flags=re.IGNORECASE)
            location = location.strip()
        
        if not location:
            location = "Australia"  # Default for Pro Bono Australia

    # STEP 3: Extract company - initially set to default for Pro Bono jobs
    company = "Non-Profit Organization"

    # Basic job data structure
    job_data = {
        'title': title,
        'company': company,
        'location': location, 
        'url': job_url,
        'description': '',
        'posted_date': timezone.now().date(),  # Default to today
        'salary': '',
        'job_type': 'Full-time',
        'tags': ['NFP', 'Not-for-profit'],
        'visa_required': False,
        'source': 'Pro Bono Australia'
    }

    print(f"📋 Extracted job: {title} | {company} | {location}")

    # STEP 4: Visit individual job page for more details
    try:
        print(f"🔗 Visiting job detail page: {job_url}")
        driver.get(job_url)
        time.sleep(random.uniform(2, 4))  # Human-like delay
        
        # Parse the job detail page
        detail_soup = BeautifulSoup(driver.page_source, "html.parser")
        
        # Save individual job page for debugging
        job_page_filename = f"job_page_debug_{len(processed_urls)}.html"
        with open(job_page_filename, 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        print(f"💾 Job page saved to '{job_page_filename}' for debugging")
        
        # Extract company name from detail page first
        detail_text = detail_soup.get_text()
        
        # Look for company name patterns
        company_patterns = [
            r'Organisation\s*:?\s*([A-Za-z\s&.,()-]+?)(?:Location|About)',
            r'Organisation Name\s*:?\s*([A-Za-z\s&.,()-]+?)(?:About|Location)',
            r'Organization\s*:?\s*([A-Za-z\s&.,()-]+?)(?:Location|About)',
            r'Company\s*:?\s*([A-Za-z\s&.,()-]+?)(?:Location|About)',
            r'Employer\s*:?\s*([A-Za-z\s&.,()-]+?)(?:Location|About)'
        ]
        
        for pattern in company_patterns:
            match = re.search(pattern, detail_text, re.IGNORECASE)
            if match:
                potential_company = match.group(1).strip()
                # Clean up and validate
                if (potential_company and len(potential_company) > 2 and 
                    len(potential_company) < 100 and
                    not any(skip in potential_company.lower() for skip in [
                        'apply now', 'click here', 'please', 'contact us', 'more info'
                    ])):
                    company = potential_company
                    job_data['company'] = company
                    print(f"✅ Found company from detail page: '{company}'")
                    break
        
        # Extract job description - Pro Bono Australia specific selectors with improved fallbacks
        desc_selectors = [
            # Primary content areas
            ".job-description",
            ".job-content", 
            ".job-details",
            ".description",
            "[class*='description']",
            ".content",
            ".job-summary",
            "[class*='content']",
            ".post-content",
            ".entry-content",
            ".job-info",
            ".job-body",
            ".vacancy-details",
            ".position-details",
            ".role-description",
            
            # WordPress/page structure selectors
            "article",
            "main",
            ".main-content",
            "#content",
            ".wpb_wrapper",
            ".elementor-widget-container",
            ".job-posting-details",
            
            # More specific Pro Bono Australia selectors
            ".single-content",
            ".page-content",
            ".job-single-content",
            ".post-body",
            ".the-content",
            "#main-content",
            ".site-content",
            ".primary-content"
        ]
        
        description = ""
        desc_elem = None
        
        # Try each selector to find job description
        for desc_selector in desc_selectors:
            desc_elem = detail_soup.select_one(desc_selector)
            if desc_elem:
                description = desc_elem.get_text(separator='\n', strip=True)
                # More lenient validation - check for meaningful content
                if len(description) > 200 and ('about' in description.lower() or 'role' in description.lower() or 'opportunity' in description.lower() or 'position' in description.lower()):
                    print(f"✅ Found description using selector: {desc_selector} ({len(description)} chars)")
                    break
                else:
                    print(f"⚠️ Description validation failed from: {desc_selector} (length: {len(description)})")
                    description = ""
        
        # Enhanced fallback with better text extraction
        if not description:
            print("🔍 Using enhanced fallback for description extraction")
            page_text = detail_soup.get_text(separator='\n', strip=True)
            
            # Try to find content between common markers - expanded list
            description_markers = [
                ('About the role', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('About the position', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('Job description', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('Role description', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('Position description', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('The Opportunity', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('The Organisation', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('About this role', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('We are looking for', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('Job Summary', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('Overview', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss']),
                ('Prominent', ['How to apply', 'Apply now', 'Contact', 'For more information', 'If you have', 'To confidentially discuss'])  # For jobs starting with org description
            ]
            
            for start_marker, end_markers in description_markers:
                if start_marker in page_text:
                    start_idx = page_text.find(start_marker)
                    end_idx = len(page_text)
                    
                    # Find the earliest end marker
                    for end_marker in end_markers:
                        marker_idx = page_text.find(end_marker, start_idx)
                        if marker_idx != -1 and marker_idx < end_idx:
                            end_idx = marker_idx
                    
                    # If no end marker found, take much more content (not limited to 2000 chars)
                    if end_idx == len(page_text):
                        end_idx = min(start_idx + 8000, len(page_text))  # Increased from 2000 to 8000
                    
                    description = page_text[start_idx:end_idx].strip()
                    if len(description) > 200:  # Reduced minimum from previous checks
                        print(f"✅ Found description using marker: {start_marker} ({len(description)} chars)")
                        break
            
            # Ultimate fallback: try to extract meaningful content from the page
            if not description or len(description) < 100:
                print("🔍 Using ultimate fallback for description")
                # Remove navigation, headers, footers by looking for job-related content
                lines = page_text.split('\n')
                job_content_lines = []
                collecting = False
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                        
                    # Start collecting when we hit job-related content
                    if (any(keyword in line.lower() for keyword in ['about the role', 'job description', 'position', 'responsibilities', 'requirements', 'duties', 'we are looking for', 'the successful candidate']) or
                        collecting):
                        collecting = True
                        job_content_lines.append(line)
                        
                        # Stop when we hit application/contact info
                        if any(stop_word in line.lower() for stop_word in ['apply now', 'how to apply', 'contact', 'for more information', 'applications close', 'closing date']):
                            break
                
                if job_content_lines:
                    description = '\n'.join(job_content_lines)
                else:
                    # Last resort: take a reasonable chunk from the middle of the page
                    description = page_text[len(page_text)//4:len(page_text)//2]
        
        # Clean up and validate description
        if description:
            # Remove excessive whitespace
            description = re.sub(r'\n\s*\n', '\n\n', description)
            description = re.sub(r'\s+', ' ', description)
            # Don't limit length - capture the full description
            # Only limit if extremely long (over 10,000 chars) to prevent database issues
            if len(description) > 10000:
                description = description[:10000] + "... [Content truncated]"
            job_data['description'] = description
            print(f"✅ Final description length: {len(description)} characters")
        else:
            job_data['description'] = "Job description not available"
            print("❌ Could not extract job description")

        # Update location from detail page if better one found
        location_patterns = [
            r'Location\s*:?\s*([A-Za-z\s,()]+?)(?:Work type|Profession|About)',
            r'Location\s*:?\s*([A-Za-z\s,()]+?)(?:\n|\r)',
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, detail_text, re.IGNORECASE)
            if match:
                potential_location = match.group(1).strip()
                # Clean up and validate location
                potential_location = re.sub(r'\s*,?\s*(Australia|NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\s*$', '', potential_location, flags=re.IGNORECASE)
                potential_location = potential_location.strip()
                
                if (potential_location and len(potential_location) > 2 and 
                    len(potential_location) < 50 and
                    potential_location.lower() not in ['location', 'australia']):
                    location = potential_location
                    job_data['location'] = location
                    print(f"✅ Updated location from detail page: '{location}'")
                    break
        
        # Extract salary information specific to Pro Bono Australia - Enhanced patterns
        print("🔍 Extracting salary information...")
        
        # Very strict salary patterns - only match with clear salary context
        salary_patterns = [
            # Must have salary context words nearby
            r'salary\s*:?\s*\$(\d{2,3}),(\d{3})\s*(?:-|to)\s*\$(\d{2,3}),(\d{3})',  # salary: $XX,XXX - $XX,XXX
            r'salary\s*:?\s*\$(\d{2,3}),(\d{3})',  # salary: $XX,XXX
            r'remuneration\s*:?\s*\$(\d{2,3}),(\d{3})\s*(?:-|to)\s*\$(\d{2,3}),(\d{3})',  # remuneration: $XX,XXX - $XX,XXX
            r'remuneration\s*:?\s*\$(\d{2,3}),(\d{3})',  # remuneration: $XX,XXX
            r'package\s*:?\s*\$(\d{2,3}),(\d{3})\s*(?:-|to)\s*\$(\d{2,3}),(\d{3})',  # package: $XX,XXX - $XX,XXX
            r'package\s*:?\s*\$(\d{2,3}),(\d{3})',  # package: $XX,XXX
            r'compensation\s*:?\s*\$(\d{2,3}),(\d{3})\s*(?:-|to)\s*\$(\d{2,3}),(\d{3})',  # compensation: $XX,XXX - $XX,XXX
            r'compensation\s*:?\s*\$(\d{2,3}),(\d{3})',  # compensation: $XX,XXX
            
            # Annual salary with explicit context
            r'(\d{2,3}),(\d{3})\s*per\s*annum',  # XX,XXX per annum
            r'(\d{2,3})k\s*per\s*annum',  # XXk per annum
            r'annual\s*salary\s*:?\s*\$?(\d{2,3}),?(\d{3})',  # annual salary: XX,XXX
            
            # Hourly rates with context
            r'\$(\d{2,3})\s*per\s*hour',  # $XX per hour
            r'\$(\d{2,3})\s*/\s*hour',  # $XX/hour
        ]
        
        salary_text = detail_text.lower()
        salary = ""
        
        # Skip volunteer detection entirely - only show salary if explicitly mentioned
        # Don't assume jobs are volunteer positions just because no salary is mentioned
        
        # Try to find salary information
        for i, pattern in enumerate(salary_patterns):
            match = re.search(pattern, detail_text, re.IGNORECASE)
            if match:
                print(f"✅ Salary pattern {i+1} matched: {match.group(0)}")
                groups = match.groups()
                
                # Handle different pattern formats
                if len(groups) >= 4:  # Range format with commas
                    salary = f"${groups[0]},{groups[1]} - ${groups[2]},{groups[3]}"
                elif len(groups) == 3:  # Single amount with comma or range without $
                    if groups[2]:  # This is a range
                        salary = f"${groups[0]},{groups[1]} - ${groups[2]}"
                    else:  # Single amount
                        salary = f"${groups[0]},{groups[1]}"
                elif len(groups) == 2:  # Single amount with comma
                    salary = f"${groups[0]},{groups[1]}"
                elif len(groups) == 1:  # Single number (hourly, daily, or k format)
                    if 'hour' in match.group(0).lower() or '/hr' in match.group(0).lower():
                        salary = f"${groups[0]}/hour"
                    elif 'day' in match.group(0).lower() or '/day' in match.group(0).lower():
                        salary = f"${groups[0]}/day"
                    elif 'k' in match.group(0).lower():
                        salary = f"${groups[0]}k"
                    else:
                        salary = f"${groups[0]}"
                
                break
        
        # No additional salary detection - only use strict patterns above
        # This prevents picking up random numbers like dates, IDs, etc.
        
        # Final salary assignment - leave empty if no actual salary found
        if not salary:
            salary = ""
            print("❌ No salary information found - leaving empty")
        
        job_data['salary'] = salary
        if salary:
            print(f"✅ Final salary: {salary}")
        else:
            print("✅ Final salary: (empty - no salary mentioned)")

        # Determine job type from detail page
        job_type_keywords = {
            'full-time': ['full-time', 'full time', 'permanent', 'ongoing'],
            'part-time': ['part-time', 'part time'],
            'contract': ['contract', 'temporary', 'fixed-term', 'term'],
            'casual': ['casual', 'flexible'],
            'volunteer': ['volunteer', 'unpaid', 'pro bono'],
            'internship': ['intern', 'graduate', 'trainee']
        }
        
        detected_job_type = 'Full-time'  # Default
        detail_text_lower = detail_text.lower()
        
        for job_type, keywords in job_type_keywords.items():
            if any(keyword in detail_text_lower for keyword in keywords):
                detected_job_type = job_type.title()
                break
        
        job_data['job_type'] = detected_job_type

        # NFP-specific tags based on content analysis
        nfp_tags = ['NFP', 'Not-for-profit']
        nfp_keywords = {
            'healthcare': ['health', 'medical', 'hospital', 'clinic', 'care'],
            'education': ['education', 'school', 'university', 'teaching', 'learning'],
            'community': ['community', 'social', 'welfare', 'support'],
            'environment': ['environment', 'sustainability', 'climate', 'conservation'],
            'arts': ['arts', 'culture', 'creative', 'museum', 'gallery'],
            'advocacy': ['advocacy', 'rights', 'justice', 'legal'],
            'fundraising': ['fundraising', 'donations', 'grants', 'philanthropy'],
            'volunteering': ['volunteer', 'community service'],
            'research': ['research', 'innovation', 'development']
        }
        
        for tag, keywords in nfp_keywords.items():
            if any(keyword in detail_text_lower for keyword in keywords):
                nfp_tags.append(tag.title())
        
        job_data['tags'] = list(set(nfp_tags))  # Remove duplicates

        # Visa requirements - NFP jobs often require Australian work rights
        visa_keywords = ['citizen', 'permanent resident', 'work rights', 'eligible to work']
        job_data['visa_required'] = any(keyword in detail_text_lower for keyword in visa_keywords)

    except Exception as e:
        print(f"⚠️ Error accessing job detail page: {e}")
        # Use basic data we already extracted
        pass

    # Final summary of extracted data
    print("\n📊 FINAL EXTRACTED DATA SUMMARY:")
    print(f"   📝 Title: {job_data['title']}")
    print(f"   🏢 Company: {job_data['company']}")
    print(f"   📍 Location: {job_data['location']}")
    print(f"   🔗 URL: {job_data['url']}")
    print(f"   💰 Salary: {job_data['salary']}")
    print(f"   📄 Description Length: {len(job_data['description'])} characters")
    print(f"   🏷️ Job Type: {job_data['job_type']}")
    print(f"   🏷️ Tags: {job_data['tags']}")
    print(f"   🛂 Visa Required: {job_data['visa_required']}")
    print("─" * 50)

    return job_data

def save_job_to_database(job_data):
    """Save job data to the JobPosting model"""
    try:
        # Check if job already exists by URL
        if job_data.get('url'):
            existing_job = JobPosting.objects.filter(external_url=job_data['url']).first()
            if existing_job:
                print(f"⏭️ Job already exists: {job_data['title']}")
                return existing_job
        
        # Get or create company
        company_name = job_data.get('company', 'Non-Profit Organization')
        company_slug = slugify(company_name)
        
        company_obj, created = Company.objects.get_or_create(
            slug=company_slug,
            defaults={
                'name': company_name,
                'description': f'{company_name} - Jobs posted from Pro Bono Australia',
                'website': 'https://www.probonoaustralia.com.au',
                'company_size': 'medium'
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
        if job_data.get('location') and job_data['location'] != 'Australia':
            location_obj, _ = Location.objects.get_or_create(
                name=job_data['location'],
                country="Australia",
                defaults={
                    'city': job_data['location'],
                    'state': '',
                }
            )
        
        # Parse salary
        salary_min, salary_max, currency, salary_type = parse_salary(job_data.get('salary', ''))
        
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
            external_source="Pro Bono Australia",
            external_url=job_data.get('url', ''),
            job_type="full_time",
            status="active"
        )
        
        return job_obj
        
    except Exception as e:
        print(f"❌ Error saving job to database: {str(e)}")
        return None

def parse_salary(salary_text):
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

def parse_date(date_str):
    """
    Converts various 'posted date' strings like '6 days ago', 'Jun 30, 2025', etc.
    """
    if not date_str:
        return None
        
    date_str = date_str.strip().lower()
    
    try:
        # Handle relative dates like "3 days ago", "1 week ago", etc.
        if "ago" in date_str:
            if "today" in date_str or "0 day" in date_str:
                return datetime.now().date()
            elif "yesterday" in date_str or "1 day" in date_str:
                return (datetime.now() - timedelta(days=1)).date()
            elif "day" in date_str:
                days = int(date_str.split()[0])
                return (datetime.now() - timedelta(days=days)).date()
            elif "week" in date_str:
                weeks = int(date_str.split()[0])
                return (datetime.now() - timedelta(weeks=weeks)).date()
            elif "month" in date_str:
                months = int(date_str.split()[0])
                return (datetime.now() - timedelta(days=months*30)).date()
        
        # Try different date formats
        date_formats = [
            "%d %B %Y",     # 30 December 2024
            "%B %d, %Y",    # December 30, 2024
            "%d/%m/%Y",     # 30/12/2024
            "%m/%d/%Y",     # 12/30/2024
            "%Y-%m-%d",     # 2024-12-30
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except:
                continue
                
    except Exception as e:
        print(f"⚠️ Could not parse date '{date_str}': {e}")
    
    return None

def main():
    fetch_probonoaustralia_jobs()

if __name__ == "__main__":
    main()

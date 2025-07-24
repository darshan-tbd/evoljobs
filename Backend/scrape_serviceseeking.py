"""
ServiceSeeking Job Scraper - Enhanced Version

This script scrapes job postings from ServiceSeeking.com.au with improved extraction for:
- Company/Client names: Enhanced selectors and pattern matching
- Job descriptions: Multiple fallback methods and better content extraction
- Salary/Budget information: ServiceSeeking-specific patterns for project budgets
- Comprehensive debugging and error handling

Fixed issues:
- Missing description content extraction
- Missing salary/budget information
- Generic company names instead of actual clients
- Better validation and fallback methods
"""

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
from apps.companies.models import Company
from apps.core.models import Location
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils import timezone

User = get_user_model()

def wait_like_human(min_s=1.2, max_s=3.5):
    """Sleep randomly to mimic human behavior."""
    time.sleep(random.uniform(min_s, max_s))

def fetch_serviceseeking_all_jobs():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    driver = webdriver.Chrome(options=options)

    try:
        url = "https://www.serviceseeking.com.au/job-requests/"
        print(f"🔍 Loading ServiceSeeking job requests page...")
        driver.get(url)

        # Wait longer for page to load with human-like behavior
        wait_like_human(8.0, 12.0)
        print(f"📄 Page loaded: {driver.title}")

        # Try multiple selectors as the page structure might have changed
        job_elements = []
        selectors_to_try = [
            ".task-tile",
            ".task-item", 
            ".job-tile",
            ".job-request",
            ".job-item",
            ".request-item",
            ".task-card",
            ".job-card",
            ".job-listing",
            ".task-listing",
            ".job",
            ".task",
            ".request",
            ".service-request",
            "[class*='task']",
            "[class*='job']",
            "[class*='request']",
            "div[class*='task']",
            "div[class*='job']",
            "article[class*='job']",
            "article[class*='task']",
            "div[class*='request']",
            ".listing-item",
            ".item",
            "[data-testid*='job']",
            "[data-testid*='task']"
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
            with open('serviceseeking_debug_page.html', 'w', encoding='utf-8') as f:
                f.write(driver.page_source)
            print("💾 Page source saved to 'serviceseeking_debug_page.html' for inspection")
            return

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
                # Extract job data using same logic as single job scraper
                job_data = extract_job_data(job_card, driver, url, processed_urls)
                
                if job_data:
                    # Save to database using JobPosting model
                    try:
                        job_obj = save_job_to_database(job_data)
                        
                        if job_obj:
                            print(f"\n✅ Job {successful_jobs + 1} saved successfully!")
                            print(f"   Title: {job_obj.title}")
                            print(f"   Company: {job_obj.company.name}")
                            print(f"   Location: {job_obj.location.name if job_obj.location else 'Not specified'}")
                            print(f"   Salary: {job_obj.salary_min}-{job_obj.salary_max} {job_obj.salary_currency} ({job_obj.salary_type})")
                            print(f"   Description: {len(job_obj.description)} characters")
                            print(f"   URL: {job_obj.external_url}")
                            
                            successful_jobs += 1
                            processed_urls.add(job_data['job_url'])
                            
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
    """Extract job data from a job card using ServiceSeeking-specific selectors"""
    
    # STEP 1: Extract job title - prioritize actual titles over generic link text
    title = None
    
    # Try to find actual job title first (ServiceSeeking-specific selectors)
    title_selectors = [
        ".task-title",
        ".job-title",
        ".request-title",
        ".title",
        "h3",
        "h2", 
        "h1",
        ".job-name",
        ".task-name",
        ".service-title",
        "[class*='task-title']",
        "[class*='title']",
        "[class*='job-title']",
        "[class*='request-title']",
        "a[class*='title']",
        "h3 a",
        "h2 a"
    ]
    
    for selector in title_selectors:
        title_elem = job_card.select_one(selector)
        if title_elem:
            title_text = title_elem.get_text(strip=True)
            # Skip generic terms
            if title_text and title_text.lower() not in ['view job', 'read more', 'apply now', 'see details', 'job details', 'view request']:
                title = title_text
                break
    
    # If no direct title found, try from links but filter out generic terms
    if not title:
        link_selectors = [
            "a[href*='job-request']",
            "a[href*='request']",
            "a[href*='job']",
            "a"
        ]
        
        for selector in link_selectors:
            title_elem = job_card.select_one(selector)
            if title_elem:
                title_text = title_elem.get_text(strip=True)
                # Skip generic terms and short text
                if (title_text and len(title_text) > 10 and 
                    title_text.lower() not in ['view job', 'read more', 'apply now', 'see details', 'job details', 'view details', 'view request']):
                    title = title_text
                    break
    
    # STEP 2: Extract job URL separately
    job_url = None
    link_selectors = [
        "a[href*='/task/']",
        "a[href*='task-requests']",
        "a[href*='job-request']",
        "a[href*='request']",
        "a[href*='/job/']",
        "h3 a",
        "h2 a", 
        "a"
    ]
    
    for selector in link_selectors:
        elems = job_card.select(selector)
        for elem in elems:
            href = elem.get("href", "")
            if href and ("/task/" in href or "task-request" in href or "job-request" in href or "request" in href or "/job/" in href):
                if href.startswith("http"):
                    job_url = href
                elif href.startswith("/"):
                    job_url = "https://www.serviceseeking.com.au" + href
                else:
                    job_url = "https://www.serviceseeking.com.au/" + href
                break
        if job_url:
            break
    
    # Fallback title if none found
    if not title:
        title = "ServiceSeeking Request"
    
    # Skip this job if it doesn't have a proper individual job page URL or is duplicate
    if not job_url or job_url == base_url or job_url in processed_urls:
        return None

    # Enhanced location extraction for ServiceSeeking - avoid contamination
    location = ""
    print("🌍 Searching for location information...")
    
    # First try to get location from job card only (avoid contamination)
    job_card_text = job_card.get_text()
    
    # Try specific location patterns in the job card text
    location_patterns = [
        r'required in ([^,\n]+,\s*[A-Z]{2,3})',  # "required in Albanvale, VIC"
        r'needed in ([^,\n]+,\s*[A-Z]{2,3})',    # "needed in Sydney, NSW"
        r'located in ([^,\n]+,\s*[A-Z]{2,3})',   # "located in Melbourne, VIC"
        r'based in ([^,\n]+,\s*[A-Z]{2,3})',     # "based in Brisbane, QLD"
        r'job in ([^,\n]+,\s*[A-Z]{2,3})',       # "job in Perth, WA"
        r'service in ([^,\n]+,\s*[A-Z]{2,3})',   # "service in Perth, WA"
        r'work in ([^,\n]+,\s*[A-Z]{2,3})',      # "work in Melbourne, VIC"
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2,3})',  # "Melbourne, VIC"
    ]
    
    for pattern in location_patterns:
        match = re.search(pattern, job_card_text, re.IGNORECASE)
        if match:
            potential_location = match.group(1).strip()
            # Validate it's a reasonable location (not too long or containing service terms)
            if (len(potential_location) < 50 and 
                not any(word in potential_location.lower() for word in [
                    'builder', 'cleaner', 'painter', 'electrician', 'plumber', 'get jobs', 
                    'service', 'quote', 'budget', 'no set budget', 'not specified', 'flexible'
                ])):
                location = potential_location
                print(f"✅ Found location from pattern: '{location}'")
                break
    
    # If no pattern match, try specific location selectors on job card only
    if not location:
        location_selectors = [
            ".suburb",
            ".location", 
            ".address", 
            "[class*='suburb']",
            "[class*='location']",
            "[class*='address']"
        ]
        
        for selector in location_selectors:
            location_elem = job_card.select_one(selector)
            if location_elem:
                potential_location = location_elem.get_text(strip=True)
                print(f"🌍 Found location candidate with '{selector}': {potential_location[:50]}...")
                
                # Only use if it's a reasonable location (not contaminated with budget/schedule info)
                if (len(potential_location) < 50 and 
                    not any(word in potential_location.lower() for word in [
                        'builder', 'cleaner', 'painter', 'electrician', 'plumber', 'get jobs', 
                        'quote', 'categories', 'budget', 'no set budget', 'not specified', 
                        'flexible', 'schedule', 'posted', 'status'
                    ]) and
                    re.match(r'^[A-Za-z\s,]+$', potential_location)):  # Only letters, spaces, and commas
                    location = potential_location
                    print(f"✅ Using location from selector: '{location}'")
                    break

    # Enhanced company/client extraction for ServiceSeeking
    print("🏢 Searching for company/client information...")
    company = None
    
    # Try different selectors for company/client - ServiceSeeking shows client info
    company_selectors = [
        ".company",
        "[class*='company']",
        ".client",
        "[class*='client']",
        ".poster",
        "[class*='poster']",
        ".customer",
        "[class*='customer']",
        ".business",
        "[class*='business']",
        ".employer",
        "[class*='employer']",
        ".user-name",
        "[class*='user']",
        ".profile-name",
        "[class*='profile']",
        ".author",
        "[class*='author']"
    ]
    
    for selector in company_selectors:
        company_elem = job_card.select_one(selector)
        if company_elem:
            company_text = company_elem.get_text(strip=True)
            print(f"🏢 Found company candidate with '{selector}': {company_text[:30]}...")
            
            # Skip generic terms and use meaningful client names
            if (company_text and len(company_text) > 2 and
                company_text.lower() not in ['company', 'client', 'poster', 'user', 'author', 'customer', 'business']):
                company = company_text
                print(f"✅ Using company: '{company}'")
                break
    
    # If no company found, try to extract from job text patterns
    if not company:
        job_text = job_card.get_text()
        company_patterns = [
            r'Posted by ([^,\n]+)',
            r'Client: ([^,\n]+)',
            r'Employer: ([^,\n]+)',
            r'Company: ([^,\n]+)',
            r'Business: ([^,\n]+)',
            r'Contact: ([^,\n]+)',
        ]
        
        for pattern in company_patterns:
            match = re.search(pattern, job_text, re.IGNORECASE)
            if match:
                potential_company = match.group(1).strip()
                if len(potential_company) > 2 and len(potential_company) < 100:
                    company = potential_company
                    print(f"✅ Extracted company from pattern: '{company}'")
                    break
    
    # Default fallback
    if not company:
        company = "ServiceSeeking Client"
        print(f"⚠️ Using fallback company: '{company}'")

    # Try different selectors for posted date
    date_elem = (job_card.select_one(".posted-date") or
                job_card.select_one("[class*='date']") or
                job_card.select_one("[class*='posted']") or
                job_card.select_one(".date") or
                job_card.select_one("[class*='time']"))
    
    posted_date = parse_date(date_elem.get_text(strip=True)) if date_elem else None

    print(f"\n📋 Extracted job card info:")
    print(f"   Title: {title}")
    print(f"   Company: {company}")
    print(f"   Location: {location}")
    print(f"   URL: {job_url}")

    # Navigate to job detail page (if we have a valid different URL)
    description = ""
    salary = ""
    
    try:
        print(f"🔗 Visiting job detail page: {job_url}")
        driver.get(job_url)
        
        # Human-like delay when loading job detail page
        wait_like_human(3.5, 5.5)
        
        # ServiceSeeking-specific job description extraction - target actual job content
        print("📄 Searching for job description on ServiceSeeking...")
        
        detail_soup = BeautifulSoup(driver.page_source, "html.parser")
        
        # Remove footer and navigation content that contaminates descriptions
        for element in detail_soup.select('footer, .footer, nav, .nav, .copyright, .terms, .privacy, .conditions'):
            element.decompose()
        
        # Look for the actual job description text from the page content
        page_text = detail_soup.get_text()
        
        # Extract the job description using the job title as a reference point
        desc_elem = None
        working_desc_selector = None
        description = ""
        
        # Method 1: Look for job description in the main job content area
        # ServiceSeeking shows job descriptions as plain text in the main content
        
        # Look for text that appears after the job title and before "Specific job Details:"
        if title and title != "ServiceSeeking Request":
            # Find the job description that appears between title and job details
            try:
                # Look for patterns where job description appears - extract the actual description content
                text_patterns = [
                    # Extract description text that appears in the main job content area
                    rf'{re.escape(title)}[^.]*?([A-Z][^.]*?[.!?](?:\s*[A-Z][^.]*?[.!?])*)\s*(?:Specific job Details|Schedule:|Budget:|Site Visit:)',
                    
                    # Look for description after job category info
                    r'(?:Colorbond Fencing|Website Design|House Cleaning|Handyman|Bricklaying|Painting|Gardening|Electrical|Plumbing|Carpentry|Flooring|Air Conditioning|Tree Removal|Architecture) - [^.]*?\s+([A-Z][^.]*?[.!?](?:\s*[A-Z][^.]*?[.!?])*)\s*(?:Specific job Details|Schedule:|Budget:)',
                    
                    # Look for sentences that start with action words and contain job details
                    r'((?:Need|Want|Looking for|Require|I need|I want)[^.]*?[.!?](?:\s*[A-Z][^.]*?[.!?])*)\s*(?:Specific job Details|Schedule:|Budget:)',
                    
                    # Look for any description text between job title area and job details
                    r'(?:job|Job)\s+([A-Z][^.]*?[.!?](?:\s*[A-Z][^.]*?[.!?])*)\s*(?:Specific job Details|Schedule:|Budget:)',
                    
                    # Match multi-sentence descriptions
                    r'([A-Z][^.]*?[.!?]\s+[A-Z][^.]*?[.!?](?:\s+[A-Z][^.]*?[.!?])*)\s*(?:Specific job Details|Schedule:|Budget:)',
                    
                    # Single sentence descriptions
                    r'([A-Z][^.]*?[.!?])\s*(?:Specific job Details|Schedule:|Budget:)',
                ]
                
                for pattern in text_patterns:
                    match = re.search(pattern, page_text, re.IGNORECASE | re.DOTALL)
                    if match:
                        potential_desc = match.group(1).strip()
                        print(f"📄 Found description with pattern: {potential_desc[:100]}...")
                        
                        # Validate it's actual job content, not website navigation
                        if (len(potential_desc) > 20 and 
                            not any(nav_term in potential_desc.lower() for nav_term in [
                                'service seeking', 'privacy policy', 'conditions of use', 'copyright',
                                'trademark', 'pty ltd', 'get quotes', 'categories', 'popular'
                            ])):
                            description = potential_desc
                            print(f"✅ Extracted description using pattern matching: {len(description)} chars")
                            break
                            
            except Exception as e:
                print(f"⚠️ Pattern matching failed: {e}")
        
        # Method 2: If pattern matching failed, try manual extraction from structured content
        if not description:
            print("📄 Pattern matching failed, trying manual extraction...")
            
            # Look for the main content container that has the job details
            main_containers = detail_soup.select('body, main, .main, .content, .container')
            
            for container in main_containers:
                container_text = container.get_text()
                
                # Look for job description sentences manually
                sentences = container_text.split('.')
                job_desc_sentences = []
                
                for sentence in sentences:
                    sentence = sentence.strip()
                    # Look for sentences that sound like job descriptions
                    if (len(sentence) > 30 and len(sentence) < 300 and
                        any(job_keyword in sentence.lower() for job_keyword in [
                            'need', 'want', 'looking for', 'require', 'install', 'build', 'create',
                            'design', 'website', 'fencing', 'repair', 'service', 'help', 'add'
                        ]) and
                        not any(nav_term in sentence.lower() for nav_term in [
                            'service seeking', 'privacy policy', 'conditions of use', 'copyright',
                            'trademark', 'pty ltd', 'get quotes', 'categories', 'popular',
                            'related jobs', 'quote on this job', 'post similar job'
                        ])):
                        job_desc_sentences.append(sentence)
                
                if job_desc_sentences:
                    description = '. '.join(job_desc_sentences[:3])  # First 3 relevant sentences
                    print(f"✅ Extracted description manually: {len(description)} chars")
                    break
        
        # Method 3: Final fallback - look for any meaningful content
        if not description:
            print("📄 Manual extraction failed, using final fallback...")
            
            # Look for any paragraph or div that might contain job content
            content_elements = detail_soup.select('p, div')
            
            for elem in content_elements:
                elem_text = elem.get_text(strip=True)
                if (len(elem_text) > 50 and len(elem_text) < 1000 and
                    any(job_keyword in elem_text.lower() for job_keyword in [
                        'need', 'want', 'looking for', 'require', 'job', 'task', 'project'
                    ]) and
                    not any(nav_term in elem_text.lower() for nav_term in [
                        'service seeking', 'privacy policy', 'conditions of use', 'copyright',
                        'trademark', 'pty ltd', 'get quotes', 'categories', 'popular'
                    ])):
                    description = elem_text[:500]  # Limit to 500 chars
                    print(f"✅ Using fallback description: {len(description)} chars")
                    break
        
        # If still no description found
        if not description:
            description = "Job description not available - could not extract content"
            print("⚠️ No job description could be extracted")
        
        # Description extraction is now complete from the above methods
        print(f"✅ Final description extraction complete: {len(description)} characters")
        
        # Enhanced salary/budget extraction for ServiceSeeking
        print("💰 Searching for budget/payment information...")
        
        # Get the entire page content for budget search
        full_page_text = detail_soup.get_text()
        
        # Also try specific budget/payment selectors first
        budget_selectors = [
            ".budget",
            "[class*='budget']",
            ".payment",
            "[class*='payment']",
            ".salary",
            "[class*='salary']",
            ".price",
            "[class*='price']",
            ".cost",
            "[class*='cost']",
            ".fee",
            "[class*='fee']",
            ".amount",
            "[class*='amount']",
            ".value",
            "[class*='value']",
            ".total",
            "[class*='total']"
        ]
        
        salary_content_text = full_page_text
        
        # Try to find budget in specific elements first
        for selector in budget_selectors:
            budget_elem = detail_soup.select_one(selector)
            if budget_elem:
                budget_text = budget_elem.get_text(strip=True)
                print(f"💰 Found budget element with '{selector}': {budget_text[:50]}...")
                if any(char.isdigit() for char in budget_text):  # Contains numbers
                    salary_content_text = budget_text + " " + salary_content_text
                    break
        
        print(f"💰 Searching budget in content (length: {len(salary_content_text)})")
        job_content_text = salary_content_text
        
        # Enhanced salary/budget patterns for ServiceSeeking (project-based payments)
        salary_patterns = [
            # Specific budget patterns
            r'Budget:\s*\$[\d,]+\s*-\s*\$[\d,]+',               # Budget: $500 - $1000
            r'Budget:\s*\$[\d,]+',                              # Budget: $500
            r'Budget\s*is\s*\$[\d,]+\s*-\s*\$[\d,]+',          # Budget is $500 - $1000
            r'Budget\s*is\s*\$[\d,]+',                          # Budget is $500
            r'\$[\d,]+\s*-\s*\$[\d,]+\s*budget',                # $500 - $1000 budget
            r'\$[\d,]+\s*budget',                               # $500 budget
            
            # Payment patterns
            r'Payment:\s*\$[\d,]+\s*-\s*\$[\d,]+',              # Payment: $500 - $1000
            r'Payment:\s*\$[\d,]+',                             # Payment: $500
            r'Paying\s*\$[\d,]+\s*-\s*\$[\d,]+',               # Paying $500 - $1000
            r'Paying\s*\$[\d,]+',                               # Paying $500
            r'Pay\s*\$[\d,]+\s*-\s*\$[\d,]+',                  # Pay $500 - $1000
            r'Pay\s*\$[\d,]+',                                  # Pay $500
            
            # Hourly rates
            r'AU\$[\d,]+\s*-\s*AU\$[\d,]+\s*per\s+hour',        # AU$25 - AU$35 per hour
            r'\$[\d,]+\s*-\s*\$[\d,]+\s*per\s+hour',            # $25 - $35 per hour
            r'AU\$[\d,]+\s*per\s+hour',                         # AU$25 per hour
            r'\$[\d,]+\s*per\s+hour',                           # $25 per hour
            r'[\d,]+\s*per\s+hour',                             # 25 per hour
            
            # Total/project amounts
            r'AU\$[\d,]+\s*-\s*AU\$[\d,]+\s*total',             # AU$500 - AU$1,000 total
            r'\$[\d,]+\s*-\s*\$[\d,]+\s*total',                 # $500 - $1,000 total
            r'AU\$[\d,]+\s*total',                              # AU$500 total
            r'\$[\d,]+\s*total',                                # $500 total
            
            # ServiceSeeking specific patterns
            r'Up\s*to\s*\$[\d,]+',                              # Up to $500
            r'Around\s*\$[\d,]+',                               # Around $500
            r'Approximately\s*\$[\d,]+',                        # Approximately $500
            r'[\d,]+k\s*budget',                                # 5k budget
            r'Under\s*\$[\d,]+',                                # Under $500
            r'Over\s*\$[\d,]+',                                 # Over $1000
            r'Less\s*than\s*\$[\d,]+',                          # Less than $500
            r'More\s*than\s*\$[\d,]+',                          # More than $1000
            r'Between\s*\$[\d,]+\s*and\s*\$[\d,]+',            # Between $500 and $1000
            
            # General patterns (lower priority)
            r'\$[\d,]+\s*-\s*\$[\d,]+',                         # $500 - $1000 (general range)
            r'\$[\d,]+\+',                                      # $500+
            r'\$[\d,]+',                                        # $500 (simple number)
        ]
        
        salary = ""
        for i, pattern in enumerate(salary_patterns):
            matches = re.findall(pattern, job_content_text, re.IGNORECASE)
            if matches:
                for potential_salary in matches:
                    print(f"💰 Found budget candidate with pattern {i+1}: '{potential_salary}'")
                    
                    # Get context around the salary
                    salary_pos = job_content_text.lower().find(potential_salary.lower())
                    if salary_pos != -1:
                        context_start = max(0, salary_pos - 100)
                        context_end = min(len(job_content_text), salary_pos + len(potential_salary) + 100)
                        salary_context = job_content_text[context_start:context_end].lower()
                        
                        # Skip if clearly from unrelated sections
                        if any(phrase in salary_context for phrase in [
                            'similar jobs', 'other jobs', 'recommended jobs', 'more jobs like this',
                            'related positions', 'you might also like', 'other opportunities'
                        ]):
                            print(f"⚠️ Skipping budget '{potential_salary}' - found in unrelated context")
                            continue
                    
                    # Validate it's a reasonable payment amount
                    numbers = re.findall(r'[\d,]+', potential_salary)
                    if numbers:
                        try:
                            first_num = int(numbers[0].replace(',', ''))
                            # Check if it's a reasonable payment amount for ServiceSeeking projects
                            if 10 <= first_num <= 1000000:  # Reasonable payment range
                                salary = potential_salary
                                print(f"✅ Valid budget found: '{salary}'")
                                break
                        except ValueError:
                            continue
                    
                if salary:  # Break outer loop if salary found
                    break
        
        # Fallback: try to find any dollar amounts in the page
        if not salary:
            print("💰 No budget found with patterns, searching for any dollar amounts...")
            dollar_pattern = r'\$[\d,]+(?:\.\d+)?'
            dollar_matches = re.findall(dollar_pattern, job_content_text)
            
            for amount in dollar_matches[:5]:  # Check first 5 amounts found
                try:
                    num = int(amount.replace('$', '').replace(',', '').split('.')[0])
                    if 20 <= num <= 100000:  # Reasonable range for projects
                        salary = amount
                        print(f"✅ Using fallback budget: '{salary}'")
                        break
                except ValueError:
                    continue
        
        if not salary:
            print("⚠️ No budget information found")
            salary = ""
        else:
            print(f"✅ Final budget extracted: '{salary}'")
        
        # Enhanced company extraction from detail page
        print("🏢 Searching for company/client on detail page...")
        
        # Try to find actual client/company names from detail page
        detail_company_selectors = [
            ".client-name",
            ".poster-name",
            ".user-name",
            ".customer-name",
            ".business-name",
            ".company-name",
            "[class*='client']",
            "[class*='poster']",
            "[class*='user']",
            "[class*='customer']",
            "[class*='business']",
            "[class*='company']"
        ]
        
        for comp_selector in detail_company_selectors:
            comp_elem = detail_soup.select_one(comp_selector)
            if comp_elem:
                comp_text = comp_elem.get_text(strip=True)
                print(f"🏢 Found company candidate on detail page with '{comp_selector}': {comp_text[:30]}...")
                
                # Validate it's a real company name
                if (comp_text and len(comp_text) > 2 and len(comp_text) < 100 and
                    comp_text.lower() not in ['client', 'poster', 'user', 'customer', 'business', 'company'] and
                    not any(nav_term in comp_text.lower() for nav_term in ['get jobs', 'get quotes', 'service seeking'])):
                    company = comp_text
                    print(f"✅ Updated company from detail page: '{company}'")
                    break
        
        # Fixed location extraction for ServiceSeeking - avoid budget contamination
        print("🌍 Searching for clean location on detail page...")
        
        # First try to extract location from the job title/header area
        location_from_title = None
        title_text = detail_soup.get_text()
        
        # Look for location patterns in the page title or main content
        location_patterns = [
            r'Website Design job in ([^,\n]+),\s*([A-Z]{2,3})',  # "Website Design job in Sydney, NSW"
            r'job in ([^,\n]+),\s*([A-Z]{2,3})',               # "job in Sydney, NSW"
            r'Website Design - ([^,\n]+),\s*([A-Z]{2,3})',      # "Website Design - Sydney, NSW"
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,3})'  # "Sydney, NSW"
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, title_text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:
                    location_from_title = f"{match.group(1).strip()}, {match.group(2).strip()}"
                else:
                    location_from_title = match.group(1).strip()
                
                # Validate it's a reasonable location
                if (location_from_title and len(location_from_title) < 50 and
                    not any(budget_term in location_from_title.lower() for budget_term in [
                        'budget', 'no set budget', 'not specified', 'flexible', 'open for quoting'
                    ])):
                    location = location_from_title
                    print(f"✅ Extracted clean location from title: '{location}'")
                    break
        
        # If no clean location found, try specific selectors but validate carefully
        if not location or 'budget' in location.lower():
            print("🌍 Trying location selectors with validation...")
            
            detail_location_selectors = [
                ".job-header [class*='location']",
                ".request-header [class*='location']",
                ".job-summary [class*='location']",
                "[class*='location']",
                ".location",
                ".job-location",
                ".suburb",
                "[class*='suburb']"
            ]
            
            for loc_selector in detail_location_selectors:
                loc_elem = detail_soup.select_one(loc_selector)
                if loc_elem:
                    loc_text = loc_elem.get_text(strip=True)
                    print(f"🌍 Found location candidate on detail page with '{loc_selector}': {loc_text[:50]}...")
                    
                    # Clean up the location text and validate
                    loc_text = re.sub(r'\s*,?\s*(Australia|NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\s*$', '', loc_text, flags=re.IGNORECASE)
                    loc_text = loc_text.strip()
                    
                    # Use this location ONLY if it's clean and doesn't contain budget info
                    if (loc_text and loc_text != "Location" and len(loc_text) < 50 and
                        not any(budget_term in loc_text.lower() for budget_term in [
                            'budget', 'no set budget', 'not specified', 'flexible', 'open for quoting',
                            'schedule', 'posted', 'status', 'get jobs', 'get quotes', 'categories'
                        ]) and
                        re.match(r'^[A-Za-z\s,]+$', loc_text)):  # Only letters, spaces, and commas
                        location = loc_text
                        print(f"✅ Updated location from detail page: '{location}'")
                        break
        
    except Exception as e:
        print(f"⚠️ Could not load job detail page: {str(e)[:100]}...")
        description = "Description unavailable - detail page load failed"
        salary = ""
        print(f"⚠️ Using fallback: description='{description}', salary='{salary}'")

    # Final location validation and cleanup
    if location:
        # Remove any remaining contamination from location
        location = re.sub(r'.*?budget.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2,3}).*', r'\1', location, flags=re.IGNORECASE)
        location = re.sub(r'.*?schedule.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2,3}).*', r'\1', location, flags=re.IGNORECASE)
        location = re.sub(r'.*?posted.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2,3}).*', r'\1', location, flags=re.IGNORECASE)
        
        # Final validation - if location still contains budget/schedule terms, clear it
        if any(term in location.lower() for term in ['budget', 'schedule', 'posted', 'status', 'flexible', 'not specified']):
            print(f"⚠️ Location still contaminated: '{location}' - clearing it")
            location = ""
    
    # Final location check - if we still don't have a location, leave it empty (no fake data)
    if not location:
        location = ""

    # Final summary of extracted data
    print(f"\n🎯 Final extracted data:")
    print(f"   Title: {title}")
    print(f"   Company: {company}")
    print(f"   Location: {location}")
    print(f"   Description: {len(description)} characters")
    print(f"   Salary: {salary}")
    print(f"   URL: {job_url}")

    return {
        'title': title,
        'company': company,
        'location': location,
        'job_url': job_url,
        'description': description,
        'posted_date': posted_date,
        'salary': salary
    }

def save_job_to_database(job_data):
    """Save job data to the JobPosting model"""
    try:
        # Check if job already exists by URL
        if job_data.get('job_url'):
            existing_job = JobPosting.objects.filter(external_url=job_data['job_url']).first()
            if existing_job:
                print(f"⏭️ Job already exists: {job_data['title']}")
                return existing_job
        
        # Get or create company
        company_name = job_data.get('company', 'ServiceSeeking Client')
        company_slug = slugify(company_name)
        
        company_obj, created = Company.objects.get_or_create(
            slug=company_slug,
            defaults={
                'name': company_name,
                'description': f'{company_name} - Jobs posted from ServiceSeeking',
                'website': 'https://www.serviceseeking.com.au',
                'company_size': 'small'
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
        salary_min, salary_max, currency, salary_type = parse_salary(job_data.get('salary', ''))
        
        # Create unique slug
        base_slug = slugify(job_data['title'])
        unique_slug = base_slug
        counter = 1
        while JobPosting.objects.filter(slug=unique_slug).exists():
            unique_slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Create job posting
        job_obj = JobPosting.objects.create(
            title=job_data['title'],
            slug=unique_slug,
            description=job_data.get('description', 'No description available'),
            company=company_obj,
            posted_by=system_user,
            location=location_obj,
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency=currency,
            salary_type=salary_type,
            external_source="ServiceSeeking",
            external_url=job_data.get('job_url', ''),
            job_type="contract",
            status="active"
        )
        
        return job_obj
        
    except Exception as e:
        print(f"❌ Error saving job to database: {str(e)}")
        return None

def parse_salary(salary_text):
    """Parse salary string into structured data"""
    if not salary_text:
        return None, None, "AUD", "project"
    
    salary_min = None
    salary_max = None
    currency = "AUD"
    salary_type = "project"  # ServiceSeeking jobs are typically project-based
    
    try:
        # Determine if it's hourly or project-based
        if any(word in salary_text.lower() for word in ['hour', 'hourly', '/hr', 'per hour']):
            salary_type = "hourly"
        elif any(word in salary_text.lower() for word in ['day', 'daily', '/day', 'per day']):
            salary_type = "daily"
        
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

if __name__ == "__main__":
    fetch_serviceseeking_all_jobs()

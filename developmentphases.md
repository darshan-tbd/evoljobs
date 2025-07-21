# JobPilot - Development Phases & Technical Roadmap

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Phase 1: MVP Foundation](#phase-1-mvp-foundation)
4. [Phase 1.5: Enhanced Features](#phase-15-enhanced-features)
5. [Phase 2: AI-Powered Intelligence](#phase-2-ai-powered-intelligence)
6. [Phase 3: Enterprise & Scale](#phase-3-enterprise--scale)
7. [API Specifications](#api-specifications)
8. [Data Models](#data-models)
9. [Scraper Workflows](#scraper-workflows)
10. [Subscription Architecture](#subscription-architecture)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Testing Strategy](#testing-strategy)
13. [Performance Benchmarks](#performance-benchmarks)

---

## Overview

JobPilot is an AI-driven job search and recruitment platform designed to revolutionize how job seekers discover opportunities and how employers find talent. This document outlines the technical implementation roadmap across multiple development phases.

### Development Philosophy
- **Microservices Architecture**: Modular, scalable service design
- **API-First Development**: All features accessible via RESTful APIs
- **Real-Time Processing**: Live updates and notifications
- **Data-Driven Decisions**: Analytics and ML at the core
- **Multi-Tenant SaaS**: Scalable subscription model

---

## Technology Stack

### Core Backend Technologies
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL 15+ (Primary), Redis 7+ (Cache/Sessions)
- **Search Engine**: Elasticsearch 8+ with OpenSearch compatibility
- **Task Queue**: Celery 5+ with Redis broker
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 with CloudFront CDN

### Frontend Technologies
- **Framework**: React 18+ with Next.js 13+
- **UI Library**: Material-UI (MUI) 5+ with custom theming
- **State Management**: Redux Toolkit with RTK Query
- **Real-Time**: Socket.io for live updates
- **Charts**: Chart.js with react-chartjs-2
- **Forms**: React Hook Form with Yup validation

### AI/ML Technologies
- **ML Framework**: TensorFlow 2.13+ and PyTorch 2.0+
- **NLP**: spaCy 3.6+ and transformers library
- **Vector Database**: Pinecone or Weaviate
- **Model Serving**: TensorFlow Serving or Triton
- **Feature Store**: Feast or Tecton

### DevOps & Infrastructure
- **Containerization**: Docker 24+ with Docker Compose 2.0+
- **Deployment Platform**: Render (Primary)
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Environment Management**: django-environ 0.10+ with priority loading
- **Static Files**: WhiteNoise 6.5+ with compression
- **Database**: PostgreSQL 15+ with connection pooling
- **Monitoring**: Prometheus, Grafana, Sentry, and custom health checks
- **Security**: JWT authentication, HTTPS enforcement, CORS configuration

---

## Environment Management & Configuration

### Environment Variable Strategy
Based on production deployment experience, implement a three-tier environment system:

#### Development Environment (.env.local)
- Local development with Docker containers
- Hardcoded localhost URLs for backend/frontend communication
- Debug mode enabled with verbose logging

#### Staging Environment (Render Environment Variables)
- Production-like environment for testing
- Real domain URLs with HTTPS
- Limited debug information

#### Production Environment (Render Environment Variables)
- Secure, scalable configuration
- Environment-specific database connections
- Performance optimizations enabled

### Required Environment Variables

#### .env.example (Template - commit this)
```bash
# Backend Configuration
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DATABASE_URL=postgres://user:password@host:5432/dbname
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password

# Frontend URLs
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com
```

#### .env.local (Root level - development only, never commit)
```bash
# Local Development Environment Variables
# This file is for local development only

# Backend Configuration
DEBUG=true
SECRET_KEY=django-insecure-local-key-here
DJANGO_SETTINGS_MODULE=Backend.settings

# Database Configuration (Docker PostgreSQL)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-local-password
POSTGRES_DB=your_local_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Frontend Configuration (for local development)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Frontend/.env.local (Frontend development overrides, never commit)
```bash
# Local frontend development overrides
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Environment File Priority (Django Settings)
```python
# Backend/Backend/settings.py
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environment variables
env = environ.Env(DEBUG=(bool, False))

# Define environment files with priority order
env_files = [
    BASE_DIR.parent / ".env.local",  # Highest priority (local development)
    BASE_DIR.parent / ".env",        # Fallback
]

# Read environment files in order of priority
for env_file in env_files:
    if env_file.exists():
        environ.Env.read_env(env_file)
        print(f"✅ Loaded environment from: {env_file}")
        break
else:
    print("⚠️ No environment file found, using system environment variables")

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        'USER': env('POSTGRES_USER'),
        'PASSWORD': env('POSTGRES_PASSWORD'),
        'HOST': env('POSTGRES_HOST', default='localhost'),
        'PORT': env('POSTGRES_PORT', default='5432'),
    }
}

# CORS settings
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS')
```

### Pre-Deployment URL Audit Commands
```bash
# Check for hardcoded localhost URLs
echo "🔍 Scanning for hardcoded localhost URLs..."
grep -r "localhost" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git .

# Check for hardcoded 127.0.0.1
echo "🔍 Scanning for hardcoded 127.0.0.1..."
grep -r "127.0.0.1" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git .

# Check for hardcoded ports
echo "🔍 Scanning for hardcoded ports..."
grep -r ":8000\|:3000" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git .

# Find all environment variable usage
echo "🔍 Finding environment variable usage..."
grep -r "process.env" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .
grep -r "os.environ\|env(" --include="*.py" --exclude-dir=venv .
```

### Component Code Pattern for URLs
```typescript
// ✅ CORRECT: Always use environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

// Example usage in API calls
const response = await fetch(`${API_URL}/api/auth/login/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(credentials),
});

// ❌ NEVER DO THIS:
const response = await fetch('http://localhost:8000/api/auth/login/', {
  // This will break in production!
});
```

---

## Phase 1: MVP Foundation


### Core Features
- User registration and authentication (done) 
- Basic job search and filtering (done)
- Job application tracking (no needed)
- Simple dashboard 
- Admin job posting management

### Technical Components

#### 1.1 Authentication System
```python
# JWT Authentication with refresh tokens
class AuthenticationService:
    def authenticate_user(self, email, password):
        # Validate credentials and generate JWT tokens
        pass
    
    def refresh_token(self, refresh_token):
        # Generate new access token
        pass
```

#### 1.2 Job Search Engine
```python
# Elasticsearch integration for job search
class JobSearchService:
    def search_jobs(self, query, filters, pagination):
        # Full-text search with filters
        pass
    
    def get_job_suggestions(self, user_profile):
        # Basic recommendation algorithm
        pass
```

### Database Schema (Phase 1)
- Users and UserProfiles
- Companies and JobPostings
- JobApplications and SavedJobs
- Basic skill and location taxonomies

### API Endpoints (Phase 1)
```
Authentication:
POST /api/v1/auth/register/
POST /api/v1/auth/login/
POST /api/v1/auth/refresh/
GET /api/v1/auth/profile/

Job Management:
GET /api/v1/jobs/
GET /api/v1/jobs/{id}/
POST /api/v1/jobs/{id}/apply/
POST /api/v1/jobs/{id}/save/

Dashboard:
GET /api/v1/dashboard/stats/
GET /api/v1/dashboard/recent-activity/
```

---

## Phase 1.5: Enhanced Features

### Focus: User experience and operational efficiency

### Enhanced Features
- Advanced filtering and sorting
- Real-time notifications
- Resume parsing and CV builder
- Basic job matching algorithm
- Email integration
- Mobile responsive design

### Technical Enhancements

#### 1.5.1 Real-Time Notifications
```python
# WebSocket integration for live updates
class NotificationService:
    def send_real_time_notification(self, user_id, notification_type, data):
        # Send via WebSocket and store in database
        pass
    
    def get_notification_preferences(self, user_id):
        # User notification settings
        pass
```

#### 1.5.2 Resume Parsing Engine
```python
# AI-powered resume parsing
class ResumeParsingService:
    def parse_resume(self, resume_file):
        # Extract skills, experience, education
        pass
    
    def standardize_skills(self, extracted_skills):
        # Map to standard skill taxonomy
        pass
```

### API Extensions (Phase 1.5)
```
Notifications:
GET /api/v1/notifications/
POST /api/v1/notifications/mark-read/
PUT /api/v1/notifications/preferences/

Resume Processing:
POST /api/v1/resume/parse/
GET /api/v1/resume/skills/
POST /api/v1/resume/generate/
```

---

## Phase 2: AI-Powered Intelligence

### Focus: Machine learning and intelligent automation

### AI Features
- Smart job matching with ML models
- Automated job summaries
- Intelligent application screening
- Predictive analytics
- Chatbot assistance
- Sentiment analysis on company reviews

### Technical Implementation

#### 2.1 Job Matching Engine
```python
# ML-powered job recommendation system
class JobMatchingEngine:
    def __init__(self):
        self.user_embeddings = UserEmbeddingModel()
        self.job_embeddings = JobEmbeddingModel()
    
    def generate_recommendations(self, user_id, num_recommendations=20):
        # Generate personalized job recommendations
        pass
    
    def calculate_match_score(self, user_profile, job_posting):
        # Calculate compatibility score
        pass
```

#### 2.2 AI Summary Generation
```python
# Automated job description summarization
class SummaryGenerationService:
    def generate_job_summary(self, job_description):
        # Use transformer model for summarization
        pass
    
    def extract_key_requirements(self, job_posting):
        # Extract and rank important requirements
        pass
```

### ML Model Architecture
- **User Embeddings**: 256-dimensional vectors representing user preferences
- **Job Embeddings**: 256-dimensional vectors representing job characteristics
- **Matching Model**: Neural network for similarity scoring
- **Classification Models**: Job category and skill extraction

### API Extensions (Phase 2)
```
AI Services:
GET /api/v2/jobs/{id}/summary/
POST /api/v2/jobs/batch-summarize/
GET /api/v2/recommendations/
POST /api/v2/matching/score/

Analytics:
GET /api/v2/analytics/user-behavior/
GET /api/v2/analytics/job-performance/
GET /api/v2/analytics/matching-metrics/
```

---

## Phase 3: Enterprise & Scale

### Focus: Enterprise features and scalability

### Enterprise Features
- Multi-tenant architecture
- Advanced analytics dashboard
- Custom branding and white-labeling
- API rate limiting and quotas
- Advanced security features
- Integration marketplace

### Scalability Enhancements
- Database sharding and replication
- Microservices decomposition
- Auto-scaling infrastructure
- Global CDN distribution
- Advanced caching strategies

---

## Phase 4: Production Deployment & DevOps

### Focus: Production readiness and operational excellence

### Deployment Features
- Docker containerization with multi-stage builds
- Render cloud deployment with auto-scaling
- Environment-specific configurations
- Database migration strategies
- Static file optimization with WhiteNoise
- Real-time monitoring and health checks
- Security hardening and CORS configuration

### Technical Implementation

#### 4.1 Docker Configuration

##### Backend Dockerfile (Django)
```dockerfile
# Backend/Dockerfile
FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm-rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "Backend.wsgi:application"]
```

##### Frontend Dockerfile (Next.js)
```dockerfile
# Frontend/Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

#### 4.2 Static Files Configuration (Django)
```python
# Backend/Backend/settings.py
import os
from pathlib import Path

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static'] if os.path.exists(BASE_DIR / 'static') else []

# WhiteNoise for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Middleware (WhiteNoise should be after SecurityMiddleware)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
]
```

#### 4.3 Database Migration Strategy
```python
# Backend/entrypoint.sh
#!/bin/bash
set -e

echo "🚀 Starting EvolJobs Django application..."

# Wait for database
echo "⏳ Waiting for database..."
python manage.py wait_for_db

# Run migrations
echo "🔄 Running migrations..."
python manage.py migrate --noinput

# Create superuser if it doesn't exist
echo "👤 Creating superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@evoljobs.com', 'secure_admin_password')
    print('✅ Superuser created')
else:
    print('✅ Superuser already exists')
"

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Start server
echo "🚀 Starting EvolJobs server..."
exec "$@"
```

#### 4.4 Pre-Deployment Checklist
- [ ] **Environment Variables Audit**
  ```bash
  # Check for hardcoded URLs
  grep -r "localhost" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" .
  grep -r "127.0.0.1" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" .
  ```

- [ ] **Security Review**
  - HTTPS enforcement enabled
  - CORS configuration tested
  - JWT token security validated
  - Database credentials secured

- [ ] **Performance Optimization**
  - Database query optimization
  - Static file compression
  - CDN configuration
  - Caching strategies implemented

- [ ] **Monitoring Setup**
  - Health check endpoints
  - Error monitoring with Sentry
  - Performance metrics collection
  - Database monitoring

### EvolJobs.com Render Deployment Configuration

#### Backend Service (API) - api.evoljobs.com
```yaml
services:
  - type: web
    name: evoljobs-backend
    env: docker
    dockerfilePath: Backend/Dockerfile
    plan: starter
    environment:
      - key: DATABASE_URL
        fromDatabase:
          name: evoljobs-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: "false"
      - key: ALLOWED_HOSTS
        value: "api.evoljobs.com,evoljobs-backend.onrender.com"
      - key: CORS_ALLOWED_ORIGINS
        value: "https://evoljobs.com,https://www.evoljobs.com"
      - key: NEXT_PUBLIC_API_URL
        value: "https://api.evoljobs.com"
```

#### Frontend Service (Web App) - evoljobs.com
```yaml
  - type: web
    name: evoljobs-frontend
    env: docker
    dockerfilePath: Frontend/Dockerfile
    plan: starter
    environment:
      - key: NEXT_PUBLIC_API_URL
        value: "https://api.evoljobs.com"
      - key: NEXT_PUBLIC_WS_URL
        value: "wss://api.evoljobs.com"
      - key: NODE_ENV
        value: "production"
      - key: NEXT_TELEMETRY_DISABLED
        value: "1"
```

#### Database Service (PostgreSQL)
```yaml
databases:
  - name: evoljobs-db
    type: postgres
    plan: free
    databaseName: evoljobs
    user: evoljobs_user
```

### Custom Domain Setup (evoljobs.com)

#### DNS Configuration
```txt
# Add these DNS records to your domain registrar:
Type: CNAME
Name: www
Value: evoljobs-frontend.onrender.com

Type: CNAME
Name: api
Value: evoljobs-backend.onrender.com

Type: A (if apex domain)
Name: @
Value: [Render's IP address from dashboard]
```

### Post-Deployment Verification

#### Health Check Endpoints
```python
# Backend/api/health.py
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import time

def health_check(request):
    try:
        # Database check
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Cache check
    try:
        cache_key = f"health_check_{int(time.time())}"
        cache.set(cache_key, "test", 30)
        cache_status = "healthy"
    except Exception as e:
        cache_status = f"unhealthy: {str(e)}"
    
    return JsonResponse({
        "status": "healthy",
        "service": "evoljobs-backend",
        "database": db_status,
        "cache": cache_status,
        "timestamp": time.time()
    })
```

#### Automated Testing Script (EvolJobs)
```bash
#!/bin/bash
# Post-deployment verification script for EvolJobs

echo "🔍 Running EvolJobs post-deployment verification..."

# Test backend health
echo "Testing backend health (api.evoljobs.com)..."
curl -f https://api.evoljobs.com/health/ || exit 1

# Test frontend
echo "Testing frontend (evoljobs.com)..."
curl -f https://evoljobs.com/ || exit 1

# Test API endpoints
echo "Testing API endpoints..."
curl -f https://api.evoljobs.com/api/v1/jobs/ || exit 1

# Test WebSocket connection
echo "Testing WebSocket connection..."
curl -f https://api.evoljobs.com/ws/status/ || exit 1

echo "✅ All EvolJobs health checks passed!"
```

#### Production URLs Structure
```
Frontend (Web App): https://evoljobs.com
Backend API: https://api.evoljobs.com
Admin Panel: https://api.evoljobs.com/admin/
API Documentation: https://api.evoljobs.com/api/docs/
Health Check: https://api.evoljobs.com/health/
```

---

## API Specifications

### Authentication API
```yaml
# OpenAPI 3.0 specification example
paths:
  /api/v1/auth/login/:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        '200':
          description: Successful login
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  refresh_token:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
```

### Job Search API
```yaml
/api/v1/jobs/:
  get:
    summary: Search jobs
    parameters:
      - name: q
        in: query
        description: Search query
        schema:
          type: string
      - name: location
        in: query
        description: Location filter
        schema:
          type: string
      - name: job_type
        in: query
        description: Job type filter
        schema:
          type: string
          enum: [full-time, part-time, contract, internship]
      - name: salary_min
        in: query
        schema:
          type: integer
      - name: salary_max
        in: query
        schema:
          type: integer
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
          maximum: 100
```

---

## Data Models

### Core Models

#### User Profile Model
```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    # Personal Information
    phone_number = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # Job Preferences
    preferred_job_types = models.ManyToManyField('JobType', blank=True)
    preferred_locations = models.ManyToManyField('Location', blank=True)
    salary_expectation_min = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    salary_expectation_max = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    
    # Skills and Experience
    skills = models.ManyToManyField('Skill', through='UserSkill')
    experience_years = models.IntegerField(default=0)
    education_level = models.CharField(max_length=50, choices=EDUCATION_CHOICES)
    
    # Preferences
    notification_preferences = models.JSONField(default=dict)
    privacy_settings = models.JSONField(default=dict)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(auto_now=True)
```

#### Job Posting Model
```python
class JobPosting(models.Model):
    # Basic Information
    title = models.CharField(max_length=200)
    company = models.ForeignKey('Company', on_delete=models.CASCADE)
    description = models.TextField()
    requirements = models.TextField()
    benefits = models.TextField(blank=True)
    
    # Job Details
    job_type = models.CharField(max_length=50, choices=JOB_TYPE_CHOICES)
    location = models.ForeignKey('Location', on_delete=models.SET_NULL, null=True)
    remote_option = models.CharField(max_length=20, choices=REMOTE_OPTIONS)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    salary_currency = models.CharField(max_length=3, default='USD')
    
    # Application Details
    application_deadline = models.DateTimeField(null=True, blank=True)
    external_application_url = models.URLField(blank=True)
    application_instructions = models.TextField(blank=True)
    
    # AI Features
    ai_summary = models.TextField(blank=True)
    skill_requirements = models.JSONField(default=list)
    match_score_cache = models.JSONField(default=dict)
    
    # SEO and Discovery
    tags = models.ManyToManyField('Tag', blank=True)
    slug = models.SlugField(unique=True)
    view_count = models.IntegerField(default=0)
    application_count = models.IntegerField(default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=JOB_STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
```

---

## Scraper Workflows

### Job Board Scraping Architecture

#### 1. Distributed Scraping System
```python
# Celery task for job scraping
@app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def scrape_job_board(self, board_config):
    """
    Scrape job postings from external job boards
    """
    scraper = JobBoardScraper(board_config)
    
    try:
        jobs = scraper.scrape_jobs()
        for job_data in jobs:
            # Validate and normalize job data
            normalized_job = normalize_job_data(job_data)
            
            # Check for duplicates
            if not job_exists(normalized_job):
                create_job_posting(normalized_job)
                
    except Exception as e:
        self.retry(countdown=60 * (2 ** self.request.retries))
```

#### 2. Multi-Source Integration
```python
class JobBoardScraper:
    """
    Unified scraper for multiple job boards
    """
    SUPPORTED_BOARDS = {
        'indeed': IndeedScraper,
        'linkedin': LinkedInScraper,
        'glassdoor': GlassdoorScraper,
        'stackoverflow': StackOverflowScraper,
        'dice': DiceScraper,
    }
    
    def __init__(self, board_config):
        self.board_type = board_config['type']
        self.scraper = self.SUPPORTED_BOARDS[self.board_type](board_config)
    
    def scrape_jobs(self):
        return self.scraper.scrape()
```

#### 3. Data Normalization Pipeline
```python
def normalize_job_data(raw_job_data):
    """
    Normalize job data from different sources
    """
    normalized = {
        'title': clean_job_title(raw_job_data.get('title')),
        'company': normalize_company_name(raw_job_data.get('company')),
        'location': parse_location(raw_job_data.get('location')),
        'salary': parse_salary(raw_job_data.get('salary')),
        'description': clean_html_content(raw_job_data.get('description')),
        'requirements': extract_requirements(raw_job_data.get('description')),
        'job_type': classify_job_type(raw_job_data),
        'remote_option': detect_remote_option(raw_job_data),
        'source': raw_job_data.get('source'),
        'external_id': raw_job_data.get('external_id'),
        'posted_date': parse_date(raw_job_data.get('posted_date')),
    }
    return normalized
```

---

## Subscription Architecture

### Multi-Tenant SaaS Design

#### 1. Subscription Tiers
```python
class SubscriptionTier(models.Model):
    name = models.CharField(max_length=50)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Feature Limits
    max_job_applications = models.IntegerField()
    max_saved_jobs = models.IntegerField()
    max_resume_downloads = models.IntegerField()
    ai_recommendations = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    custom_alerts = models.BooleanField(default=False)
    
    # Enterprise Features
    white_labeling = models.BooleanField(default=False)
    api_access = models.BooleanField(default=False)
    custom_integrations = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### 2. Usage Tracking
```python
class UsageTracker:
    """
    Track user usage against subscription limits
    """
    def __init__(self, user_id):
        self.user_id = user_id
        self.subscription = self.get_user_subscription()
    
    def can_perform_action(self, action_type):
        """
        Check if user can perform action based on subscription
        """
        current_usage = self.get_current_usage(action_type)
        limit = self.subscription.tier.get_limit(action_type)
        
        return current_usage < limit
    
    def record_usage(self, action_type):
        """
        Record usage event
        """
        UsageEvent.objects.create(
            user_id=self.user_id,
            action_type=action_type,
            timestamp=timezone.now()
        )
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

#### 1. Enhanced Continuous Integration with Deployment Auditing
```yaml
name: EvolJobs CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  pre-deployment-audit:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Environment Variables Audit
      run: |
        echo "🔍 Scanning for hardcoded URLs in EvolJobs..."
        echo "=== Checking for localhost URLs ==="
        grep -r "localhost" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git . || true
        echo "=== Checking for hardcoded IP addresses ==="
        grep -r "127.0.0.1" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git . || true
        echo "=== Checking for hardcoded ports ==="
        grep -r ":8000\|:3000" --include="*.py" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git . || true
    
    - name: Security Check
      run: |
        echo "🔒 Checking for sensitive files..."
        if git ls-files | grep -E "\.(env|key|secret)$"; then
          echo "❌ Found sensitive files in git repository!"
          exit 1
        else
          echo "✅ No sensitive files found"
        fi
    
    - name: Validate Environment Configuration
      run: |
        echo "🔧 Validating environment configuration..."
        echo "Required environment variables for EvolJobs:"
        echo "- NEXT_PUBLIC_API_URL (should be https://api.evoljobs.com)"
        echo "- NEXT_PUBLIC_WS_URL (should be wss://api.evoljobs.com)"
        echo "- CORS_ALLOWED_ORIGINS (should include https://evoljobs.com)"

  test:
    needs: pre-deployment-audit
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: evoljobs_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.13'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install -r requirements-dev.txt
    
    - name: Run Django tests
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/evoljobs_test
        SECRET_KEY: test-secret-key
        DEBUG: true
      run: |
        python manage.py test
        pytest --cov=apps --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml

  docker-build:
    needs: [test, pre-deployment-audit]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build Backend Docker Image
      run: |
        docker build -f Backend/Dockerfile -t evoljobs-backend:${{ github.sha }} .
        docker tag evoljobs-backend:${{ github.sha }} evoljobs-backend:latest
    
    - name: Build Frontend Docker Image
      run: |
        docker build -f Frontend/Dockerfile -t evoljobs-frontend:${{ github.sha }} ./Frontend
        docker tag evoljobs-frontend:${{ github.sha }} evoljobs-frontend:latest
    
    - name: Test Docker Images
      run: |
        echo "🧪 Testing Docker images..."
        docker run --rm -e SECRET_KEY=test-key -e DEBUG=true evoljobs-backend:latest python manage.py check
        echo "✅ Backend Docker image test passed"
        
        docker run --rm -e NODE_ENV=production evoljobs-frontend:latest npm run build
        echo "✅ Frontend Docker image test passed"
```

#### 2. Render Deployment Pipeline
```yaml
  deploy-to-render:
    needs: [test, docker-build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Render
      env:
        RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
      run: |
        echo "🚀 Deploying EvolJobs to Render..."
        
        # Deploy backend service
        curl -X POST "https://api.render.com/v1/services/evoljobs-backend/deploys" \
          -H "Authorization: Bearer $RENDER_API_KEY" \
          -H "Content-Type: application/json"
        
        # Deploy frontend service
        curl -X POST "https://api.render.com/v1/services/evoljobs-frontend/deploys" \
          -H "Authorization: Bearer $RENDER_API_KEY" \
          -H "Content-Type: application/json"
        
        echo "✅ Deployment initiated"
    
    - name: Wait for Deployment
      run: |
        echo "⏳ Waiting for deployment to complete..."
        sleep 300  # Wait 5 minutes for deployment
    
    - name: Post-Deployment Verification
      run: |
        echo "🔍 Running post-deployment verification for EvolJobs..."
        
        # Test backend health
        echo "Testing backend health (api.evoljobs.com)..."
        curl -f -retry 5 -retry-delay 10 https://api.evoljobs.com/health/ || exit 1
        
        # Test frontend
        echo "Testing frontend (evoljobs.com)..."
        curl -f -retry 5 -retry-delay 10 https://evoljobs.com/ || exit 1
        
        # Test API endpoints
        echo "Testing API endpoints..."
        curl -f -retry 3 -retry-delay 5 https://api.evoljobs.com/api/v1/jobs/ || exit 1
        
        echo "✅ All EvolJobs health checks passed!"
    
    - name: Post-Deployment Notifications
      if: always()
      run: |
        if [ $? -eq 0 ]; then
          echo "🎉 EvolJobs deployment successful!"
          echo "Frontend: https://evoljobs.com"
          echo "Backend: https://api.evoljobs.com"
          echo "Admin: https://api.evoljobs.com/admin/"
        else
          echo "❌ EvolJobs deployment failed!"
        fi

  integration-tests:
    needs: deploy-to-render
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install test dependencies
      run: |
        npm install -g cypress
        npm install
    
    - name: Run integration tests against production
      env:
        CYPRESS_baseUrl: https://evoljobs.com
        CYPRESS_apiUrl: https://api.evoljobs.com
      run: |
        # Run Cypress tests against production
        cypress run --config baseUrl=https://evoljobs.com
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: cypress-screenshots
        path: cypress/screenshots/
```

### Environment-Specific Configuration

#### Development Environment
```yaml
development:
  backend:
    environment:
      - DEBUG=true
      - ALLOWED_HOSTS=localhost,127.0.0.1
      - DATABASE_URL=postgres://postgres:password@localhost:5432/evoljobs_dev
      - CORS_ALLOWED_ORIGINS=http://localhost:3000
  
  frontend:
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
      - NODE_ENV=development
```

#### Production Environment (Render)
```yaml
production:
  backend:
    environment:
      - DEBUG=false
      - ALLOWED_HOSTS=api.evoljobs.com,evoljobs-backend.onrender.com
      - DATABASE_URL=postgres://evoljobs_user:password@host:5432/evoljobs
      - CORS_ALLOWED_ORIGINS=https://evoljobs.com,https://www.evoljobs.com
      - SECRET_KEY=production-secret-key
  
  frontend:
    environment:
      - NEXT_PUBLIC_API_URL=https://api.evoljobs.com
      - NEXT_PUBLIC_WS_URL=wss://api.evoljobs.com
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
```

### Monitoring and Alerting

#### GitHub Actions Notifications
```yaml
  notify-on-failure:
    needs: [test, deploy-to-render, integration-tests]
    runs-on: ubuntu-latest
    if: failure()
    
    steps:
    - name: Send failure notification
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        text: |
          🚨 EvolJobs deployment failed!
          Branch: ${{ github.ref }}
          Commit: ${{ github.sha }}
          See: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Manual Deployment Commands

#### For Emergency Deployments
```bash
# Emergency backend deployment
curl -X POST "https://api.render.com/v1/services/evoljobs-backend/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json"

# Emergency frontend deployment
curl -X POST "https://api.render.com/v1/services/evoljobs-frontend/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json"

# Rollback commands
curl -X POST "https://api.render.com/v1/services/evoljobs-backend/deploys/rollback" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

---

## Testing Strategy

### Testing Pyramid

#### 1. Unit Tests (70%)
```python
# Example unit test
class JobSearchServiceTest(TestCase):
    def setUp(self):
        self.service = JobSearchService()
        self.sample_jobs = JobPostingFactory.create_batch(10)
    
    def test_search_jobs_with_query(self):
        # Test job search functionality
        results = self.service.search_jobs(
            query="python developer",
            filters={'location': 'San Francisco'}
        )
        
        self.assertIsInstance(results, QuerySet)
        self.assertGreater(len(results), 0)
    
    def test_search_with_invalid_filters(self):
        # Test error handling
        with self.assertRaises(ValidationError):
            self.service.search_jobs(
                query="",
                filters={'salary_min': 'invalid'}
            )
```

#### 2. Integration Tests (20%)
```python
# API integration test
class JobSearchAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_job_search_endpoint(self):
        # Test full API endpoint
        response = self.client.get('/api/v1/jobs/', {
            'q': 'python',
            'location': 'New York',
            'page': 1,
            'limit': 20
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertIn('pagination', response.data)
```

#### 3. End-to-End Tests (10%)
```python
# Selenium-based E2E test
class JobSearchE2ETest(StaticLiveServerTestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.implicitly_wait(10)
    
    def test_complete_job_search_flow(self):
        # Test complete user flow
        self.driver.get(f'{self.live_server_url}/login')
        
        # Login
        self.driver.find_element(By.ID, 'email').send_keys('test@example.com')
        self.driver.find_element(By.ID, 'password').send_keys('testpass123')
        self.driver.find_element(By.ID, 'login-button').click()
        
        # Search for jobs
        search_box = self.driver.find_element(By.ID, 'job-search')
        search_box.send_keys('python developer')
        search_box.send_keys(Keys.RETURN)
        
        # Verify results
        results = self.driver.find_elements(By.CLASS_NAME, 'job-card')
        self.assertGreater(len(results), 0)
```

---

## Performance Benchmarks

### Key Performance Indicators

#### 1. Response Time Targets
- **Job Search API**: < 200ms (95th percentile)
- **Dashboard Load**: < 500ms (initial load)
- **AI Recommendations**: < 1s (cold start)
- **Real-time Notifications**: < 100ms

#### 2. Scalability Targets
- **Concurrent Users**: 10,000+ simultaneous users
- **Job Postings**: 1M+ active job postings
- **Search Queries**: 1,000+ queries/second
- **Database Connections**: 500+ concurrent connections

#### 3. Availability Requirements
- **Uptime**: 99.9% (8.77 hours downtime/year)
- **Data Durability**: 99.999999999% (11 9's)
- **Backup Recovery**: < 4 hours RTO
- **Disaster Recovery**: < 24 hours RTO

### Monitoring and Alerting
```python
# Performance monitoring
class PerformanceMonitor:
    def __init__(self):
        self.metrics = {
            'response_time': [],
            'error_rate': [],
            'throughput': [],
            'database_connections': []
        }
    
    def track_api_performance(self, endpoint, response_time, status_code):
        """
        Track API performance metrics
        """
        self.metrics['response_time'].append({
            'endpoint': endpoint,
            'time': response_time,
            'timestamp': timezone.now()
        })
        
        if status_code >= 400:
            self.metrics['error_rate'].append({
                'endpoint': endpoint,
                'status_code': status_code,
                'timestamp': timezone.now()
            })
    
    def generate_alerts(self):
        """
        Generate alerts based on performance thresholds
        """
        avg_response_time = self.calculate_avg_response_time()
        if avg_response_time > 500:  # 500ms threshold
            self.send_alert('HIGH_RESPONSE_TIME', avg_response_time)
```

---

## Troubleshooting & Common Pitfalls

### Environment Variable Issues

#### Problem: Login shows `localhost:8000` instead of production URL
**Root Cause**: Hardcoded URLs in frontend components
**Solution**: 
```typescript
// ❌ WRONG
const API_URL = "http://localhost:8000";

// ✅ CORRECT
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

#### Problem: Environment variables not loading in production
**Root Cause**: Conflicting .env files or missing NEXT_PUBLIC_ prefix
**Solution**:
1. Remove all .env files from repository
2. Use .env.local for local development only
3. Set environment variables directly in Render dashboard
4. Ensure frontend variables have NEXT_PUBLIC_ prefix

### Docker Issues

#### Problem: Docker build fails with permission errors
**Root Cause**: Running containers as root user
**Solution**:
```dockerfile
# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser
```

#### Problem: Static files not serving in production
**Root Cause**: Missing WhiteNoise configuration
**Solution**:
```python
# Django settings
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    'django.middleware.common.CommonMiddleware',
    # ... other middleware
]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

#### Problem: Docker image size too large
**Root Cause**: Not using multi-stage builds
**Solution**:
```dockerfile
# Use multi-stage build for Next.js
FROM node:18-alpine AS deps
# Install dependencies

FROM node:18-alpine AS builder
# Build application

FROM node:18-alpine AS runner
# Final optimized image
```

### Database Issues

#### Problem: Database connection failures
**Root Cause**: Incorrect connection parameters or network issues
**Solution**:
```python
# Add connection retry logic and proper error handling
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        'USER': env('POSTGRES_USER'),
        'PASSWORD': env('POSTGRES_PASSWORD'),
        'HOST': env('POSTGRES_HOST', default='localhost'),
        'PORT': env('POSTGRES_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'MAX_CONNS': 20,
            'connect_timeout': 10,
        }
    }
}
```

#### Problem: Migration failures during deployment
**Root Cause**: Database state inconsistency
**Solution**:
```bash
# Migration deployment strategy
python manage.py migrate --fake-initial
python manage.py migrate --run-syncdb
python manage.py migrate
```

### CORS and Security Issues

#### Problem: CORS errors in production
**Root Cause**: Incorrect CORS configuration
**Solution**:
```python
# Proper CORS configuration for EvolJobs
CORS_ALLOWED_ORIGINS = [
    "https://evoljobs.com",
    "https://www.evoljobs.com",
]

# For development
if DEBUG:
    CORS_ALLOWED_ORIGINS.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])
```

#### Problem: Mixed content warnings (HTTP/HTTPS)
**Root Cause**: HTTP requests from HTTPS site
**Solution**:
```typescript
// Always use HTTPS in production
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.evoljobs.com' 
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

### Performance Issues

#### Problem: Slow API responses
**Root Cause**: Unoptimized database queries
**Solutions**:
1. Enable database query optimization
2. Implement Redis caching
3. Add database indexing
4. Use database connection pooling

```python
# Database optimization
DATABASES = {
    'default': {
        # ... existing config
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'MAX_CONNS': 20,
        }
    }
}

# Redis caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

#### Problem: High memory usage in production
**Root Cause**: Memory leaks or inefficient code
**Solutions**:
1. Optimize Docker image layers
2. Use multi-stage builds
3. Implement proper garbage collection
4. Monitor memory usage with Prometheus

### Deployment Issues

#### Problem: Deployment fails with timeout
**Root Cause**: Long build times or resource constraints
**Solution**:
```yaml
# Optimize build process
- name: Build with caching
  run: |
    docker build --cache-from evoljobs-backend:latest -t evoljobs-backend:${{ github.sha }} .
```

#### Problem: Zero-downtime deployment not working
**Root Cause**: Improper health checks
**Solution**:
```python
# Proper health check endpoint
def health_check(request):
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        # Test cache connection
        cache.set("health_check", "ok", 30)
        
        return JsonResponse({"status": "healthy"})
    except Exception as e:
        return JsonResponse({"status": "unhealthy", "error": str(e)}, status=500)
```

### Monitoring and Debugging

#### Problem: Unable to debug production issues
**Root Cause**: Insufficient logging and monitoring
**Solution**:
```python
# Enhanced logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'evoljobs.log',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'evoljobs': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### Quick Diagnosis Commands

#### Check Environment Variables
```bash
# Backend environment check
python manage.py shell -c "
import os
print('DEBUG:', os.environ.get('DEBUG'))
print('DATABASE_URL:', os.environ.get('DATABASE_URL'))
print('CORS_ALLOWED_ORIGINS:', os.environ.get('CORS_ALLOWED_ORIGINS'))
"

# Frontend environment check (browser console)
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('WS URL:', process.env.NEXT_PUBLIC_WS_URL);
```

#### Check Database Connection
```bash
# Test database connection
python manage.py dbshell
# or
python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute('SELECT version();')
print(cursor.fetchone())
"
```

#### Check Static Files
```bash
# Verify static files collection
python manage.py collectstatic --dry-run
python manage.py findstatic admin/css/base.css
```

#### Check Docker Container Health
```bash
# Check container status
docker ps -a

# Check container logs
docker logs evoljobs-backend

# Execute commands in container
docker exec -it evoljobs-backend python manage.py check
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Rollback to previous deployment
curl -X POST "https://api.render.com/v1/services/evoljobs-backend/deploys/rollback" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

#### Scale Down/Up Services
```bash
# Scale down during maintenance
curl -X PATCH "https://api.render.com/v1/services/evoljobs-backend" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"plan": "free"}'
```

#### Database Backup
```bash
# Create database backup
pg_dump $DATABASE_URL > evoljobs_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql $DATABASE_URL < evoljobs_backup_20240101_120000.sql
```

---

This comprehensive development roadmap provides the technical foundation for building EvolJobs as a scalable, AI-powered job search platform. Each phase builds upon the previous one, ensuring a solid foundation while enabling rapid feature development and deployment. The integrated deployment guide and troubleshooting section ensure smooth production operations for the evoljobs.com platform. 
# JobPilot - AI-Powered Job Search Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/evoljobs/jobpilot)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue)](https://www.python.org/downloads/)
[![Django](https://img.shields.io/badge/django-4.2+-green)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/next.js-14.0+-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/react-18.2+-blue)](https://reactjs.org/)

JobPilot is an AI-driven job search and recruitment platform designed to revolutionize how job seekers discover opportunities and how employers find talent. Built with modern technologies including Django, Next.js, PostgreSQL, Redis, and Elasticsearch.

## ✨ Features

### 🔍 For Job Seekers
- **AI-Powered Job Matching**: Advanced algorithms match candidates with relevant opportunities
- **Smart Job Search**: Intelligent filters and search capabilities
- **Real-time Notifications**: Instant alerts for new jobs and application updates
- **Resume Builder & Parser**: AI-powered resume optimization
- **Application Tracking**: Complete application lifecycle management
- **Career Analytics**: Track your job search progress and success metrics

### 🏢 For Employers
- **Intelligent Candidate Screening**: AI-powered candidate matching
- **Application Management**: Streamlined hiring workflow
- **Company Profiles**: Showcase your organization and culture
- **Interview Scheduling**: Integrated calendar and meeting management
- **Analytics Dashboard**: Hiring metrics and performance insights
- **Multi-role Access**: Team collaboration tools

### 🤖 AI & ML Features
- **Job Recommendation Engine**: Personalized job suggestions
- **Skills Analysis**: Automatic skill extraction and matching
- **Resume Optimization**: AI-powered resume improvement suggestions
- **Sentiment Analysis**: Company review analysis
- **Predictive Analytics**: Success probability predictions

## 🏗️ Architecture

### Technology Stack

**Backend (Django)**
- Django 4.2+ with Django REST Framework
- PostgreSQL 15+ (Primary Database)
- Redis 7+ (Cache & Session Store)
- Elasticsearch 8+ (Search Engine)
- Celery 5+ (Task Queue)
- JWT Authentication
- Docker & Docker Compose

**Frontend (Next.js)**
- Next.js 14+ with React 18+
- Material-UI (MUI) 5+
- Redux Toolkit with RTK Query
- TypeScript
- Framer Motion (Animations)
- Socket.io (Real-time Updates)

**AI/ML Stack**
- TensorFlow 2.13+ & PyTorch 2.0+
- spaCy 3.6+ for NLP
- OpenAI API integration
- Vector Database (Pinecone/Weaviate)
- Sentence Transformers

**DevOps & Infrastructure**
- Docker & Docker Compose
- Render (Deployment Platform)
- GitHub Actions (CI/CD)
- WhiteNoise (Static Files)
- Gunicorn (WSGI Server)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/evoljobs/jobpilot.git
   cd jobpilot
   ```

2. **Copy environment template**
   ```bash
   cp environment.template .env.local
   ```

3. **Configure environment variables**
   Edit `.env.local` with your configuration:
   ```bash
   # Database
   POSTGRES_DB=evoljobs_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your-password
   
   # Django
   SECRET_KEY=your-secret-key
   DEBUG=true
   
   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

### Development Setup

#### Using Docker Compose (Recommended)

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

3. **Create superuser**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

4. **Load sample data (optional)**
   ```bash
   docker-compose exec backend python manage.py loaddata sample_data.json
   ```

#### Manual Setup

**Backend Setup**
```bash
cd Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend Setup**
```bash
cd Frontend
npm install
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/docs

## 📁 Project Structure

```
jobpilot/
├── Backend/                 # Django backend
│   ├── Backend/            # Django project settings
│   ├── apps/               # Django applications
│   │   ├── core/          # Core utilities
│   │   ├── authentication/ # Auth system
│   │   ├── users/         # User management
│   │   ├── companies/     # Company management
│   │   ├── jobs/          # Job postings
│   │   ├── applications/  # Job applications
│   │   ├── notifications/ # Real-time notifications
│   │   ├── subscriptions/ # Subscription management
│   │   ├── analytics/     # Analytics & reporting
│   │   ├── scrapers/      # Job scraping
│   │   ├── search/        # Elasticsearch integration
│   │   └── ai/            # AI/ML features
│   ├── requirements.txt
│   ├── Dockerfile
│   └── manage.py
├── Frontend/               # Next.js frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Next.js pages
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # Redux store
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── environment.template
├── .gitignore
└── README.md
```

## 🔧 Development

### Running Tests

**Backend Tests**
```bash
docker-compose exec backend python manage.py test
docker-compose exec backend pytest
```

**Frontend Tests**
```bash
cd Frontend
npm run test
npm run test:coverage
```

### Code Quality

**Backend Linting**
```bash
cd Backend
flake8 .
black .
isort .
```

**Frontend Linting**
```bash
cd Frontend
npm run lint
npm run type-check
```

### Database Management

**Create Migration**
```bash
docker-compose exec backend python manage.py makemigrations
```

**Apply Migrations**
```bash
docker-compose exec backend python manage.py migrate
```

**Database Shell**
```bash
docker-compose exec backend python manage.py dbshell
```

### Celery Tasks

**Start Celery Worker**
```bash
docker-compose exec celery_worker celery -A Backend worker --loglevel=info
```

**Start Celery Beat**
```bash
docker-compose exec celery_beat celery -A Backend beat --loglevel=info
```

## 🚢 Deployment

### Render Deployment

1. **Backend Service Configuration**
   ```yaml
   name: jobpilot-backend
   type: web
   env: docker
   dockerfilePath: Backend/Dockerfile
   envVars:
     - key: DATABASE_URL
       fromDatabase:
         name: jobpilot-db
         property: connectionString
     - key: SECRET_KEY
       generateValue: true
     - key: DEBUG
       value: "false"
   ```

2. **Frontend Service Configuration**
   ```yaml
   name: jobpilot-frontend
   type: web
   env: docker
   dockerfilePath: Frontend/Dockerfile
   envVars:
     - key: NEXT_PUBLIC_API_URL
       value: "https://api.evoljobs.com"
     - key: NODE_ENV
       value: "production"
   ```

3. **Database Configuration**
   ```yaml
   name: jobpilot-db
   type: postgres
   plan: free
   databaseName: jobpilot
   user: jobpilot_user
   ```

### Custom Domain Setup

1. **Configure DNS**
   ```
   Type: CNAME
   Name: api
   Value: jobpilot-backend.onrender.com
   
   Type: CNAME
   Name: www
   Value: jobpilot-frontend.onrender.com
   ```

2. **Update Environment Variables**
   ```bash
   ALLOWED_HOSTS=api.evoljobs.com,evoljobs.com
   CORS_ALLOWED_ORIGINS=https://evoljobs.com,https://www.evoljobs.com
   ```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/logout/` - User logout
- `POST /api/v1/auth/token/refresh/` - Token refresh

### Job Endpoints
- `GET /api/v1/jobs/` - List jobs
- `GET /api/v1/jobs/{id}/` - Get job details
- `POST /api/v1/jobs/` - Create job (employers only)
- `PUT /api/v1/jobs/{id}/` - Update job
- `DELETE /api/v1/jobs/{id}/` - Delete job

### Application Endpoints
- `GET /api/v1/applications/` - List applications
- `POST /api/v1/applications/` - Submit application
- `GET /api/v1/applications/{id}/` - Get application details
- `PUT /api/v1/applications/{id}/` - Update application status

For complete API documentation, visit: http://localhost:8000/api/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart database service
docker-compose restart postgres
```

**Frontend Build Error**
```bash
# Clear Next.js cache
rm -rf Frontend/.next
npm run build
```

**Celery Tasks Not Running**
```bash
# Check Celery worker status
docker-compose logs celery_worker

# Restart Celery services
docker-compose restart celery_worker celery_beat
```

### Performance Optimization

1. **Database Optimization**
   - Add database indexes
   - Use select_related() and prefetch_related()
   - Implement database connection pooling

2. **Frontend Optimization**
   - Use React.memo for components
   - Implement code splitting
   - Optimize images and assets

3. **Caching Strategy**
   - Redis for API caching
   - Browser caching for static assets
   - CDN for media files

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Django](https://www.djangoproject.com/) - Web framework
- [Next.js](https://nextjs.org/) - React framework
- [Material-UI](https://mui.com/) - UI components
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Cache and session store
- [Elasticsearch](https://www.elastic.co/) - Search engine
- [Render](https://render.com/) - Deployment platform

## 📞 Support

For support, email support@evoljobs.com or join our [Discord community](https://discord.gg/evoljobs).

---

**JobPilot** - Revolutionizing job search with AI-powered matching and intelligent career guidance.

Made with ❤️ by the EvolJobs Team 
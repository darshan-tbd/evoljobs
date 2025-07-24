from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from datetime import datetime, timedelta
import subprocess
import os
import threading
import json

from .models import JobScraper, ScrapedJob
from apps.jobs.models import JobPosting
from apps.companies.models import Company
from apps.core.models import Location
from apps.users.models import User
from django.utils.text import slugify

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def scraper_stats(request):
    """Get scraper statistics for admin dashboard"""
    try:
        # Get date ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        
        # Total jobs by source
        total_jobs = JobPosting.objects.count()
        
        # Jobs by external source
        jobs_by_source = JobPosting.objects.filter(
            external_source__isnull=False
        ).values('external_source').annotate(
            count=Count('id')
        )
        
        # Convert to dict for easier access
        source_counts = {}
        for item in jobs_by_source:
            source_counts[item['external_source'].lower().replace(' ', '_')] = item['count']
        
        # Recent activity
        jobs_today = JobPosting.objects.filter(
            created_at__date=today
        ).count()
        
        jobs_this_week = JobPosting.objects.filter(
            created_at__date__gte=week_ago
        ).count()
        
        # Recent scraped jobs
        recent_jobs = JobPosting.objects.filter(
            external_source__isnull=False
        ).order_by('-created_at')[:20]
        
        recent_jobs_data = []
        for job in recent_jobs:
            recent_jobs_data.append({
                'id': str(job.id),
                'title': job.title,
                'company': job.company.name if job.company else 'Unknown',
                'location': job.location.name if job.location else 'Not specified',
                'external_source': job.external_source,
                'external_url': job.external_url,
                'created_at': job.created_at.isoformat(),
                'status': job.status
            })
        
        stats = {
            'total_jobs': total_jobs,
            'jobs_by_source': source_counts,
            'recent_activity': {
                'new_jobs_today': jobs_today,
                'new_jobs_this_week': jobs_this_week,
            },
            'recent_jobs': recent_jobs_data
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def run_scraper(request, scraper_id):
    """Run a specific scraper"""
    try:
        scraper_id = scraper_id.lower()
        
        # Map scraper IDs to script names
        scraper_scripts = {
            'michael-page': 'fetch_michael_page_job.py',
            'pro-bono': 'scrape_probonoaustralia.py',
            'service-seeking': 'scrape_serviceseeking.py'
        }
        
        if scraper_id not in scraper_scripts:
            return Response(
                {'error': 'Invalid scraper ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        script_name = scraper_scripts[scraper_id]
        script_path = os.path.join(os.path.dirname(__file__), '..', script_name)
        
        # Check if script exists
        if not os.path.exists(script_path):
            return Response(
                {'error': f'Scraper script {script_name} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Run scraper in background thread
        def run_scraper_async():
            try:
                result = subprocess.run(
                    ['python', script_path],
                    capture_output=True,
                    text=True,
                    cwd=os.path.dirname(script_path)
                )
                
                # Log the result
                print(f"Scraper {scraper_id} completed with return code: {result.returncode}")
                if result.stdout:
                    print(f"Output: {result.stdout}")
                if result.stderr:
                    print(f"Errors: {result.stderr}")
                    
            except Exception as e:
                print(f"Error running scraper {scraper_id}: {str(e)}")
        
        # Start scraper in background
        thread = threading.Thread(target=run_scraper_async)
        thread.daemon = True
        thread.start()
        
        return Response({
            'message': f'Scraper {scraper_id} started successfully',
            'scraper_id': scraper_id,
            'status': 'running'
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def scraper_status(request):
    """Get status of all scrapers"""
    try:
        scrapers = [
            {
                'id': 'michael-page',
                'name': 'Michael Page Australia',
                'description': 'Professional recruitment agency jobs',
                'source_url': 'https://www.michaelpage.com.au/jobs',
                'status': 'active',
                'last_run': '2024-01-15T10:30:00Z',
                'jobs_scraped': JobPosting.objects.filter(external_source='Michael Page').count(),
                'success_rate': 95,
                'avg_response_time': 2.5,
                'is_enabled': True,
                'schedule': 'Daily at 2:00 AM',
            },
            {
                'id': 'pro-bono',
                'name': 'Pro Bono Australia',
                'description': 'Non-profit and community sector jobs',
                'source_url': 'https://www.probonoaustralia.com.au/jobs/',
                'status': 'active',
                'last_run': '2024-01-15T09:15:00Z',
                'jobs_scraped': JobPosting.objects.filter(external_source='Pro Bono Australia').count(),
                'success_rate': 88,
                'avg_response_time': 3.2,
                'is_enabled': True,
                'schedule': 'Daily at 3:00 AM',
            },
            {
                'id': 'service-seeking',
                'name': 'ServiceSeeking',
                'description': 'Freelance and service-based jobs',
                'source_url': 'https://www.serviceseeking.com.au/job-requests/',
                'status': 'active',
                'last_run': '2024-01-15T08:45:00Z',
                'jobs_scraped': JobPosting.objects.filter(external_source='ServiceSeeking').count(),
                'success_rate': 92,
                'avg_response_time': 2.8,
                'is_enabled': True,
                'schedule': 'Daily at 4:00 AM',
            },
        ]
        
        return Response({
            'scrapers': scrapers,
            'total_scrapers': len(scrapers),
            'active_scrapers': len([s for s in scrapers if s['is_enabled']]),
            'total_jobs_scraped': sum(s['jobs_scraped'] for s in scrapers),
            'average_success_rate': sum(s['success_rate'] for s in scrapers) / len(scrapers)
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def recent_scraped_jobs(request):
    """Get recent scraped jobs"""
    try:
        # Get query parameters
        limit = int(request.GET.get('limit', 20))
        source = request.GET.get('source', None)
        
        # Build query
        queryset = JobPosting.objects.filter(external_source__isnull=False)
        
        if source and source != 'all':
            queryset = queryset.filter(external_source__icontains=source)
        
        # Get recent jobs
        recent_jobs = queryset.order_by('-created_at')[:limit]
        
        jobs_data = []
        for job in recent_jobs:
            jobs_data.append({
                'id': str(job.id),
                'title': job.title,
                'company': job.company.name if job.company else 'Unknown',
                'location': job.location.name if job.location else 'Not specified',
                'external_source': job.external_source,
                'external_url': job.external_url,
                'created_at': job.created_at.isoformat(),
                'status': job.status,
                'salary_min': job.salary_min,
                'salary_max': job.salary_max,
                'salary_currency': job.salary_currency,
                'job_type': job.job_type,
            })
        
        return Response({
            'jobs': jobs_data,
            'total': len(jobs_data),
            'filters': {
                'source': source,
                'limit': limit
            }
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def scraper_logs(request):
    """Get scraper execution logs"""
    try:
        # This would typically read from log files
        # For now, return mock data
        logs = [
            {
                'id': '1',
                'scraper_name': 'Michael Page Australia',
                'status': 'completed',
                'jobs_scraped': 45,
                'start_time': '2024-01-15T10:30:00Z',
                'end_time': '2024-01-15T10:35:00Z',
                'duration_seconds': 300,
                'error_message': None,
            },
            {
                'id': '2',
                'scraper_name': 'Pro Bono Australia',
                'status': 'completed',
                'jobs_scraped': 23,
                'start_time': '2024-01-15T09:15:00Z',
                'end_time': '2024-01-15T09:18:00Z',
                'duration_seconds': 180,
                'error_message': None,
            },
            {
                'id': '3',
                'scraper_name': 'ServiceSeeking',
                'status': 'failed',
                'jobs_scraped': 0,
                'start_time': '2024-01-15T08:45:00Z',
                'end_time': '2024-01-15T08:47:00Z',
                'duration_seconds': 120,
                'error_message': 'Connection timeout',
            },
        ]
        
        return Response({
            'logs': logs,
            'total_logs': len(logs),
            'successful_runs': len([log for log in logs if log['status'] == 'completed']),
            'failed_runs': len([log for log in logs if log['status'] == 'failed']),
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 
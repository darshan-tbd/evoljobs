from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, Min, Max
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import JobPosting, JobView, SavedJob, JobAlert
from .serializers import JobPostingSerializer, JobPostingListSerializer, JobViewSerializer, SavedJobSerializer, JobAlertSerializer
from apps.ai.services import job_matching_service
import logging

logger = logging.getLogger(__name__)

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.filter(status='active', is_deleted=False).select_related('company', 'location', 'industry').prefetch_related('required_skills', 'preferred_skills')
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job_type', 'experience_level', 'remote_option', 'company', 'industry', 'status']
    search_fields = ['title', 'description', 'company__name', 'location__name', 'location__city', 'location__state', 'location__country', 'required_skills__name', 'industry__name']
    ordering_fields = ['created_at', 'title', 'salary_min', 'salary_max', 'views_count', 'applications_count', 'application_deadline']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Get queryset based on user permissions and request parameters
        """
        base_queryset = JobPosting.objects.select_related('company', 'location', 'industry').prefetch_related('required_skills', 'preferred_skills')
        
        # Check if this is an admin request
        is_admin_request = self.request.query_params.get('admin', '').lower() == 'true'
        
        if is_admin_request and self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
            # Admin users can see all jobs including drafts, inactive, and deleted
            queryset = base_queryset.all()
        else:
            # Regular users only see active, non-deleted jobs
            queryset = base_queryset.filter(status='active', is_deleted=False)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobPostingListSerializer
        return JobPostingSerializer
    
    def get_queryset_with_filters(self):
        queryset = self.get_queryset()
        query_params = self.request.query_params
        
        # Enhanced keyword search
        q = query_params.get('q', None)
        if q:
            queryset = queryset.filter(
                Q(title__icontains=q) |
                Q(description__icontains=q) |
                Q(company__name__icontains=q) |
                Q(required_skills__name__icontains=q) |
                Q(preferred_skills__name__icontains=q) |
                Q(industry__name__icontains=q) |
                Q(location__name__icontains=q) |
                Q(location__city__icontains=q) |
                Q(location__state__icontains=q) |
                Q(location__country__icontains=q)
            ).distinct()
        
        # Enhanced location filter
        location = query_params.get('location', None)
        if location:
            queryset = queryset.filter(
                Q(location__name__icontains=location) |
                Q(location__city__icontains=location) |
                Q(location__state__icontains=location) |
                Q(location__country__icontains=location)
            )
        
        # Enhanced salary range filter
        salary_min = query_params.get('salary_min', None)
        salary_max = query_params.get('salary_max', None)
        if salary_min:
            queryset = queryset.filter(
                Q(salary_min__gte=salary_min) | Q(salary_min__isnull=True)
            )
        if salary_max:
            queryset = queryset.filter(
                Q(salary_max__lte=salary_max) | Q(salary_max__isnull=True)
            )
        
        # Skills filter (multiple skills)
        skills = query_params.get('skills', None)
        if skills:
            skill_list = skills.split(',')
            queryset = queryset.filter(
                Q(required_skills__name__in=skill_list) |
                Q(preferred_skills__name__in=skill_list)
            ).distinct()
        
        # Date posted filter
        date_posted = query_params.get('date_posted', None)
        if date_posted:
            now = timezone.now()
            if date_posted == 'today':
                queryset = queryset.filter(created_at__date=now.date())
            elif date_posted == 'week':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=7))
            elif date_posted == 'month':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=30))
            elif date_posted == 'quarter':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=90))
        
        # Company filter (multiple companies)
        companies = query_params.get('companies', None)
        if companies:
            company_list = companies.split(',')
            queryset = queryset.filter(company__name__in=company_list)
        
        # Industry filter (multiple industries)
        industries = query_params.get('industries', None)
        if industries:
            industry_list = industries.split(',')
            queryset = queryset.filter(industry__name__in=industry_list)
        
        # Job type filter (multiple types)
        job_types = query_params.get('job_types', None)
        if job_types:
            job_type_list = job_types.split(',')
            queryset = queryset.filter(job_type__in=job_type_list)
        
        # Experience level filter (multiple levels)
        experience_levels = query_params.get('experience_levels', None)
        if experience_levels:
            experience_level_list = experience_levels.split(',')
            queryset = queryset.filter(experience_level__in=experience_level_list)
        
        # Remote option filter (multiple options)
        remote_options = query_params.get('remote_options', None)
        if remote_options:
            remote_option_list = remote_options.split(',')
            queryset = queryset.filter(remote_option__in=remote_option_list)
        
        # Featured jobs filter
        featured_only = query_params.get('featured_only', None)
        if featured_only and featured_only.lower() == 'true':
            queryset = queryset.filter(is_featured=True)
        
        # Application deadline filter
        has_deadline = query_params.get('has_deadline', None)
        if has_deadline and has_deadline.lower() == 'true':
            queryset = queryset.filter(application_deadline__isnull=False)
        
        # Exclude expired jobs
        exclude_expired = query_params.get('exclude_expired', None)
        if exclude_expired and exclude_expired.lower() == 'true':
            queryset = queryset.filter(
                Q(application_deadline__isnull=True) |
                Q(application_deadline__gt=timezone.now())
            )
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to use filtered queryset"""
        queryset = self.get_queryset_with_filters()
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def get_permissions(self):
        """
        Instantiate and return the list of permissions required for this view.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only staff users can create, update, or delete jobs
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            # Anyone can view jobs
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, slug=None):
        """
        Update job status (admin only)
        PATCH /api/v1/jobs/{slug}/update_status/
        """
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        job = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(JobPosting.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        job.status = new_status
        job.save()
        
        serializer = self.get_serializer(job)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def toggle_featured(self, request, slug=None):
        """
        Toggle featured status (admin only)
        PATCH /api/v1/jobs/{slug}/toggle_featured/
        """
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        job = self.get_object()
        job.is_featured = not job.is_featured
        job.save()
        
        serializer = self.get_serializer(job)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Enhanced search endpoint with faceted filtering
        GET /api/v1/jobs/search/?q=python&location=new+york&job_type=full_time
        """
        queryset = self.get_queryset_with_filters()
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    
    @action(detail=False, methods=['get'])
    def facets(self, request):
        """
        Get faceted search data for filters
        GET /api/v1/jobs/facets/
        """
        queryset = self.get_queryset_with_filters()
        
        # Get all available filter options with counts
        facets = {
            'job_types': list(queryset.values('job_type').annotate(count=Count('id')).order_by('-count')),
            'experience_levels': list(queryset.values('experience_level').annotate(count=Count('id')).order_by('-count')),
            'remote_options': list(queryset.values('remote_option').annotate(count=Count('id')).order_by('-count')),
            'companies': list(queryset.values('company__name').annotate(count=Count('id')).order_by('-count')[:20]),
            'industries': list(queryset.values('industry__name').annotate(count=Count('id')).order_by('-count')),
            'locations': list(queryset.values('location__name', 'location__city', 'location__state', 'location__country').annotate(count=Count('id')).order_by('-count')[:20]),
            'skills': list(queryset.values('required_skills__name').annotate(count=Count('id')).order_by('-count')[:30]),
            'salary_stats': queryset.aggregate(
                min_salary=Min('salary_min'),
                max_salary=Max('salary_max'),
                avg_salary=Avg('salary_min')
            )
        }
        
        return Response(facets)
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """
        Get trending jobs (most viewed/applied)
        GET /api/v1/jobs/trending/
        """
        queryset = self.get_queryset()
        
        # Get trending jobs by views and applications
        trending_jobs = queryset.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-views_count', '-applications_count')[:10]
        
        serializer = self.get_serializer(trending_jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recently posted jobs
        GET /api/v1/jobs/recent/
        """
        queryset = self.get_queryset()
        
        # Get recent jobs (last 24 hours)
        recent_jobs = queryset.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-created_at')[:20]
        
        serializer = self.get_serializer(recent_jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def similar(self, request):
        """
        Get similar jobs based on skills and industry
        GET /api/v1/jobs/similar/?job_id=123
        """
        job_id = request.query_params.get('job_id')
        if not job_id:
            return Response({'error': 'job_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            job = JobPosting.objects.get(id=job_id)
            queryset = self.get_queryset().exclude(id=job_id)
            
            # Find similar jobs based on skills and industry
            similar_jobs = queryset.filter(
                Q(required_skills__in=job.required_skills.all()) |
                Q(preferred_skills__in=job.preferred_skills.all()) |
                Q(industry=job.industry)
            ).distinct().order_by('-created_at')[:10]
            
            serializer = self.get_serializer(similar_jobs, many=True)
            return Response(serializer.data)
            
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """
        Get recommended jobs for the current user based on their profile
        GET /api/v1/jobs/recommended/ or /api/recommended-jobs/
        """
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get limit parameter
        limit = int(request.query_params.get('limit', 10))
        limit = min(limit, 50)  # Cap at 50 jobs
        
        try:
            # Use existing job matching service
            recommended_jobs = job_matching_service.get_recommended_jobs(request.user, limit)
            
            if not recommended_jobs:
                return Response({
                    'success': True,
                    'results': [],
                    'count': 0,
                    'message': 'No recommendations found. Complete your profile for better matches.'
                })
            
            # Format results for frontend
            results = []
            for item in recommended_jobs:
                job_data = JobPostingListSerializer(item['job']).data
                job_data['match_score'] = round(item['match_score'], 1)
                job_data['match_breakdown'] = item['match_breakdown']
                job_data['match_explanation'] = job_matching_service.get_match_explanation(
                    request.user, item['job']
                )
                results.append(job_data)
            
            return Response({
                'success': True,
                'results': results,
                'count': len(results),
                'message': f'Found {len(results)} recommended jobs'
            })
            
        except Exception as e:
            logger.error(f"Error getting job recommendations: {str(e)}")
            return Response({
                'success': False,
                'error': 'Failed to get job recommendations',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SavedJobViewSet(viewsets.ModelViewSet):
    serializer_class = SavedJobSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """
        Toggle saved status for a job
        POST /api/v1/jobs/saved-jobs/toggle/ with {"job": job_id}
        """
        job_id = request.data.get('job')
        if not job_id:
            return Response({'error': 'Job ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import JobPosting
            job = JobPosting.objects.get(id=job_id)
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        saved_job, created = SavedJob.objects.get_or_create(
            user=request.user,
            job=job,
            defaults={'user': request.user, 'job': job}
        )
        
        if not created:
            # Job was already saved, so remove it
            saved_job.delete()
            return Response({'saved': False, 'message': 'Job removed from saved jobs'})
        else:
            # Job was just saved
            return Response({'saved': True, 'message': 'Job saved successfully'})
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def check(self, request):
        """
        Check if jobs are saved
        GET /api/v1/jobs/saved-jobs/check/?jobs=1,2,3
        """
        job_ids = request.query_params.get('jobs', '').split(',')
        if not job_ids or job_ids == ['']:
            return Response({'saved_jobs': []})
        
        # Return empty list for unauthenticated users
        if not request.user.is_authenticated:
            return Response({'saved_jobs': []})
        
        try:
            # Convert string IDs to UUIDs
            saved_jobs = SavedJob.objects.filter(
                user=request.user,
                job__id__in=job_ids
            ).values_list('job__id', flat=True)
            
            return Response({
                'saved_jobs': [str(job_id) for job_id in saved_jobs]
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class JobAlertViewSet(viewsets.ModelViewSet):
    serializer_class = JobAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return JobAlert.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user) 
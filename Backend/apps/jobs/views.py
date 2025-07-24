from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Avg, Min, Max
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import JobPosting, JobView, SavedJob, JobAlert
from .serializers import JobPostingSerializer, JobPostingListSerializer, JobViewSerializer, SavedJobSerializer, JobAlertSerializer
from .serializers import AdminJobPostingSerializer, AdminJobViewSerializer, AdminSavedJobSerializer, AdminJobAlertSerializer
from apps.ai.services import job_matching_service
import logging

logger = logging.getLogger(__name__)

class JobPagination(PageNumberPagination):
    """
    Custom pagination class for jobs
    """
    page_size = 9
    page_size_query_param = 'page_size'
    max_page_size = 50

class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.filter(status='active', is_deleted=False).select_related('company', 'location', 'industry').prefetch_related('required_skills', 'preferred_skills')
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    pagination_class = JobPagination
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
        """
        Apply additional filters to the queryset
        """
        queryset = self.get_queryset()
        query_params = self.request.query_params
        
        # Location filter
        location = query_params.get('location', None)
        if location:
            queryset = queryset.filter(
                Q(location__name__icontains=location) |
                Q(location__city__icontains=location) |
                Q(location__state__icontains=location) |
                Q(location__country__icontains=location)
            )
        
        # Salary range filter
        min_salary = query_params.get('min_salary', None)
        max_salary = query_params.get('max_salary', None)
        if min_salary:
            queryset = queryset.filter(salary_min__gte=min_salary)
        if max_salary:
            queryset = queryset.filter(salary_max__lte=max_salary)
        
        # Skills filter
        skills = query_params.get('skills', None)
        if skills:
            skill_list = [skill.strip() for skill in skills.split(',')]
            queryset = queryset.filter(
                Q(required_skills__name__in=skill_list) |
                Q(preferred_skills__name__in=skill_list)
            ).distinct()
        
        # Company filter
        company = query_params.get('company', None)
        if company:
            queryset = queryset.filter(company__name__icontains=company)
        
        # Industry filter
        industry = query_params.get('industry', None)
        if industry:
            queryset = queryset.filter(industry__name__icontains=industry)
        
        # Job type filter
        job_type = query_params.get('job_type', None)
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        
        # Experience level filter
        experience_level = query_params.get('experience_level', None)
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)
        
        # Remote option filter
        remote_option = query_params.get('remote_option', None)
        if remote_option:
            queryset = queryset.filter(remote_option=remote_option)
        
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

class JobViewViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = JobView.objects.all()
    serializer_class = JobViewSerializer
    permission_classes = [permissions.IsAuthenticated]

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

class AdminJobPostingViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all job postings
    """
    serializer_class = AdminJobPostingSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = JobPosting.objects.all()
    lookup_field = 'slug'
    pagination_class = JobPagination
    
    def get_queryset(self):
        queryset = JobPosting.objects.all().select_related('company', 'location', 'industry', 'posted_by').prefetch_related('required_skills', 'preferred_skills')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(company__name__icontains=search) |
                Q(location__name__icontains=search)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by featured status
        featured = self.request.query_params.get('featured', None)
        if featured is not None:
            if featured.lower() == 'true':
                queryset = queryset.filter(is_featured=True)
            elif featured.lower() == 'false':
                queryset = queryset.filter(is_featured=False)
        
        # Filter by company
        company = self.request.query_params.get('company', None)
        if company:
            queryset = queryset.filter(company_id=company)
        
        # Filter by job type
        job_type = self.request.query_params.get('job_type', None)
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        
        # Filter by experience level
        experience_level = self.request.query_params.get('experience_level', None)
        if experience_level:
            queryset = queryset.filter(experience_level=experience_level)
        
        # Filter by remote option
        remote_option = self.request.query_params.get('remote_option', None)
        if remote_option:
            queryset = queryset.filter(remote_option=remote_option)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, slug=None):
        """Update job status"""
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
        """Toggle featured status"""
        job = self.get_object()
        job.is_featured = not job.is_featured
        job.save()
        
        serializer = self.get_serializer(job)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get job statistics"""
        total_jobs = JobPosting.objects.count()
        active_jobs = JobPosting.objects.filter(status='active').count()
        draft_jobs = JobPosting.objects.filter(status='draft').count()
        closed_jobs = JobPosting.objects.filter(status='closed').count()
        featured_jobs = JobPosting.objects.filter(is_featured=True).count()
        
        # Job types
        full_time_jobs = JobPosting.objects.filter(job_type='full_time').count()
        part_time_jobs = JobPosting.objects.filter(job_type='part_time').count()
        contract_jobs = JobPosting.objects.filter(job_type='contract').count()
        internship_jobs = JobPosting.objects.filter(job_type='internship').count()
        
        # Experience levels
        entry_jobs = JobPosting.objects.filter(experience_level='entry').count()
        mid_jobs = JobPosting.objects.filter(experience_level='mid').count()
        senior_jobs = JobPosting.objects.filter(experience_level='senior').count()
        executive_jobs = JobPosting.objects.filter(experience_level='executive').count()
        
        # Recent activity
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        new_jobs_today = JobPosting.objects.filter(created_at__date=today).count()
        new_jobs_this_week = JobPosting.objects.filter(created_at__date__gte=week_ago).count()
        new_jobs_this_month = JobPosting.objects.filter(created_at__date__gte=month_ago).count()
        
        return Response({
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'draft_jobs': draft_jobs,
            'closed_jobs': closed_jobs,
            'featured_jobs': featured_jobs,
            'job_types': {
                'full_time': full_time_jobs,
                'part_time': part_time_jobs,
                'contract': contract_jobs,
                'internship': internship_jobs,
            },
            'experience_levels': {
                'entry': entry_jobs,
                'mid': mid_jobs,
                'senior': senior_jobs,
                'executive': executive_jobs,
            },
            'recent_activity': {
                'new_jobs_today': new_jobs_today,
                'new_jobs_this_week': new_jobs_this_week,
                'new_jobs_this_month': new_jobs_this_month,
            }
        })
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent job activity"""
        limit = int(request.query_params.get('limit', 10))
        
        recent_jobs = JobPosting.objects.order_by('-created_at')[:limit]
        
        return Response({
            'recent_jobs': AdminJobPostingSerializer(recent_jobs, many=True).data,
        })

class AdminJobViewViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for job views
    """
    serializer_class = AdminJobViewSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = JobView.objects.all()
    
    def get_queryset(self):
        queryset = JobView.objects.all().select_related('job', 'user')
        
        # Filter by job
        job = self.request.query_params.get('job', None)
        if job:
            queryset = queryset.filter(job_id=job)
        
        # Filter by user
        user = self.request.query_params.get('user', None)
        if user:
            queryset = queryset.filter(user_id=user)
        
        return queryset.order_by('-created_at')

class AdminSavedJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for saved jobs
    """
    serializer_class = AdminSavedJobSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = SavedJob.objects.all()
    
    def get_queryset(self):
        queryset = SavedJob.objects.all().select_related('job', 'user')
        
        # Filter by job
        job = self.request.query_params.get('job', None)
        if job:
            queryset = queryset.filter(job_id=job)
        
        # Filter by user
        user = self.request.query_params.get('user', None)
        if user:
            queryset = queryset.filter(user_id=user)
        
        return queryset.order_by('-created_at')

class AdminJobAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for job alerts
    """
    serializer_class = AdminJobAlertSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = JobAlert.objects.all()
    
    def get_queryset(self):
        queryset = JobAlert.objects.all().select_related('user', 'location')
        
        # Filter by user
        user = self.request.query_params.get('user', None)
        if user:
            queryset = queryset.filter(user_id=user)
        
        # Filter by active status
        active = self.request.query_params.get('active', None)
        if active is not None:
            if active.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif active.lower() == 'false':
                queryset = queryset.filter(is_active=False)
        
        return queryset.order_by('-created_at') 
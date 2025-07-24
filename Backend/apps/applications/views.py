from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import JobApplication, ApplicationStatusHistory, Interview, ApplicationDocument
from .serializers import JobApplicationSerializer, ApplicationStatusHistorySerializer, InterviewSerializer, ApplicationDocumentSerializer
from .serializers import AdminJobApplicationSerializer, AdminApplicationStatusHistorySerializer, AdminInterviewSerializer, AdminApplicationDocumentSerializer
from .serializers import ExternalJobApplicationSerializer
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return JobApplication.objects.filter(applicant=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)
    
    @action(detail=False, methods=['post'])
    def quick_apply(self, request):
        """
        Quick apply to a job without going through the full application form
        """
        job_id = request.data.get('job_id')
        
        if not job_id:
            return Response(
                {'error': 'Job ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already applied to this job
        existing_application = JobApplication.objects.filter(
            job_id=job_id,
            applicant=request.user
        ).first()
        
        if existing_application:
            return Response(
                {'error': 'You have already applied to this job'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create a simple application
            application = JobApplication.objects.create(
                job_id=job_id,
                applicant=request.user,
                status='pending',
                cover_letter='Quick application submitted via Apply Now button'
            )
            
            serializer = self.get_serializer(application)
            return Response(
                {
                    'message': 'Application submitted successfully!',
                    'application': serializer.data
                }, 
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to submit application: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ApplicationStatusHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationStatusHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ApplicationStatusHistory.objects.filter(application__applicant=self.request.user)

class InterviewViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Interview.objects.filter(application__applicant=self.request.user)

class ApplicationDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ApplicationDocument.objects.filter(application__applicant=self.request.user)

class AdminJobApplicationViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all job applications
    """
    serializer_class = AdminJobApplicationSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = JobApplication.objects.all()
    
    def get_queryset(self):
        queryset = JobApplication.objects.all().select_related(
            'job', 'applicant', 'reviewed_by', 'job__company'
        )
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(job__title__icontains=search) |
                Q(applicant__first_name__icontains=search) |
                Q(applicant__last_name__icontains=search) |
                Q(applicant__email__icontains=search) |
                Q(job__company__name__icontains=search)
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by job
        job = self.request.query_params.get('job', None)
        if job:
            queryset = queryset.filter(job_id=job)
        
        # Filter by applicant
        applicant = self.request.query_params.get('applicant', None)
        if applicant:
            queryset = queryset.filter(applicant_id=applicant)
        
        # Filter by company
        company = self.request.query_params.get('company', None)
        if company:
            queryset = queryset.filter(job__company_id=company)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(applied_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(applied_at__date__lte=date_to)
        
        return queryset.order_by('-applied_at')
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update application status"""
        application = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status not in dict(JobApplication.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create status history entry
        ApplicationStatusHistory.objects.create(
            application=application,
            previous_status=application.status,
            new_status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        # Update application status
        application.status = new_status
        application.reviewed_by = request.user
        application.reviewed_at = timezone.now()
        application.employer_notes = notes
        application.save()
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get application statistics"""
        total_applications = JobApplication.objects.count()
        pending_applications = JobApplication.objects.filter(status='pending').count()
        reviewing_applications = JobApplication.objects.filter(status='reviewing').count()
        shortlisted_applications = JobApplication.objects.filter(status='shortlisted').count()
        interviewed_applications = JobApplication.objects.filter(status='interviewed').count()
        offered_applications = JobApplication.objects.filter(status='offered').count()
        hired_applications = JobApplication.objects.filter(status='hired').count()
        rejected_applications = JobApplication.objects.filter(status='rejected').count()
        withdrawn_applications = JobApplication.objects.filter(status='withdrawn').count()
        
        # Recent activity
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        new_applications_today = JobApplication.objects.filter(applied_at__date=today).count()
        new_applications_this_week = JobApplication.objects.filter(applied_at__date__gte=week_ago).count()
        new_applications_this_month = JobApplication.objects.filter(applied_at__date__gte=month_ago).count()
        
        return Response({
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'reviewing_applications': reviewing_applications,
            'shortlisted_applications': shortlisted_applications,
            'interviewed_applications': interviewed_applications,
            'offered_applications': offered_applications,
            'hired_applications': hired_applications,
            'rejected_applications': rejected_applications,
            'withdrawn_applications': withdrawn_applications,
            'recent_activity': {
                'new_applications_today': new_applications_today,
                'new_applications_this_week': new_applications_this_week,
                'new_applications_this_month': new_applications_this_month,
            }
        })
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent application activity"""
        limit = int(request.query_params.get('limit', 10))
        
        recent_applications = JobApplication.objects.order_by('-applied_at')[:limit]
        
        return Response({
            'recent_applications': AdminJobApplicationSerializer(recent_applications, many=True).data,
        })

class AdminApplicationStatusHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for application status history
    """
    serializer_class = AdminApplicationStatusHistorySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = ApplicationStatusHistory.objects.all()
    
    def get_queryset(self):
        queryset = ApplicationStatusHistory.objects.all().select_related(
            'application', 'application__job', 'application__applicant', 'changed_by'
        )
        
        # Filter by application
        application = self.request.query_params.get('application', None)
        if application:
            queryset = queryset.filter(application_id=application)
        
        # Filter by changed by
        changed_by = self.request.query_params.get('changed_by', None)
        if changed_by:
            queryset = queryset.filter(changed_by_id=changed_by)
        
        return queryset.order_by('-created_at')

class AdminInterviewViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing interviews
    """
    serializer_class = AdminInterviewSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Interview.objects.all()
    
    def get_queryset(self):
        queryset = Interview.objects.all().select_related(
            'application', 'application__job', 'application__applicant', 'interviewer'
        )
        
        # Filter by application
        application = self.request.query_params.get('application', None)
        if application:
            queryset = queryset.filter(application_id=application)
        
        # Filter by interviewer
        interviewer = self.request.query_params.get('interviewer', None)
        if interviewer:
            queryset = queryset.filter(interviewer_id=interviewer)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by interview type
        interview_type = self.request.query_params.get('interview_type', None)
        if interview_type:
            queryset = queryset.filter(interview_type=interview_type)
        
        return queryset.order_by('-scheduled_at')
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update interview status"""
        interview = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Interview.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        interview.status = new_status
        interview.save()
        
        serializer = self.get_serializer(interview)
        return Response(serializer.data)

class AdminApplicationDocumentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for application documents
    """
    serializer_class = AdminApplicationDocumentSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = ApplicationDocument.objects.all()
    
    def get_queryset(self):
        queryset = ApplicationDocument.objects.all().select_related('application')
        
        # Filter by application
        application = self.request.query_params.get('application', None)
        if application:
            queryset = queryset.filter(application_id=application)
        
        # Filter by document type
        document_type = self.request.query_params.get('document_type', None)
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        
        return queryset.order_by('-created_at')

class ExternalApplicationViewSet(viewsets.ModelViewSet):
    """
    Viewset for creating external job applications
    """
    serializer_class = ExternalJobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            # Admins can see all external applications
            return JobApplication.objects.filter(is_external_application=True).select_related('job', 'applicant', 'job__company')
        else:
            # Users can only see their own external applications
            return JobApplication.objects.filter(applicant=self.request.user, is_external_application=True).select_related('job', 'job__company')
    
    def perform_create(self, serializer):
        # Create external application with pending status
        serializer.save(
            applicant=self.request.user,
            status='pending',
            is_external_application=True,
            cover_letter=f"Applied via external link: {serializer.validated_data.get('external_url', 'N/A')}"
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get external application statistics"""
        if request.user.is_staff:
            # Admin stats
            total_external = JobApplication.objects.filter(is_external_application=True).count()
            total_internal = JobApplication.objects.filter(is_external_application=False).count()
            total_applications = JobApplication.objects.count()
            
            return Response({
                'total_external_applications': total_external,
                'total_internal_applications': total_internal,
                'total_applications': total_applications,
                'external_percentage': (total_external / total_applications * 100) if total_applications > 0 else 0
            })
        else:
            # User stats
            user_external = JobApplication.objects.filter(applicant=request.user, is_external_application=True).count()
            user_internal = JobApplication.objects.filter(applicant=request.user, is_external_application=False).count()
            user_total = JobApplication.objects.filter(applicant=request.user).count()
            
            return Response({
                'total_external_applications': user_external,
                'total_internal_applications': user_internal,
                'total_applications': user_total,
                'external_percentage': (user_external / user_total * 100) if user_total > 0 else 0
            }) 
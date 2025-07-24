from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Company, CompanyEmployee, CompanyReview
from .serializers import CompanySerializer, CompanyEmployeeSerializer, CompanyReviewSerializer
from .serializers import AdminCompanySerializer, AdminCompanyEmployeeSerializer, AdminCompanyReviewSerializer
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

class CompanyPagination(PageNumberPagination):
    """
    Custom pagination class for companies
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

class CompanyEmployeeViewSet(viewsets.ModelViewSet):
    queryset = CompanyEmployee.objects.all()
    serializer_class = CompanyEmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

class CompanyReviewViewSet(viewsets.ModelViewSet):
    queryset = CompanyReview.objects.all()
    serializer_class = CompanyReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

class AdminCompanyViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all companies
    """
    serializer_class = AdminCompanySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Company.objects.all()
    lookup_field = 'slug'
    pagination_class = CompanyPagination
    
    def get_queryset(self):
        queryset = Company.objects.all()
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Filter by verification status
        verified = self.request.query_params.get('verified', None)
        if verified is not None:
            if verified.lower() == 'true':
                queryset = queryset.filter(is_verified=True)
            elif verified.lower() == 'false':
                queryset = queryset.filter(is_verified=False)
        
        # Filter by featured status
        featured = self.request.query_params.get('featured', None)
        if featured is not None:
            if featured.lower() == 'true':
                queryset = queryset.filter(is_featured=True)
            elif featured.lower() == 'false':
                queryset = queryset.filter(is_featured=False)
        
        # Filter by industry
        industry = self.request.query_params.get('industry', None)
        if industry:
            queryset = queryset.filter(industry_id=industry)
        
        # Filter by company size
        company_size = self.request.query_params.get('company_size', None)
        if company_size:
            queryset = queryset.filter(company_size=company_size)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def toggle_verification(self, request, slug=None):
        """Toggle company verification status"""
        company = self.get_object()
        company.is_verified = not company.is_verified
        company.save()
        
        serializer = self.get_serializer(company)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def toggle_featured(self, request, slug=None):
        """Toggle company featured status"""
        company = self.get_object()
        company.is_featured = not company.is_featured
        company.save()
        
        serializer = self.get_serializer(company)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get company statistics"""
        total_companies = Company.objects.count()
        verified_companies = Company.objects.filter(is_verified=True).count()
        featured_companies = Company.objects.filter(is_featured=True).count()
        
        # Company sizes
        startup_companies = Company.objects.filter(company_size='startup').count()
        small_companies = Company.objects.filter(company_size='small').count()
        medium_companies = Company.objects.filter(company_size='medium').count()
        large_companies = Company.objects.filter(company_size='large').count()
        enterprise_companies = Company.objects.filter(company_size='enterprise').count()
        
        # Recent activity
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        new_companies_today = Company.objects.filter(created_at__date=today).count()
        new_companies_this_week = Company.objects.filter(created_at__date__gte=week_ago).count()
        new_companies_this_month = Company.objects.filter(created_at__date__gte=month_ago).count()
        
        return Response({
            'total_companies': total_companies,
            'verified_companies': verified_companies,
            'featured_companies': featured_companies,
            'company_sizes': {
                'startup': startup_companies,
                'small': small_companies,
                'medium': medium_companies,
                'large': large_companies,
                'enterprise': enterprise_companies,
            },
            'recent_activity': {
                'new_companies_today': new_companies_today,
                'new_companies_this_week': new_companies_this_week,
                'new_companies_this_month': new_companies_this_month,
            }
        })
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent company activity"""
        limit = int(request.query_params.get('limit', 10))
        
        recent_companies = Company.objects.order_by('-created_at')[:limit]
        
        return Response({
            'recent_companies': AdminCompanySerializer(recent_companies, many=True).data,
        })

class AdminCompanyEmployeeViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing company employees
    """
    serializer_class = AdminCompanyEmployeeSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CompanyEmployee.objects.all()
    
    def get_queryset(self):
        queryset = CompanyEmployee.objects.all().select_related('company', 'user')
        
        # Filter by company
        company = self.request.query_params.get('company', None)
        if company:
            queryset = queryset.filter(company_id=company)
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        active = self.request.query_params.get('active', None)
        if active is not None:
            if active.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif active.lower() == 'false':
                queryset = queryset.filter(is_active=False)
        
        return queryset.order_by('-created_at')

class AdminCompanyReviewViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing company reviews
    """
    serializer_class = AdminCompanyReviewSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CompanyReview.objects.all()
    
    def get_queryset(self):
        queryset = CompanyReview.objects.all().select_related('company', 'user')
        
        # Filter by company
        company = self.request.query_params.get('company', None)
        if company:
            queryset = queryset.filter(company_id=company)
        
        # Filter by rating
        rating = self.request.query_params.get('rating', None)
        if rating:
            queryset = queryset.filter(rating=rating)
        
        # Filter by approval status
        approved = self.request.query_params.get('approved', None)
        if approved is not None:
            if approved.lower() == 'true':
                queryset = queryset.filter(is_approved=True)
            elif approved.lower() == 'false':
                queryset = queryset.filter(is_approved=False)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def toggle_approval(self, request, pk=None):
        """Toggle review approval status"""
        review = self.get_object()
        review.is_approved = not review.is_approved
        review.save()
        
        serializer = self.get_serializer(review)
        return Response(serializer.data) 
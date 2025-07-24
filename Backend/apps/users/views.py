from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import UserProfile, UserExperience, UserEducation
from .serializers import UserProfileSerializer, UserExperienceSerializer, UserEducationSerializer
from .serializers import AdminUserSerializer, AdminUserProfileSerializer
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = UserExperienceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserExperience.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserEducationViewSet(viewsets.ModelViewSet):
    serializer_class = UserEducationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserEducation.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all users
    """
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all().select_related('profile')
    
    def get_queryset(self):
        # For admin management, show all users including soft-deleted ones
        queryset = User.objects.all().select_related('profile')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(profile__phone__icontains=search) |
                Q(profile__location_text__icontains=search)
            )
        
        # Filter by user type
        user_type = self.request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            if status_filter == 'active':
                queryset = queryset.filter(is_active=True)
            elif status_filter == 'inactive':
                queryset = queryset.filter(is_active=False)
            elif status_filter == 'verified':
                queryset = queryset.filter(is_verified=True)
            elif status_filter == 'unverified':
                queryset = queryset.filter(is_verified=False)
        
        # Filter by staff/superuser
        staff_filter = self.request.query_params.get('staff', None)
        if staff_filter:
            if staff_filter == 'staff':
                queryset = queryset.filter(is_staff=True)
            elif staff_filter == 'superuser':
                queryset = queryset.filter(is_superuser=True)
        
        # Date range filter
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(date_joined__gte=date_from)
        if date_to:
            queryset = queryset.filter(date_joined__lte=date_to)
        
        return queryset.order_by('-date_joined')
    
    @action(detail=True, methods=['patch'])
    def toggle_status(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def toggle_verification(self, request, pk=None):
        """Toggle user verification status"""
        user = self.get_object()
        user.is_verified = not user.is_verified
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='toggle-verified')
    def toggle_verified(self, request, pk=None):
        """Toggle user verification status (alternative endpoint name)"""
        return self.toggle_verification(request, pk)
    
    @action(detail=True, methods=['patch'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        """Toggle user active status (alternative endpoint name)"""
        return self.toggle_status(request, pk)
    
    @action(detail=True, methods=['patch'])
    def toggle_staff(self, request, pk=None):
        """Toggle user staff status"""
        user = self.get_object()
        user.is_staff = not user.is_staff
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def toggle_superuser(self, request, pk=None):
        """Toggle user superuser status"""
        user = self.get_object()
        user.is_superuser = not user.is_superuser
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        # Only count non-deleted users for statistics
        total_users = User.objects.filter(is_deleted=False).count()
        active_users = User.objects.filter(is_active=True, is_deleted=False).count()
        verified_users = User.objects.filter(is_verified=True, is_deleted=False).count()
        staff_users = User.objects.filter(is_staff=True, is_deleted=False).count()
        superusers = User.objects.filter(is_superuser=True, is_deleted=False).count()
        
        # User types (only non-deleted)
        job_seekers = User.objects.filter(user_type='job_seeker', is_deleted=False).count()
        employers = User.objects.filter(user_type='employer', is_deleted=False).count()
        admins = User.objects.filter(user_type='admin', is_deleted=False).count()
        
        # Recent activity
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        new_users_today = User.objects.filter(date_joined__date=today, is_deleted=False).count()
        new_users_this_week = User.objects.filter(date_joined__date__gte=week_ago, is_deleted=False).count()
        new_users_this_month = User.objects.filter(date_joined__date__gte=month_ago, is_deleted=False).count()
        
        return Response({
            'total': total_users,
            'active': active_users,
            'verified': verified_users,
            'new_today': new_users_today,
            'new_week': new_users_this_week,
            'by_type': {
                'job_seekers': job_seekers,
                'employers': employers,
                'admins': admins,
            },
            'with_profiles': UserProfile.objects.filter(user__is_deleted=False).count(),
            'with_experience': UserExperience.objects.filter(user__is_deleted=False).count(),
            'with_education': UserEducation.objects.filter(user__is_deleted=False).count(),
        })
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent user activity"""
        limit = int(request.query_params.get('limit', 10))
        
        recent_users = User.objects.order_by('-date_joined')[:limit]
        recent_logins = User.objects.filter(last_login__isnull=False).order_by('-last_login')[:limit]
        
        return Response({
            'recent_registrations': AdminUserSerializer(recent_users, many=True).data,
            'recent_logins': AdminUserSerializer(recent_logins, many=True).data,
        })
    
    def destroy(self, request, *args, **kwargs):
        """Custom destroy method for user deletion"""
        try:
            user = self.get_object()
            
            # Prevent deletion of superusers (optional safety check)
            if user.is_superuser and user != request.user:
                return Response(
                    {'error': 'Cannot delete superuser accounts'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Prevent self-deletion
            if user == request.user:
                return Response(
                    {'error': 'Cannot delete your own account'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Permanently delete the user (hard delete)
            user.hard_delete()
            
            return Response(
                {'message': 'User permanently deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 
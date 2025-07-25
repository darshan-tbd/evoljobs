from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import SubscriptionPlan, UserSubscription, DailyApplicationUsage
from .serializers import (
    SubscriptionPlanSerializer, UserSubscriptionSerializer, DailyApplicationUsageSerializer,
    SubscriptionStatusSerializer, ApplicationStatsSerializer, SubscriptionPlanCreateSerializer,
    UserSubscriptionCreateSerializer, AdminUserSubscriptionSerializer
)
from .services import SubscriptionService

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

class UserSubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserSubscription.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Get current subscription status"""
        status_data = SubscriptionService.get_subscription_status(request.user)
        serializer = SubscriptionStatusSerializer(status_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get application statistics"""
        stats_data = SubscriptionService.get_application_stats(request.user)
        serializer = ApplicationStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def usage_history(self, request):
        """Get usage history"""
        days = int(request.query_params.get('days', 30))
        usage_records = SubscriptionService.get_usage_history(request.user, days)
        serializer = DailyApplicationUsageSerializer(usage_records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """Subscribe to a plan"""
        try:
            print(f"Subscription request from user: {request.user.email}")
            print(f"Request data: {request.data}")
            
            serializer = UserSubscriptionCreateSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                subscription = serializer.save()
                print(f"Subscription created successfully: {subscription.id}")
                return Response({
                    'message': 'Subscription created successfully',
                    'subscription': UserSubscriptionSerializer(subscription).data
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating subscription: {str(e)}")
            return Response({
                'error': 'Failed to create subscription',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription"""
        try:
            subscription = self.get_object()
            subscription.status = 'cancelled'
            subscription.is_active = False
            subscription.save()
            return Response({'message': 'Subscription cancelled successfully'})
        except UserSubscription.DoesNotExist:
            return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)

class AdminSubscriptionPlanViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing subscription plans"""
    serializer_class = SubscriptionPlanCreateSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """Get queryset excluding soft-deleted plans"""
        return SubscriptionPlan.objects.filter(is_deleted=False)
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SubscriptionPlanCreateSerializer
        return SubscriptionPlanSerializer
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a subscription plan. 
        Use ?hard=true for hard delete, otherwise performs soft delete.
        """
        instance = self.get_object()
        hard_delete = request.query_params.get('hard', 'false').lower() == 'true'
        
        if hard_delete:
            # Check if there are any active subscriptions for this plan
            from .models import UserSubscription
            active_subscriptions = UserSubscription.objects.filter(
                plan=instance, 
                is_active=True, 
                status='active',
                is_deleted=False
            ).count()
            
            if active_subscriptions > 0:
                return Response({
                    'error': f'Cannot delete plan with {active_subscriptions} active subscriptions'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Hard delete
            instance.hard_delete()
        else:
            # Soft delete (default)
            instance.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminUserSubscriptionViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing user subscriptions"""
    serializer_class = AdminUserSubscriptionSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """Get queryset excluding soft-deleted subscriptions"""
        return UserSubscription.objects.filter(is_deleted=False).select_related('user', 'plan')
    
    @action(detail=False, methods=['post'])
    def check_expired(self, request):
        """Check and update expired subscriptions"""
        count = SubscriptionService.check_and_update_expired_subscriptions()
        return Response({
            'message': f'{count} expired subscriptions updated',
            'updated_count': count
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get subscription statistics"""
        from django.contrib.auth import get_user_model
        from django.db.models import Sum
        
        User = get_user_model()
        
        total_subscriptions = UserSubscription.objects.count()
        active_subscriptions = UserSubscription.objects.filter(is_active=True, status='active').count()
        expired_subscriptions = UserSubscription.objects.filter(status='expired').count()
        
        # Calculate monthly revenue from active subscriptions
        active_subscription_plans = UserSubscription.objects.filter(
            is_active=True, 
            status='active'
        ).select_related('plan')
        
        monthly_revenue = sum(subscription.plan.price for subscription in active_subscription_plans)
        
        # Get total users count
        total_users = User.objects.count()
        
        # Plan distribution
        plan_distribution = {}
        for plan in SubscriptionPlan.objects.filter(is_active=True):
            count = UserSubscription.objects.filter(plan=plan, is_active=True, status='active').count()
            plan_distribution[plan.name] = count
        
        return Response({
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': active_subscriptions,
            'expired_subscriptions': expired_subscriptions,
            'monthly_revenue': float(monthly_revenue),
            'total_users': total_users,
            'plan_distribution': plan_distribution
        })

class SubscriptionLimitViewSet(viewsets.ViewSet):
    """ViewSet for checking subscription limits"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def check_limit(self, request):
        """Check if user can apply to a job"""
        job_id = request.query_params.get('job_id')
        if not job_id:
            return Response({'error': 'job_id parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from apps.jobs.models import JobPosting
            job = JobPosting.objects.get(id=job_id)
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)
        
        can_apply = SubscriptionService.can_apply_to_job(request.user, job)
        remaining = SubscriptionService.get_remaining_applications(request.user)
        daily_limit = SubscriptionService.get_daily_application_limit(request.user)
        used_today = SubscriptionService.get_today_usage(request.user).applications_count
        
        return Response({
            'can_apply': can_apply,
            'remaining_applications': remaining,
            'daily_limit': daily_limit,
            'used_today': used_today,
            'job_company_id': str(job.company.id)
        })
    
    @action(detail=False, methods=['get'])
    def usage_summary(self, request):
        """Get usage summary for today"""
        usage = SubscriptionService.get_today_usage(request.user)
        daily_limit = SubscriptionService.get_daily_application_limit(request.user)
        remaining = usage.get_remaining_applications(daily_limit)
        
        return Response({
            'used_today': usage.applications_count,
            'remaining_today': remaining,
            'daily_limit': daily_limit,
            'companies_applied_today': usage.companies_applied,
            'date': usage.date.isoformat()
        }) 
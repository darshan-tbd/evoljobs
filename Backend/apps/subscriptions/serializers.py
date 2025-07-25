from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SubscriptionPlan, UserSubscription, DailyApplicationUsage
from .services import SubscriptionService

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user information in admin views"""
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'price', 'duration_days', 
            'features', 'is_active', 'daily_application_limit', 
            'plan_type', 'priority_support', 'advanced_analytics', 
            'custom_branding', 'api_access'
        ]

class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = UserSubscription
        fields = [
            'id', 'user', 'plan', 'plan_id', 'start_date', 'end_date', 
            'is_active', 'status', 'auto_renew', 'days_remaining', 'is_expired'
        ]
        read_only_fields = ['user', 'days_remaining', 'is_expired']
    
    def create(self, validated_data):
        plan_id = validated_data.pop('plan_id')
        validated_data['plan_id'] = plan_id
        return super().create(validated_data)

class DailyApplicationUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyApplicationUsage
        fields = ['id', 'user', 'date', 'applications_count', 'companies_applied']

class SubscriptionStatusSerializer(serializers.Serializer):
    """Serializer for comprehensive subscription status"""
    has_active_subscription = serializers.BooleanField()
    plan_name = serializers.CharField()
    plan_type = serializers.CharField()
    daily_limit = serializers.IntegerField()
    used_today = serializers.IntegerField()
    remaining_today = serializers.IntegerField()
    companies_applied_today = serializers.ListField(child=serializers.CharField())
    subscription_end_date = serializers.DateTimeField(allow_null=True)
    days_remaining = serializers.IntegerField()
    is_expired = serializers.BooleanField()
    features = serializers.ListField(child=serializers.CharField())
    price = serializers.FloatField()

class ApplicationStatsSerializer(serializers.Serializer):
    """Serializer for application statistics"""
    total_applications = serializers.IntegerField()
    monthly_applications = serializers.IntegerField()
    unique_companies = serializers.IntegerField()
    current_plan = serializers.DictField()
    today_usage = serializers.DictField()

class SubscriptionPlanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating subscription plans (admin only)"""
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'description', 'price', 'duration_days', 
            'features', 'is_active', 'daily_application_limit', 
            'plan_type', 'priority_support', 'advanced_analytics', 
            'custom_branding', 'api_access'
        ]
        read_only_fields = ['id']

class UserSubscriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating user subscriptions"""
    plan_id = serializers.UUIDField()
    start_date = serializers.DateTimeField(required=False, allow_null=True)
    end_date = serializers.DateTimeField(required=False, allow_null=True)
    auto_renew = serializers.BooleanField(required=False, default=True)
    
    class Meta:
        model = UserSubscription
        fields = ['plan_id', 'start_date', 'end_date', 'auto_renew']
    
    def create(self, validated_data):
        from apps.subscriptions.models import SubscriptionPlan
        
        plan_id = validated_data.pop('plan_id')
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid plan ID")
        
        user = self.context['request'].user
        
        # Use the service to create subscription
        subscription = SubscriptionService.create_subscription(
            user=user,
            plan=plan,
            start_date=validated_data.get('start_date'),
            end_date=validated_data.get('end_date')
        )
        
        # Set auto_renew if provided
        if 'auto_renew' in validated_data:
            subscription.auto_renew = validated_data['auto_renew']
            subscription.save()
        
        return subscription

class AdminUserSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for admin user subscription management"""
    user = UserSerializer(read_only=True)
    plan = SubscriptionPlanSerializer(read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = [
            'id', 'user', 'plan', 'start_date', 'end_date', 
            'is_active', 'status', 'auto_renew', 'days_remaining', 'is_expired'
        ]
        read_only_fields = ['days_remaining', 'is_expired'] 